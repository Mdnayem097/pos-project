import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(5)
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
