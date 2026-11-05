import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CountersService } from './counters.service';
import { CloseCounterDto } from './dto/close-counter.dto';
import { CreateCounterDto } from './dto/create-counter.dto';
import { OpenCounterDto } from './dto/open-counter.dto';
import { UpdateCounterDto } from './dto/update-counter.dto';

@Controller('counters')
export class CountersController {
  constructor(private readonly countersService: CountersService) {}

  @Get()
  findAll() {
    return this.countersService.findAll();
  }

  @Post()
  create(@Body() dto: CreateCounterDto) {
    return this.countersService.create(dto);
  }

  // NOTE: 'current' must precede ':id' to avoid route conflict
  @Get('current')
  getCurrentSession() {
    return this.countersService.getCurrentSession();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.countersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCounterDto,
  ) {
    return this.countersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.countersService.remove(id);
  }

  @Post(':id/open')
  openSession(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: OpenCounterDto,
  ) {
    return this.countersService.openSession(id, dto);
  }

  @Post(':id/close')
  closeSession(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CloseCounterDto,
  ) {
    return this.countersService.closeSession(id, dto);
  }

  @Get(':id/sessions')
  getSessions(@Param('id', ParseIntPipe) id: number) {
    return this.countersService.getSessions(id);
  }
}
