import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Sku } from './sku.entity';

@Entity()
export class SkuStock {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Sku, (item) => item.stocks, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sku_id' })
  sku: Sku;

  @Column({ type: 'bigint', name: 'sku_id', nullable: false })
  skuId: number;

  @Column({ type: 'varchar', length: 255, name: 'store_code', nullable: false })
  storeCode: string;

  @Column({ type: 'varchar', length: 255, name: 'store_name', nullable: false })
  storeName: string;

  @Column({ type: 'int', name: 'stock_quantity', nullable: false })
  stockQuantity: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
