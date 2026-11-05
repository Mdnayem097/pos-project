import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { Product } from '../products/product.entity';
import { Sale, SaleItem } from '../sales/sale.entity';
import { CreateReturnDto } from './dto/create-return.dto';
import { GetReturnsQueryDto } from './dto/get-returns-query.dto';
import { ReturnItem } from './return-item.entity';
import { Return } from './return.entity';

@Injectable()
export class ReturnsService {
  constructor(
    @InjectRepository(Return)
    private readonly returnRepo: Repository<Return>,
    @InjectRepository(ReturnItem)
    private readonly returnItemRepo: Repository<ReturnItem>,
    @InjectRepository(Sale)
    private readonly saleRepo: Repository<Sale>,
    @InjectRepository(SaleItem)
    private readonly saleItemRepo: Repository<SaleItem>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(query: GetReturnsQueryDto) {
    const qb = this.returnRepo
      .createQueryBuilder('ret')
      .leftJoinAndSelect('ret.order', 'order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('ret.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('items.saleItem', 'saleItem')
      .orderBy('ret.createdAt', 'DESC');

    if (query.orderId) {
      qb.andWhere('ret.orderId = :orderId', { orderId: query.orderId });
    }

    if (query.from && query.to) {
      const fromDate = new Date(query.from);
      const toDate = new Date(query.to);
      toDate.setHours(23, 59, 59, 999);
      qb.andWhere('ret.createdAt BETWEEN :from AND :to', {
        from: fromDate,
        to: toDate,
      });
    } else if (query.from) {
      qb.andWhere('ret.createdAt >= :from', { from: new Date(query.from) });
    } else if (query.to) {
      const toDate = new Date(query.to);
      toDate.setHours(23, 59, 59, 999);
      qb.andWhere('ret.createdAt <= :to', { to: toDate });
    }

    if (query.q) {
      const search = `%${query.q.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(ret.returnNo) LIKE :search OR LOWER(order.invoiceNo) LIKE :search OR LOWER(order.customerName) LIKE :search OR LOWER(customer.name) LIKE :search)',
        { search },
      );
    }

    return qb.getMany();
  }

  async findOne(id: number) {
    const returnRecord = await this.returnRepo.findOne({
      where: { id },
      relations: {
        order: { customer: true, items: true },
        items: { product: true, saleItem: true },
      },
    });

    if (!returnRecord) {
      throw new NotFoundException(`Return #${id} was not found`);
    }

    return returnRecord;
  }

  async getReturnableItems(orderId: number) {
    const sale = await this.saleRepo.findOne({
      where: { id: orderId },
      relations: { items: { product: true }, customer: true },
    });

    if (!sale) {
      throw new NotFoundException(`Order / Sale #${orderId} was not found`);
    }

    // Fetch existing returns for this order
    const existingReturns = await this.returnRepo.find({
      where: { orderId },
      relations: { items: true },
    });

    // Map already returned qty per saleItemId
    const returnedQtyMap = new Map<number, number>();
    for (const ret of existingReturns) {
      for (const item of ret.items) {
        if (item.saleItemId) {
          const current = returnedQtyMap.get(item.saleItemId) || 0;
          returnedQtyMap.set(item.saleItemId, current + item.qty);
        }
      }
    }

    const items = sale.items.map((si) => {
      const alreadyReturnedQty = returnedQtyMap.get(si.id) || 0;
      const returnableQty = Math.max(0, si.qty - alreadyReturnedQty);

      return {
        orderItemId: si.id,
        productId: si.product.id,
        productName: si.product.name,
        sku: si.product.sku,
        emoji: si.product.emoji,
        unitPrice: Number(si.unitPrice),
        originalQty: si.qty,
        alreadyReturnedQty,
        returnableQty,
      };
    });

    return {
      orderId: sale.id,
      invoiceNo: sale.invoiceNo,
      orderDate: sale.createdAt,
      customerName: sale.customerName || sale.customer?.name || 'Walk in customer',
      total: Number(sale.total),
      paymentMethod: sale.payment,
      items,
      canReturnAny: items.some((i) => i.returnableQty > 0),
    };
  }

  async create(dto: CreateReturnDto) {
    return this.dataSource.transaction(async (manager) => {
      const sale = await manager.findOne(Sale, {
        where: { id: dto.orderId },
        relations: { items: { product: true }, customer: true },
      });

      if (!sale) {
        throw new NotFoundException(`Order #${dto.orderId} was not found`);
      }

      // Check existing returns to compute available returnable quantities
      const existingReturns = await manager.find(Return, {
        where: { orderId: dto.orderId },
        relations: { items: true },
      });

      const returnedQtyMap = new Map<number, number>();
      for (const ret of existingReturns) {
        for (const item of ret.items) {
          if (item.saleItemId) {
            const current = returnedQtyMap.get(item.saleItemId) || 0;
            returnedQtyMap.set(item.saleItemId, current + item.qty);
          }
        }
      }

      let totalRefund = 0;
      const returnItemsToSave: ReturnItem[] = [];

      for (const line of dto.items) {
        const saleItem = sale.items.find((si) => si.id === line.orderItemId);
        if (!saleItem) {
          throw new BadRequestException(
            `Sale item #${line.orderItemId} does not belong to order #${dto.orderId}`,
          );
        }

        const alreadyReturned = returnedQtyMap.get(saleItem.id) || 0;
        const returnableQty = saleItem.qty - alreadyReturned;

        if (line.qty > returnableQty) {
          throw new BadRequestException(
            `Cannot return ${line.qty} of "${saleItem.product.name}"; only ${returnableQty} remaining eligible for return.`,
          );
        }

        // Restock product stock in database
        const product = await manager.findOne(Product, {
          where: { id: saleItem.product.id },
          lock: { mode: 'pessimistic_write' },
        });

        if (product) {
          product.stock += line.qty;
          await manager.save(product);
        }

        const unitPrice = Number(saleItem.unitPrice);
        const lineRefund = Math.round(unitPrice * line.qty * 100) / 100;
        totalRefund += lineRefund;

        const returnItem = manager.create(ReturnItem, {
          saleItemId: saleItem.id,
          productId: saleItem.product.id,
          product: saleItem.product,
          qty: line.qty,
          unitPrice,
          refundAmount: lineRefund,
          reason: line.reason || dto.reason || 'Customer Return',
        });

        returnItemsToSave.push(returnItem);
        returnedQtyMap.set(saleItem.id, alreadyReturned + line.qty);
      }

      // Generate Return Number, e.g. RET-1001
      const count = await manager.count(Return);
      const returnNo = `RET-${1001 + count}`;

      const refundMethod = dto.refundMethod || sale.payment || 'Cash';

      const returnRecord = manager.create(Return, {
        returnNo,
        orderId: sale.id,
        order: sale,
        refundMethod,
        refundAmount: Math.round(totalRefund * 100) / 100,
        reason: dto.reason || 'Customer Return',
        status: 'Completed',
        items: returnItemsToSave,
      });

      const saved = await manager.save(returnRecord);

      // Check if all items in the original sale have been fully returned
      let allReturned = true;
      for (const si of sale.items) {
        const returned = returnedQtyMap.get(si.id) || 0;
        if (returned < si.qty) {
          allReturned = false;
          break;
        }
      }

      if (allReturned) {
        sale.status = 'Refunded';
        await manager.save(sale);
      }

      return this.findOne(saved.id);
    });
  }
}
