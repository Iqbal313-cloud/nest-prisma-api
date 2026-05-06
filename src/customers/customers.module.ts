import { Module } from '@nestjs/common';

import { PrismaModule } from 'src/prisma/prisma.module';

import { CustomerController } from './customers.controller';
import { CustomerService } from './customers.service';

@Module({
  imports: [PrismaModule],
  controllers: [CustomerController],
  providers: [CustomerService],
})
export class CustomersModule {}
