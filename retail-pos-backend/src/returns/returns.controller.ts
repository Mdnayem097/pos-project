import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { CreateReturnDto } from './dto/create-return.dto';
import { GetReturnsQueryDto } from './dto/get-returns-query.dto';
import { ReturnsService } from './returns.service';

@Controller('returns')
@UseGuards(AuthGuard, PermissionsGuard)
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Get()
  @RequirePermission('returns:view')
  findAll(@Query() query: GetReturnsQueryDto) {
    return this.returnsService.findAll(query);
  }

  @Get(':id')
  @RequirePermission('returns:view')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.returnsService.findOne(id);
  }

  @Post()
  @RequirePermission('returns:create')
  create(@Body() dto: CreateReturnDto) {
    return this.returnsService.create(dto);
  }

  @Get('orders/:orderId/returnable-items')
  @RequirePermission('returns:view')
  getReturnableItems(@Param('orderId', ParseIntPipe) orderId: number) {
    return this.returnsService.getReturnableItems(orderId);
  }
}
