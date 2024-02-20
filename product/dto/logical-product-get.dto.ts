import { IsBoolean, IsOptional } from 'class-validator';

export class LogicalProductGetDto {
  @IsOptional()
  category?: { id: number; limit: number | string }[];
  @IsOptional()
  brand?: { id: number; limit: number | string }[];
  @IsOptional()
  categoryOrder?: 'ASC' | 'DESC' | 'random';
  @IsOptional()
  brandOrder?: 'ASC' | 'DESC' | 'random';
  @IsOptional()
  @IsBoolean()
  isFeatured: boolean;

  @IsOptional()
  @IsBoolean()
  isShowStockOut: boolean;
}


