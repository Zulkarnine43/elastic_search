import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Sku } from './sku.entity';

@Entity()
export class SkuAttribute {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Sku, (item) => item.attributes, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sku_id' })
  sku: Sku;

  @Column({ type: 'bigint', name: 'sku_id', nullable: false })
  skuId: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  key: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  value: string;

  @Column({ type: 'varchar', nullable: true })
  code: string;

  @Column({ type: 'longtext', nullable: true })
  image: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
