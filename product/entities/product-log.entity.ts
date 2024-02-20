import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../entities/product.entity';
import { User } from '../../user/entities/user.entity';

export enum ProductLogStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity()
export class ProductLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint', name: 'user_id', nullable: false })
  userId: number;

  @Column({ type: 'bigint', name: 'product_id', nullable: true })
  productId: number;

  @Column({ type: 'varchar', name: 'type', nullable: true })
  type: string;

  @Column({ type: 'longtext', name: 'message', nullable: true })
  message: string;

  @Column({ type: 'longtext', name: 'old_data', nullable: true })
  oldData: string;

  @Column({ type: 'longtext', name: 'new_data', nullable: true })
  newData: string;

  @Column({
    type: 'enum',
    enum: ProductLogStatus,
    default: ProductLogStatus.ACTIVE,
  })
  status: ProductLogStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @OneToOne(() => Product, (item) => item.productLog)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @OneToOne(() => User, (item) => item.productLog)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
