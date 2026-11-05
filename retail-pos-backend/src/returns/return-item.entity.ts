import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { money } from '../common/money';
import { Product } from '../products/product.entity';
import { SaleItem } from '../sales/sale.entity';
import { Return } from './return.entity';

@Entity('return_items')
export class ReturnItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'return_id' })
  returnId: number;

  @ManyToOne(() => Return, (r) => r.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'return_id' })
  returnRecord: Return;

  @Column({ name: 'sale_item_id', nullable: true })
  saleItemId: number | null;

  @ManyToOne(() => SaleItem, { eager: true, nullable: true })
  @JoinColumn({ name: 'sale_item_id' })
  saleItem: SaleItem | null;

  @Column({ name: 'product_id' })
  productId: number;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'product_id' })
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

  @Column({
    name: 'refund_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: money,
  })
  refundAmount: number;

  @Column({ type: 'varchar', nullable: true })
  reason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
