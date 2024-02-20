import { IsNotEmpty } from 'class-validator';

export class UpdateOfferLogicDto {
  @IsNotEmpty()
  gift: { name: string; description: string }[];
}
