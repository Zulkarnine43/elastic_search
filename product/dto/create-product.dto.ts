import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsString()
  longDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsNotEmpty()
  @IsNumber()
  categoryId: number;

  @IsOptional()
  @IsNumber()
  brandId?: number;

  @IsOptional()
  @IsString()
  sku: string;

  @IsOptional()
  @IsString()
  customSku: string;

  @IsOptional()
  specifications?: { key: string; value: string }[];

  @IsOptional()
  @IsString()
  variationKeys?: string;

  @IsOptional()
  @IsNumber()
  vat?: number;

  @IsOptional()
  @IsEnum(['No warranty', 'Brand warranty', 'Shop warranty'])
  warrantyType: 'No warranty' | 'Brand warranty' | 'Shop warranty';

  @IsOptional()
  @IsString()
  warranty?: string;

  @IsOptional()
  @IsString()
  warrantyPolicy?: string;

  @IsOptional()
  @IsNumber()
  packageWeight?: number;

  @IsOptional()
  @IsNumber()
  packageLength?: number;

  @IsOptional()
  @IsNumber()
  packageWidth?: number;

  @IsOptional()
  @IsNumber()
  packageHeight?: number;

  @IsOptional()
  @IsString()
  dangerousGoodsType?: string;

  @IsOptional()
  @IsBoolean()
  displayOnly: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured: boolean;

  @IsOptional()
  @IsNumber()
  featuredOrder?: number;

  @IsOptional()
  gift: { name: string; description: string }[];

  @IsOptional()
  @IsNumber()
  insideDhaka: number;

  @IsOptional()
  @IsNumber()
  outsideDhaka: number;

  @IsNotEmpty()
  skus: {
    images: string;
    sku: string;
    customSku: string;
    purchasePrice: string;
    price: number;
    discountedType: string;
    discountedValue: number;
    discountedPrice: number;
    discountedPriceStart: Date;
    discountedPriceEnd: Date;
    preOrder: boolean;
    preOrderPer: number;
    stockOut: boolean;
    warehouseSkusStock: { warehouseId: number; qty: number }[];
    attributes: { key: string; value: string; code: string; image: string }[];
  }[];
}

class SkuDto {
  @IsNotEmpty()
  images: string;

  @IsNotEmpty()
  @IsString()
  customSku: string;

  @IsNotEmpty()
  price: number;

  @IsOptional()
  discountedPrice?: number;

  @IsOptional()
  purchasePrice?: string;

  @IsNotEmpty()
  stockQuantity: number;

  @IsNotEmpty()
  @IsArray()
  @IsNumber({}, { each: true })
  quentity: { warehouseId: number; stockQuantity: number }[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attributes?: { key: string; value: string }[];
}
