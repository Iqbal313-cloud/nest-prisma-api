import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { FindOrdersDto } from './dto/find-orders.dto';
import { UpdateOrderDto } from './dto/updateOrder.dto';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UserHasPermission } from '@thallesp/nestjs-better-auth';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @UserHasPermission({
    permission: {
      order: ['read'],
    },
  })
  async findAll(@Query() query: FindOrdersDto) {
    return this.ordersService.findAll(query);
  }

  @Get(':id')
  @UserHasPermission({
    permission: {
      order: ['read'],
    },
  })
  async findOne(@Param('id') id: string) {
    return this.ordersService.findOneById(Number(id));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UserHasPermission({
    permission: {
      order: ['create'],
    },
  })
  async create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UserHasPermission({
    permission: {
      order: ['update'],
    },
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderDto,
  ) {
    return this.ordersService.update(id, dto);
  }

  @Delete(':id')
  @UserHasPermission({
    permission: {
      order: ['delete'],
    },
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.remove(id);
  }
}
