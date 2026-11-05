import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Customer } from '../customers/customer.entity';
import { Product } from '../products/product.entity';
import { money } from '../common/money';

export const PAYMENT_METHODS = ['Cash', 'Card', 'bKash', 'Nagad', 'COD'] as const;
export const SALE_STATUSES = [
  'Delivered',
  'Completed',
  'New',
  'Pending',
  'Refunded',
  'Cancelled',
] as const;

@Entity('sales')
export class Sale {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'invoice_no', unique: true })
  invoiceNo: string;

  // null means a walk-in customer
  @ManyToOne(() => Customer, { nullable: true, eager: true })
  customer: Customer | null;

  @Column({ name: 'customer_name', type: 'varchar', nullable: true })
  customerName: string | null;

  @Column({ name: 'customer_email', type: 'varchar', nullable: true })
  customerEmail: string | null;

  @Column({ type: 'varchar', default: 'POS' })
  source: string; // 'POS' | 'Website'

  @Column({ type: 'varchar', default: 'Cash' })
  payment: string;

  @Column({ type: 'varchar', default: 'Delivered' })
  status: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: money })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: money, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: money })
  vat: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: money })
  total: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => SaleItem, (item) => item.sale, { cascade: true })
  items: SaleItem[];
}

@Entity('sale_items')
export class SaleItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Sale, (sale) => sale.items, { onDelete: 'CASCADE' })
  sale: Sale;

  @ManyToOne(() => Product, { eager: true })
  product: Product;

  @Column({ type: 'int' })
  qty: number;

  @Column({
    name: 'unit_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: money,
  })
  unitPrice: number;
}
