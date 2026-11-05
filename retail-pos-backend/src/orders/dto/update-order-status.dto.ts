import { IsString, MinLength } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsString()
  @MinLength(1)
  status: string;
}
