import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity()
export class Campaign {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'text', nullable: false, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  logo: string;

  @Column({ type: 'varchar', name: 'brand_id', length: 255, nullable: true })
  brandId: string;

  @Column({
    type: 'text',
    name: 'category_id',
    nullable: true,
  })
  categoryId: string;

  @Column({
    type: 'text',
    name: 'exclude_sku',
    nullable: true,
  })
  excludeSku: string;

  @Column({
    type: 'text',
    name: 'include_sku',
    nullable: true,
  })
  includeSku: string;

  @Column({ type: 'datetime', name: 'start_date', nullable: false })
  startDate: Date;

  @Column({ type: 'datetime', name: 'end_date', nullable: false })
  endDate: Date;

  @Column({ type: 'text', name: 'discount_type', nullable: false })
  discountType: string;

  @Column({ type: 'text', name: 'discount_value', nullable: false })
  discountValue: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp' })
  deletedAt: Date;
}
