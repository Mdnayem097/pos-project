import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Category } from '../categories/category.entity';
import { money } from '../common/money';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  sku: string;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: money })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: money })
  cost: number;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ name: 'reorder_level', type: 'int', default: 10 })
  reorderLevel: number;

  @Column({ type: 'varchar', default: '📦' })
  emoji: string;

  @ManyToOne(() => Category, (category) => category.products, { eager: true })
  category: Category;
}
