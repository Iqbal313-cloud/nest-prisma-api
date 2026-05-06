import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CategoriesModule } from './categories/categories.module';
import { OrdersModule } from './orders/orders.module';
import { CustomersModule } from './customers/customers.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // makes env available everywhere
    }),
    CategoriesModule,
    OrdersModule,
    CustomersModule,
  ],
})
export class AppModule {}
