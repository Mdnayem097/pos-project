import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  forwardRef,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { ReturnsService } from '../returns/returns.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { GetOrdersQueryDto } from './dto/get-orders-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(AuthGuard, PermissionsGuard)
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    @Inject(forwardRef(() => ReturnsService))
    private readonly returnsService: ReturnsService,
  ) {}

  @Get()
  @RequirePermission('orders:view')
  findAll(@Query() query: GetOrdersQueryDto) {
    return this.ordersService.findAll(query);
  }

  @Get(':id/returnable-items')
  @RequirePermission('returns:view')
  getReturnableItems(@Param('id', ParseIntPipe) id: number) {
    return this.returnsService.getReturnableItems(id);
  }

  @Get(':id')
  @RequirePermission('orders:view')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/status')
  @RequirePermission('orders:update')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto.status);
  }

  @Delete(':id')
  @RequirePermission('orders:delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.remove(id);
  }

  @Post()
  @RequirePermission('orders:create')
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }
}
