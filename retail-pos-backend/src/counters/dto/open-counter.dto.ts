import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class OpenCounterDto {
  @IsNumber()
  @Min(0)
  openingCash: number;

  @IsOptional()
  @IsString()
  cashierName?: string;
}
