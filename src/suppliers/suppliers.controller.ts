import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { ApiTags } from '@nestjs/swagger';
import { SupplierFilterDto } from './dto/supplier-filter.dto';
import { UserHasPermission } from '@thallesp/nestjs-better-auth';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';

@ApiTags('Suppliers')
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @UserHasPermission({
    permission: {
      supplier: ['read'],
    },
  })
  async findAll(@Query() paginationDto: SupplierFilterDto) {
    return this.suppliersService.findAll(paginationDto);
  }

  @Get(':id')
  @UserHasPermission({
    permission: {
      supplier: ['read'],
    },
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.suppliersService.findOne(id);
  }

  @Post()
  @UserHasPermission({
    permission: {
      supplier: ['create'],
    },
  })
  async create(
    @Body() createSupplierDto: CreateSupplierDto,
    @Session() session: UserSession,
  ) {
    return this.suppliersService.create(createSupplierDto, session.user.id);
  }

  @Patch(':id')
  @UserHasPermission({
    permission: {
      supplier: ['update'],
    },
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSupplierDto: UpdateSupplierDto,
    @Session() session: UserSession,
  ) {
    return this.suppliersService.update(id, updateSupplierDto, session.user.id);
  }

  @Delete(':id')
  @UserHasPermission({
    permission: {
      supplier: ['delete'],
    },
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.suppliersService.remove(id);
  }
}
