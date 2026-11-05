import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sale } from '../sales/sale.entity';
import { CounterSession } from './counter-session.entity';
import { Counter } from './counter.entity';
import { CountersController } from './counters.controller';
import { CountersService } from './counters.service';

@Module({
  imports: [TypeOrmModule.forFeature([Counter, CounterSession, Sale])],
  controllers: [CountersController],
  providers: [CountersService],
  exports: [CountersService],
})
export class CountersModule {}
