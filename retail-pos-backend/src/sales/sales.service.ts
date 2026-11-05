import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { DataSource, Repository } from 'typeorm';
import { Customer } from '../customers/customer.entity';
import { Product } from '../products/product.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { Sale, SaleItem } from './sale.entity';

const VAT_RATE = 0.05;
const round2 = (n: number) => Math.round(n * 100) / 100;

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale) private readonly repo: Repository<Sale>,
    private readonly dataSource: DataSource,
  ) {}

  findAll() {
    return this.repo.find({
      relations: { items: true, customer: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number) {
    const sale = await this.repo.findOne({
      where: { id },
      relations: { items: true, customer: true },
    });
    if (!sale) throw new NotFoundException(`Sale ${id} was not found`);
    return sale;
  }

  // Saves the sale and reduces stock in one transaction: either all of it happens or none.
  async create(dto: CreateSaleDto) {
    const saleId = await this.dataSource.transaction(async (m) => {
      let customer: Customer | null = null;
      if (dto.customerId) {
        customer = await m.findOneBy(Customer, { id: dto.customerId });
        if (!customer) throw new BadRequestException(`Customer ${dto.customerId} was not found`);
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
          payment: dto.payment,
          status: 'Completed',
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
