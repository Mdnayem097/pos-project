import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { PAYMENT_METHODS } from '../sale.entity';

export class SaleLineDto {
  @IsInt()
  productId: number;

  @IsInt()
  @Min(1)
  qty: number;
}

export class CreateSaleDto {
  // leave out for a walk-in customer
  @IsOptional()
  @IsInt()
  customerId?: number;

  @IsIn(PAYMENT_METHODS as unknown as string[])
  payment: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SaleLineDto)
  items: SaleLineDto[];
}
