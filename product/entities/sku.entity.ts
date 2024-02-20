import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SkuAttribute } from './sku-attribute.entity';

import { Cart } from '../../cart/entities/cart.entity';
import { Notify } from '../../notify/entities/notify.entity';
import { OrderProduct } from '../../order/entities/order-product.entity';
import { Warehouse } from '../../warehouse/entities/warehouse.entity';
import { WarehouseSkusStock } from '../../warehouse/entities/warehouseSkuQty.entity';
import { Wishlist } from '../../wishlist/entities/wishlist.entity';
import { Product } from './product.entity';
import { SkuStock } from './sku-stock.entity';

export enum VariationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity()
export class Sku {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Product, (product) => product.skus, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @OneToOne(() => Notify, (notify) => notify.sku)
  notify: Notify;

  @Column({ type: 'bigint', name: 'product_id', nullable: false })
  productId: number;

  @Column({ type: 'text', nullable: true })
  images: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  sku: string;

  @Column({ type: 'varchar', name: 'custom_sku', length: 100, nullable: true })
  customSku: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  barcode: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  sbarcode: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stylecode: string;

  @Column({ type: 'double', name: 'vat', nullable: true, default: 0.0 })
  vat: number;

  @Column({ type: 'double', name: 'purchase_price', nullable: true })
  purchasePrice: number;

  @Column({ type: 'double', nullable: false })
  price: number;

  @Column({
    type: 'varchar',
    name: 'discounted_type',
    nullable: true,
  })
  discountedType: string;

  @Column({
    type: 'int',
    name: 'discounted_value',
    nullable: true,
  })
  discountedValue: number;

  @Column({
    type: 'double',
    name: 'discounted_price',
    nullable: false,
  })
  discountedPrice: number;

  @Column({ type: 'datetime', name: 'discounted_price_start', nullable: true })
  discountedPriceStart: Date;

  @Column({ type: 'datetime', name: 'discounted_price_end', nullable: true })
  discountedPriceEnd: Date;

  @Column({ type: 'int', name: 'stock_quantity', nullable: false })
  stockQuantity: number;

  @Column({
    type: 'enum',
    enum: VariationStatus,
    default: VariationStatus.ACTIVE,
  })
  status: VariationStatus;

  @Column({ type: 'boolean', name: 'pre_order', default: false })
  preOrder: boolean;

  @Column({ type: 'double', name: 'pre_order_per', nullable: true })
  preOrderPer: number;

  @Column({ type: 'boolean', name: 'stock_out', default: false })
  stockOut: boolean;

  @Column({ type: 'varchar', name: 'model_no', length: 255, nullable: true })
  modelNo: string;

  @Column({ type: 'double', name: 'cost_price', nullable: true })
  costPrice: number;

  @Column({ type: 'double', name: 'point_earn', nullable: true })
  pointEarn: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @OneToMany(() => SkuAttribute, (item) => item.sku)
  attributes: SkuAttribute[];

  @OneToMany(() => OrderProduct, (item) => item.sku)
  orders: OrderProduct[];

  @OneToMany(() => SkuStock, (skuStock) => skuStock.sku)
  stocks: SkuStock[];

  @OneToMany(() => Cart, (cart) => cart.sku)
  carts: Cart[];

  @OneToMany(() => Wishlist, (wishlist) => wishlist.sku)
  wishlists: Wishlist[];

  // @OneToMany(() => WarehouseSkusStock, (item) => item.sku)
  // warehouseSku: WarehouseSkusStock[];
  @ManyToMany(() => Warehouse, (item) => item.skus, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinTable({
    name: 'warehouse_skus_stock',
    joinColumn: {
      name: 'sku_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'warehouse_id',
      referencedColumnName: 'id',
    },
  })
  warehouses: Warehouse[];

  // relation qith warehouseSkuQty and get qty
  @OneToMany(() => WarehouseSkusStock, (item) => item.skus)
  warehouseSkusStock: WarehouseSkusStock[];
}
