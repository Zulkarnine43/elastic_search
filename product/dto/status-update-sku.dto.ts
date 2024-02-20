import { IsEnum, IsNotEmpty } from 'class-validator';
import { ProductStatus } from '../entities/product.entity';

export class StatusUpdateSkuDto {
  @IsNotEmpty()
  @IsEnum(ProductStatus)
  status: ProductStatus;
}
