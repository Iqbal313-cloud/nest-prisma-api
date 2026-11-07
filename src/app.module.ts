import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';

import { CategoriesModule } from './categories/categories.module';
import { OrdersModule } from './orders/orders.module';
import { CustomersModule } from './customers/customers.module';
import { ProductsModule } from './products/products.module';
import { EmployeesModule } from './employees/employees.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { PrismaModule } from './prisma/prisma.module';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { LoggerMiddleware } from './middleware/logger.middleware';
import { RedisModule } from './redis/redis.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),

    PrismaModule,
    CategoriesModule,
    OrdersModule,
    CustomersModule,
    ProductsModule,
    EmployeesModule,
    SuppliersModule,
    RedisModule,
    AnalyticsModule,
    MonitoringModule,
    AuthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
