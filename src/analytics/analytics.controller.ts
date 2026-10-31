import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { ApiTags } from '@nestjs/swagger';
import { OrderTrendsQueryDto } from './dtos/order-trends-query.dto';
import { SalesSummaryQueryDto } from './dtos/sales-summary-query.dto';
import { SalesTrendsQueryDto } from './dtos/sales-trends-query.dto';
import { TopSellingProductsQueryDto } from './dtos/top-selling-products-query.dto';
import { TopCustomersQueryDto } from './dtos/top-customers-query.dto';
import { CategoryPerformanceQueryDto } from './dtos/category-performance-query.dto';
import { SalesComparisonQueryDto } from './dtos/sales-comparison-query.dto';
import { SlowMovingProductsQueryDto } from './dtos/slow-moving-products-query.dto';
import { UserHasPermission } from '@thallesp/nestjs-better-auth';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @UserHasPermission({
    permission: {
      analytics: ['read'],
    },
  })
  getOverview() {
    return this.analyticsService.getOverview();
  }

  @Get('orders')
  @UserHasPermission({
    permission: {
      analytics: ['read'],
    },
  })
  getOrderAnalytics() {
    return this.analyticsService.getOrderAnalytics();
  }

  @Get('orders/trends')
  @UserHasPermission({
    permission: {
      analytics: ['read'],
    },
  })
  getOrderTrends(@Query() query: OrderTrendsQueryDto) {
    return this.analyticsService.getOrderTrends(query.groupBy);
  }

  @Get('sales/summary')
  @UserHasPermission({
    permission: {
      analytics: ['read'],
    },
  })
  getSalesSummary(@Query() query: SalesSummaryQueryDto) {
    return this.analyticsService.getSalesSummary(query);
  }

  @Get('sales/trends')
  @UserHasPermission({
    permission: {
      analytics: ['read'],
    },
  })
  getSalesTrends(@Query() query: SalesTrendsQueryDto) {
    return this.analyticsService.getSalesTrends(query);
  }

  @Get('products/top-selling')
  @UserHasPermission({
    permission: {
      analytics: ['read'],
    },
  })
  getTopSellingProducts(@Query() query: TopSellingProductsQueryDto) {
    return this.analyticsService.getTopSellingProducts(query);
  }

  @Get('inventory/summary')
  @UserHasPermission({
    permission: {
      analytics: ['read'],
    },
  })
  getInventorySummary() {
    return this.analyticsService.getInventorySummary();
  }

  @Get('customers/top')
  @UserHasPermission({
    permission: {
      analytics: ['read'],
    },
  })
  getTopCustomers(@Query() query: TopCustomersQueryDto) {
    return this.analyticsService.getTopCustomers(query);
  }

  @Get('categories/performance')
  @UserHasPermission({
    permission: {
      analytics: ['read'],
    },
  })
  getCategoryPerformance(@Query() query: CategoryPerformanceQueryDto) {
    return this.analyticsService.getCategoryPerformance(query);
  }

  @Get('sales/comparison')
  @UserHasPermission({
    permission: {
      analytics: ['read'],
    },
  })
  getSalesComparison(@Query() query: SalesComparisonQueryDto) {
    return this.analyticsService.getSalesComparison(query);
  }

  @Get('products/slow-moving')
  @UserHasPermission({
    permission: {
      analytics: ['read'],
    },
  })
  getSlowMovingProducts(@Query() query: SlowMovingProductsQueryDto) {
    return this.analyticsService.getSlowMovingProducts(query);
  }
}
