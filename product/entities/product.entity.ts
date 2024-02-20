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
import { Brand } from '../../brand/entities/brand.entity';

import { Category } from '../../category/entities/category.entity';
import { OrderProduct } from '../../order/entities/order-product.entity';
import { Seo } from '../../seo/entities/seo.entity';
import { Sku } from './sku.entity';
import { Specification } from './specification.entity';
import { ProductLog } from '../entities/product-log.entity';

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft',
}

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint', name: 'merge_id', nullable: true })
  mergeId: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  barcode: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  sbarcode: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stylecode: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  hscode: string;

  @Column({
    type: 'varchar',
    name: 'category_code',
    length: 255,
    nullable: true,
  })
  categoryCode: string;

  @Column({
    type: 'varchar',
    name: 'subcategory_code',
    length: 255,
    nullable: true,
  })
  subcategoryCode: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  slug: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  sku: string;

  @Column({ type: 'varchar', name: 'custom_sku', length: 255, nullable: true })
  customSku: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  thumbnail: string;

  @Column({ type: 'text', name: 'short_description', nullable: true })
  shortDescription: string;

  @Column({ type: 'text', name: 'long_description', nullable: true })
  longDescription: string;

  @Column({ type: 'double', name: 'vat', nullable: true, default: 0.0 })
  vat: number;

  @ManyToOne(() => Category, (category) => category.products, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ type: 'bigint', name: 'category_id', nullable: true })
  categoryId: number;

  @ManyToOne(() => Brand, (brand) => brand.products, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'brand_id' })
  brand: Brand;

  @Column({ type: 'bigint', name: 'brand_id', nullable: true })
  brandId: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'variation_keys',
  })
  variationKeys: string;

  @Column({ type: 'boolean', name: 'is_live', default: true })
  isLive: boolean;

  @Column({ type: 'boolean', name: 'is_featured', default: false })
  isFeatured: boolean;

  @Column({ type: 'int', name: 'featured_order', nullable: true })
  featuredOrder: number;

  @Column({ type: 'longtext', name: 'gift', nullable: true })
  gift: string;

  @Column({ type: 'double', name: 'inside_dhaka', nullable: true })
  insideDhaka: number;

  @Column({ type: 'double', name: 'outside_dhaka', nullable: true })
  outsideDhaka: number;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.DRAFT,
  })
  status: ProductStatus;

  @Column({ type: 'int', name: 'mediasoft_model_id', nullable: true })
  mediaSoftId: number;

  @Column({ type: 'text', name: 'mediasoft_model_name', nullable: true })
  mediaSoftName: string;

  @Column({ type: 'boolean', name: 'display_only', default: false })
  displayOnly: boolean;

  @Column({
    type: 'varchar',
    name: 'warranty_type',
    length: 255,
    nullable: true,
  })
  warrantyType: string;

  @Column({ type: 'varchar', name: 'warranty', length: 255, nullable: true })
  warranty: string;

  @Column({ type: 'text', name: 'warranty_policy', nullable: true })
  warrantyPolicy: string;

  @Column({ type: 'double', name: 'package_weight', nullable: true })
  packageWeight: number;

  @Column({ type: 'double', name: 'package_length', nullable: true })
  packageLength: number;

  @Column({ type: 'double', name: 'package_width', nullable: true })
  packageWidth: number;

  @Column({ type: 'double', name: 'package_height', nullable: true })
  packageHeight: number;

  @Column({
    type: 'varchar',
    name: 'dangerous_goods_type',
    length: 255,
    nullable: true,
  })
  dangerousGoodsType: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @OneToMany(() => Sku, (item) => item.product)
  skus: Sku[];

  @OneToMany(() => Specification, (item) => item.product)
  specifications: Specification[];

  @OneToMany(() => OrderProduct, (item) => item.product)
  orders: OrderProduct[];

  @OneToOne(() => Seo, (item) => item.product)
  seo: Seo;

  @OneToOne(() => ProductLog, (item) => item.product, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id' })
  productLog: ProductLog;
}
