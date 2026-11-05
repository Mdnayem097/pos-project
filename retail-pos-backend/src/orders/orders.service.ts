import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { DataSource, Repository } from 'typeorm';
import { Customer } from '../customers/customer.entity';
import { Product } from '../products/product.entity';
import { Sale, SaleItem } from '../sales/sale.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { GetOrdersQueryDto } from './dto/get-orders-query.dto';

const VAT_RATE = 0.05;
const round2 = (n: number) => Math.round(n * 100) / 100;

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Sale) private readonly saleRepo: Repository<Sale>,
    @InjectRepository(Customer) private readonly customerRepo: Repository<Customer>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(query: GetOrdersQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 10);
    const skip = (page - 1) * limit;

    const qb = this.saleRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.customer', 'c')
      .leftJoinAndSelect('s.items', 'i')
      .leftJoinAndSelect('i.product', 'p');

    if (query.q && query.q.trim()) {
      const search = query.q.trim();
      const cleanNum = search.replace(/^#/, '');
      qb.andWhere(
        '(s.invoiceNo LIKE :q OR CAST(s.id AS CHAR) LIKE :qClean OR c.name LIKE :q OR c.email LIKE :q OR s.customerName LIKE :q OR s.customerEmail LIKE :q OR s.payment LIKE :q)',
        { q: `%${search}%`, qClean: `%${cleanNum}%` },
      );
    }

    if (query.status && query.status !== 'All') {
      qb.andWhere('s.status = :status', { status: query.status });
    }

    if (query.source && query.source !== 'All') {
      qb.andWhere('s.source = :source', { source: query.source });
    }

    const sortDirection = query.sortOrder === 'ASC' ? 'ASC' : 'DESC';
    qb.orderBy('s.id', sortDirection);
    qb.skip(skip).take(limit);

    const [sales, total] = await qb.getManyAndCount();

    const data = sales.map((s) => ({
      id: s.id,
      orderId: `#${s.id}`,
      invoiceNo: s.invoiceNo,
      name: s.customer?.name || s.customerName || 'Walk in customer',
      email: s.customer?.email || s.customerEmail || 'walkincustomer@gmail.com',
      source: s.source || 'POS',
      method: s.payment || 'Cash',
      total: s.total,
      subtotal: s.subtotal,
      vat: s.vat,
      discount: s.discount,
      status: s.status || 'Delivered',
      createdAt: s.createdAt,
      itemsCount: s.items?.reduce((acc, item) => acc + (item.qty || 1), 0) || s.items?.length || 0,
      items: (s.items || []).map((item) => ({
        id: item.id,
        productId: item.product?.id,
        name: item.product?.name || 'Item',
        sku: item.product?.sku || '',
        emoji: item.product?.emoji || '📦',
        qty: item.qty,
        unitPrice: item.unitPrice,
        total: round2(item.unitPrice * item.qty),
      })),
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async findOne(id: number) {
    const sale = await this.saleRepo.findOne({
      where: { id },
      relations: {
        customer: true,
        items: {
          product: true,
        },
      },
    });

    if (!sale) {
      throw new NotFoundException(`Order #${id} was not found`);
    }

    return {
      id: sale.id,
      orderId: `#${sale.id}`,
      invoiceNo: sale.invoiceNo,
      name: sale.customer?.name || sale.customerName || 'Walk in customer',
      email: sale.customer?.email || sale.customerEmail || 'walkincustomer@gmail.com',
      phone: sale.customer?.phone || null,
      source: sale.source || 'POS',
      method: sale.payment || 'Cash',
      subtotal: sale.subtotal,
      discount: sale.discount,
      vat: sale.vat,
      total: sale.total,
      status: sale.status || 'Delivered',
      createdAt: sale.createdAt,
      items: (sale.items || []).map((item) => ({
        id: item.id,
        productId: item.product?.id,
        name: item.product?.name || 'Item',
        sku: item.product?.sku || '',
        emoji: item.product?.emoji || '📦',
        qty: item.qty,
        unitPrice: item.unitPrice,
        total: round2(item.unitPrice * item.qty),
      })),
    };
  }

  async updateStatus(id: number, status: string) {
    const sale = await this.saleRepo.findOne({ where: { id } });
    if (!sale) {
      throw new NotFoundException(`Order #${id} was not found`);
    }

    sale.status = status;
    await this.saleRepo.save(sale);
    return this.findOne(id);
  }

  async remove(id: number) {
    const sale = await this.saleRepo.findOne({ where: { id } });
    if (!sale) {
      throw new NotFoundException(`Order #${id} was not found`);
    }

    await this.saleRepo.remove(sale);
    return { deleted: true, id };
  }

  async create(dto: CreateOrderDto) {
    const saleId = await this.dataSource.transaction(async (m) => {
      let customer: Customer | null = null;
      if (dto.customerId) {
        customer = await m.findOneBy(Customer, { id: dto.customerId });
      }

      let subtotal = 0;
      const items: SaleItem[] = [];

      for (const line of dto.items) {
        const product = await m.findOne(Product, {
          where: { id: line.productId },
          lock: { mode: 'pessimistic_write' },
          loadEagerRelations: false,
        });
        if (!product) throw new BadRequestException(`Product ${line.productId} was not found`);
        if (product.stock < line.qty) {
          throw new BadRequestException(
            `Not enough stock for ${product.name}: ${product.stock} left, ${line.qty} requested`,
          );
        }
        product.stock -= line.qty;
        await m.save(product);

        subtotal += product.price * line.qty;
        items.push(m.create(SaleItem, { product, qty: line.qty, unitPrice: product.price }));
      }

      const discount = round2((subtotal * (dto.discountPercent ?? 0)) / 100);
      const vat = round2((subtotal - discount) * VAT_RATE);
      const total = round2(subtotal - discount + vat);

      const sale = await m.save(
        m.create(Sale, {
          invoiceNo: `TMP-${randomUUID()}`,
          customer,
          customerName: dto.customerName || (customer ? customer.name : 'Walk in customer'),
          customerEmail:
            dto.customerEmail || (customer ? customer.email : 'walkincustomer@gmail.com'),
          source: dto.source || 'POS',
          payment: dto.payment || 'Cash',
          status: dto.status || 'Delivered',
          subtotal: round2(subtotal),
          discount,
          vat,
          total,
          items,
        }),
      );

      await m.update(Sale, sale.id, { invoiceNo: `INV-${1000 + sale.id}` });

      if (customer) {
        await m.update(Customer, customer.id, {
          loyaltyPoints: customer.loyaltyPoints + Math.floor(total / 100),
        });
      }

      return sale.id;
    });

    return this.findOne(saleId);
  }
}
