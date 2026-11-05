import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CloseCounterDto {
  @IsNumber()
  @Min(0)
  closingCash: number;

  @IsOptional()
  @IsString()
  note?: string;
}
