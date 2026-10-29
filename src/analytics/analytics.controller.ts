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

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  getOverview() {
    return this.analyticsService.getOverview();
  }

  @Get('orders')
  getOrderAnalytics() {
    return this.analyticsService.getOrderAnalytics();
  }

  // @Get('orders/trends')
  // getOrderTrends() {
  //   return this.analyticsService.getOrderTrends();
  // }

  @Get('orders/trends')
  getOrderTrends(@Query() query: OrderTrendsQueryDto) {
    return this.analyticsService.getOrderTrends(query.groupBy);
  }

  @Get('sales/summary')
  getSalesSummary(@Query() query: SalesSummaryQueryDto) {
    return this.analyticsService.getSalesSummary(query);
  }

  @Get('sales/trends')
  getSalesTrends(@Query() query: SalesTrendsQueryDto) {
    return this.analyticsService.getSalesTrends(query);
  }

  @Get('products/top-selling')
  getTopSellingProducts(@Query() query: TopSellingProductsQueryDto) {
    return this.analyticsService.getTopSellingProducts(query);
  }

  @Get('inventory/summary')
  getInventorySummary() {
    return this.analyticsService.getInventorySummary();
  }

  @Get('customers/top')
  getTopCustomers(@Query() query: TopCustomersQueryDto) {
    return this.analyticsService.getTopCustomers(query);
  }

  @Get('categories/performance')
  getCategoryPerformance(@Query() query: CategoryPerformanceQueryDto) {
    return this.analyticsService.getCategoryPerformance(query);
  }

  @Get('sales/comparison')
  getSalesComparison(@Query() query: SalesComparisonQueryDto) {
    return this.analyticsService.getSalesComparison(query);
  }

  @Get('products/slow-moving')
  getSlowMovingProducts(@Query() query: SlowMovingProductsQueryDto) {
    return this.analyticsService.getSlowMovingProducts(query);
  }
}
