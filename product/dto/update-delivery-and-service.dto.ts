import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateDeliveryAndServiceDto {
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
}
