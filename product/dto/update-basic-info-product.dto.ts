import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateBasicInfoProductDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  customSku: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsString()
  longDescription?: string;

  @IsOptional()
  @IsBoolean()
  isFeatured: boolean;

  @IsOptional()
  @IsNumber()
  featuredOrder?: number;

  @IsNotEmpty()
  @IsNumber()
  categoryId: number;

  @IsOptional()
  @IsNumber()
  brandId?: number;

  @IsOptional()
  @IsNumber()
  vat?: number;

  @IsOptional()
  @IsBoolean()
  displayOnly: boolean;

  @IsOptional()
  specifications?: { key: string; value: string }[];

  @IsOptional()
  @IsString()
  variationKeys?: string;

  @IsOptional()
  @IsNumber()
  insideDhaka: number;

  @IsOptional()
  @IsNumber()
  outsideDhaka: number;
}
