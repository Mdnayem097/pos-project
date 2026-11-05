import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { money } from '../common/money';
import { Counter } from './counter.entity';

@Entity('counter_sessions')
export class CounterSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'counter_id' })
  counterId: number;

  @ManyToOne(() => Counter, (c) => c.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'counter_id' })
  counter: Counter;

  @Column({ name: 'cashier_name', default: 'Admin' })
  cashierName: string;

  @Column({
    name: 'opening_cash',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: money,
    default: 0,
  })
  openingCash: number;

  @CreateDateColumn({ name: 'opened_at' })
  openedAt: Date;

  @Column({
    name: 'closing_cash',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: money,
    nullable: true,
  })
  closingCash: number | null;

  @Column({ name: 'closed_at', type: 'datetime', nullable: true })
  closedAt: Date | null;

  @Column({
    name: 'expected_cash',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: money,
    nullable: true,
  })
  expectedCash: number | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: money,
    nullable: true,
  })
  difference: number | null;

  @Column({
    name: 'total_sales',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: money,
    default: 0,
  })
  totalSales: number;

  @Column({ name: 'total_orders', type: 'int', default: 0 })
  totalOrders: number;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ type: 'varchar', default: 'Open' })
  status: 'Open' | 'Closed';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
