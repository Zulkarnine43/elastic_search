import {
  IsArray,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class UpdateMergeProductDto {
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  mergeProducts?: number[];
}
