import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { CountersService } from './counters.service';
import { CloseCounterDto } from './dto/close-counter.dto';
import { CreateCounterDto } from './dto/create-counter.dto';
import { OpenCounterDto } from './dto/open-counter.dto';
import { UpdateCounterDto } from './dto/update-counter.dto';

@Controller('counters')
@UseGuards(AuthGuard, PermissionsGuard)
export class CountersController {
  constructor(private readonly countersService: CountersService) {}

  @Get()
  @RequirePermission('counters:view')
  findAll() {
    return this.countersService.findAll();
  }

  @Post()
  @RequirePermission('counters:create')
  create(@Body() dto: CreateCounterDto) {
    return this.countersService.create(dto);
  }

  @Get('current')
  @RequirePermission('counters:view')
  getCurrentSession() {
    return this.countersService.getCurrentSession();
  }

  @Get(':id')
  @RequirePermission('counters:view')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.countersService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('counters:update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCounterDto,
  ) {
    return this.countersService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('counters:delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.countersService.remove(id);
  }

  @Post(':id/open')
  @RequirePermission('counters:update')
  openSession(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: OpenCounterDto,
  ) {
    return this.countersService.openSession(id, dto);
  }

  @Post(':id/close')
  @RequirePermission('counters:update')
  closeSession(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CloseCounterDto,
  ) {
    return this.countersService.closeSession(id, dto);
  }

  @Get(':id/sessions')
  @RequirePermission('counters:view')
  getSessionHistory(@Param('id', ParseIntPipe) id: number) {
    return this.countersService.getSessions(id);
  }
}
