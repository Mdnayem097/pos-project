import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateCounterDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name: string;
}
