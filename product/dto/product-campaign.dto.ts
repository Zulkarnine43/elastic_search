import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { DiscountType } from '../services/product.service';

export class ProductCampaignDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  logo: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  categoryId: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  brandId: number[];

  @IsNotEmpty()
  @IsEnum(DiscountType)
  discountType: DiscountType;

  @IsNotEmpty()
  discountValue: number;

  @IsNotEmpty()
  startDate: Date;

  @IsNotEmpty()
  endDate: Date;

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  excludeSku: String[];

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  includeSku: String[];
}
