import {
  IsBoolean,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateSkuDto {
  @IsOptional()
  @IsString()
  images: string;

  @IsOptional()
  @IsString()
  customSku: string;

  @IsOptional()
  @IsNumber()
  purchasePrice: number;

  @IsNotEmpty()
  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  discountedType: string;

  @IsOptional()
  @IsNumber()
  discountedValue: number;

  @IsNotEmpty()
  @IsNumber()
  discountedPrice: number;

  @IsOptional()
  @IsISO8601()
  discountedPriceStart: Date;

  @IsOptional()
  @IsISO8601()
  discountedPriceEnd: Date;

  // @IsNotEmpty()
  // @IsNumber()
  // stockQuantity: number;

  @IsOptional()
  @IsBoolean()
  stockOut: boolean;

  @IsOptional()
  @IsBoolean()
  preOrder: boolean;

  @IsOptional()
  @IsNumber()
  preOrderPer: number;

  @IsOptional()
  warehouseSkusStock: { warehouseId: number; qty: number }[];

  @IsOptional()
  attributes: { key: string; value: string; code: string; image: string }[];
}
