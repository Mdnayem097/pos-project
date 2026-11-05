import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { money } from '../common/money';
import { Sale } from '../sales/sale.entity';
import { ReturnItem } from './return-item.entity';

@Entity('returns')
export class Return {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'return_no', unique: true })
  returnNo: string;

  @Column({ name: 'order_id' })
  orderId: number;

  @ManyToOne(() => Sale, { eager: true, onDelete: 'CASCADE' })
  order: Sale;

  @Column({ name: 'refund_method', default: 'Cash' })
  refundMethod: string;

  @Column({
    name: 'refund_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: money,
    default: 0,
  })
  refundAmount: number;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'varchar', default: 'Completed' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => ReturnItem, (item) => item.returnRecord, { cascade: true })
  items: ReturnItem[];
}
