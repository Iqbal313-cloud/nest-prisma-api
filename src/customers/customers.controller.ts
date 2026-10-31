import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CustomerService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { ApiTags } from '@nestjs/swagger';
import { CustomerFilterDto } from './dto/customer-filter.dto';
import { UserHasPermission } from '@thallesp/nestjs-better-auth';

@ApiTags('Customers')
@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @UserHasPermission({
    permission: {
      customer: ['create'],
    },
  })
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customerService.create(createCustomerDto);
  }

  @Get()
  @UserHasPermission({
    permission: {
      customer: ['read'],
    },
  })
  findAll(@Query() customerFilterDto: CustomerFilterDto) {
    return this.customerService.findAll(customerFilterDto);
  }

  @Get(':id')
  @UserHasPermission({
    permission: {
      customer: ['read'],
    },
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.customerService.findOne(id);
  }

  @Patch(':id')
  @UserHasPermission({
    permission: {
      customer: ['update'],
    },
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customerService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  @UserHasPermission({
    permission: {
      customer: ['delete'],
    },
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.customerService.remove(id);
  }
}
