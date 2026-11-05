import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

export class ReturnItemLineDto {
  @IsInt()
  @IsNotEmpty()
  orderItemId: number;

  @IsInt()
  @IsPositive()
  qty: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class CreateReturnDto {
  @IsInt()
  @IsNotEmpty()
  orderId: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReturnItemLineDto)
  items: ReturnItemLineDto[];

  @IsOptional()
  @IsString()
  refundMethod?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
