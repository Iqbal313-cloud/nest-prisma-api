import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderStatus } from 'src/generated/prisma/enums';
import { RedisService } from '../redis/redis.service';
import { SalesSummaryQueryDto } from './dtos/sales-summary-query.dto';
import { SalesTrendsQueryDto } from './dtos/sales-trends-query.dto';
import { TopSellingProductsQueryDto } from './dtos/top-selling-products-query.dto';
import { TopCustomersQueryDto } from './dtos/top-customers-query.dto';
import { CategoryPerformanceQueryDto } from './dtos/category-performance-query.dto';
import { SalesComparisonQueryDto } from './dtos/sales-comparison-query.dto';
import { SlowMovingProductsQueryDto } from './dtos/slow-moving-products-query.dto';

// export type SalesPeriod = 'daily' | 'weekly' | 'monthly';
type OrderTrendsGroupBy = 'day' | 'week' | 'month';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private readonly logger = new Logger(AnalyticsService.name);

  async getOverview() {
    const [
      totalProducts,
      totalCategories,
      totalCustomers,
      totalEmployees,
      totalSuppliers,
      orderStats,
      lowStockProducts,
      outOfStockProducts,
      totalRevenue,
    ] = await Promise.all([
      this.prisma.product.count(),

      this.prisma.category.count(),

      this.prisma.customer.count(),

      this.prisma.employee.count(),

      this.prisma.supplier.count(),

      this.getOrderStats(),

      this.prisma.product.count({
        where: {
          unitsInStock: {
            gt: 0,
            lte: 10,
          },
          discontinued: false,
        },
      }),

      this.prisma.product.count({
        where: {
          unitsInStock: 0,
          discontinued: false,
        },
      }),

      this.getTotalRevenue(),
    ]);

    return {
      summary: {
        totalProducts,
        totalCategories,
        totalCustomers,
        totalEmployees,
        totalSuppliers,
        totalOrders: orderStats.totalOrders,
      },

      orders: {
        pending: orderStats.pending,
        processing: orderStats.processing,
        shipped: orderStats.shipped,
        delivered: orderStats.delivered,
        cancelled: orderStats.cancelled,
      },

      inventory: {
        lowStock: lowStockProducts,
        outOfStock: outOfStockProducts,
      },

      sales: {
        deliveredOrderCount: orderStats.delivered,
        totalRevenue,
      },
    };
  }

  async getOrderStats() {
    const [stats] = await this.prisma.$queryRaw<
      {
        totalOrders: bigint;
        pending: bigint;
        processing: bigint;
        shipped: bigint;
        delivered: bigint;
        cancelled: bigint;
      }[]
    >`
      SELECT
        COUNT(*) AS "totalOrders",

        COUNT(*) FILTER (
          WHERE "orderStatus" = 'PENDING'::"OrderStatus"
        ) AS "pending",

        COUNT(*) FILTER (
          WHERE "orderStatus" = 'PROCESSING'::"OrderStatus"
        ) AS "processing",

        COUNT(*) FILTER (
          WHERE "orderStatus" = 'SHIPPED'::"OrderStatus"
        ) AS "shipped",

        COUNT(*) FILTER (
          WHERE "orderStatus" = 'DELIVERED'::"OrderStatus"
        ) AS "delivered",

        COUNT(*) FILTER (
          WHERE "orderStatus" = 'CANCELLED'::"OrderStatus"
        ) AS "cancelled"

      FROM "Orders"
    `;

    return {
      totalOrders: Number(stats.totalOrders),
      pending: Number(stats.pending),
      processing: Number(stats.processing),
      shipped: Number(stats.shipped),
      delivered: Number(stats.delivered),
      cancelled: Number(stats.cancelled),
    };
  }

  async getTotalRevenue(): Promise<number> {
    const cacheKey = 'analytics:total-revenue';

    const cached = await this.redis.get(cacheKey);

    if (cached !== null) {
      this.logger.log(`Redis CACHE HIT: ${cacheKey}`);
      return Number(cached);
    }

    this.logger.log(`Redis CACHE MISS: ${cacheKey}`);

    const [result] = await this.prisma.$queryRaw<
      { totalRevenue: string | number | null }[]
    >`
    SELECT
      COALESCE(
        SUM(
          od."quantity"
          * od."unitPrice"
          * (1 - od."discount" / 100)
        ),
        0
      ) AS "totalRevenue"
    FROM "OrderDetails" AS od
    INNER JOIN "Orders" AS o
      ON o."id" = od."orderId"
    WHERE o."orderStatus" = 'DELIVERED'::"OrderStatus"
  `;

    const revenue = Number(Number(result.totalRevenue).toFixed(2));

    await this.redis.set(cacheKey, String(revenue), 60);

    return revenue;
  }

  async getOrderAnalytics() {
    const stats = await this.getOrderStats();

    const totalOrders = stats.totalOrders;

    const percentage = (count: number) =>
      totalOrders > 0 ? Number(((count / totalOrders) * 100).toFixed(2)) : 0;

    return {
      summary: {
        totalOrders,
        pending: stats.pending,
        processing: stats.processing,
        shipped: stats.shipped,
        delivered: stats.delivered,
        cancelled: stats.cancelled,
      },

      distribution: {
        pending: percentage(stats.pending),
        processing: percentage(stats.processing),
        shipped: percentage(stats.shipped),
        delivered: percentage(stats.delivered),
        cancelled: percentage(stats.cancelled),
      },
    };
  }

  // async getOrderTrends() {
  //   const result = await this.prisma.$queryRaw<
  //     {
  //       date: Date;
  //       orderCount: bigint;
  //     }[]
  //   >`
  //   SELECT
  //     DATE_TRUNC('day', "createdAt") AS date,
  //     COUNT(*) AS "orderCount"
  //   FROM "Orders"
  //   WHERE "createdAt" >= NOW() - INTERVAL '30 days'
  //   GROUP BY DATE_TRUNC('day', "createdAt")
  //   ORDER BY date ASC
  // `;

  //   return {
  //     period: '30 days',
  //     trends: result.map((row) => ({
  //       date: row.date,
  //       orderCount: Number(row.orderCount),
  //     })),
  //   };
  // }

  async getOrderTrends(groupBy: OrderTrendsGroupBy = 'day') {
    const intervals = {
      day: '30 days',
      week: '12 weeks',
      month: '12 months',
    } as const;

    const truncUnit = {
      day: 'day',
      week: 'week',
      month: 'month',
    } as const;

    const period = intervals[groupBy];
    const unit = truncUnit[groupBy];

    const result = await this.prisma.$queryRaw<
      { date: Date; orderCount: bigint }[]
    >`
    SELECT
      DATE_TRUNC(${unit}, o."createdAt") AS date,
      COUNT(*) AS "orderCount"
    FROM "Orders" AS o
    WHERE o."createdAt" >= NOW() - CAST(${period} AS INTERVAL)
    GROUP BY date
    ORDER BY date ASC
  `;

    return {
      groupBy,
      period,
      trends: result.map((row) => ({
        date: row.date,
        orderCount: Number(row.orderCount),
      })),
    };
  }

  async getSalesSummary(query: SalesSummaryQueryDto) {
    const { from, to } = query;

    if (from && to && from > to) {
      throw new BadRequestException('`from` must be before or equal to `to`');
    }

    const cacheKey = [
      'analytics:sales-summary',
      `from:${from ?? 'all'}`,
      `to:${to ?? 'all'}`,
    ].join(':');

    const cached = await this.redis.get<string>(cacheKey);

    if (cached !== null && cached !== undefined) {
      this.logger.log(`Redis CACHE HIT: ${cacheKey}`);

      try {
        return JSON.parse(cached);
      } catch {
        this.logger.warn(`Invalid Redis cache data for key: ${cacheKey}`);

        await this.redis.del(cacheKey);
      }
    }

    this.logger.log(`Redis CACHE MISS: ${cacheKey}`);

    const fromDate = from ? new Date(`${from}T00:00:00.000Z`) : undefined;

    const toExclusive = to
      ? new Date(
          new Date(`${to}T00:00:00.000Z`).getTime() + 24 * 60 * 60 * 1000,
        )
      : undefined;

    const dateFilter = {
      ...(fromDate || toExclusive
        ? {
            orderDate: {
              ...(fromDate && { gte: fromDate }),
              ...(toExclusive && { lt: toExclusive }),
            },
          }
        : {}),
    };

    const [revenueResult, deliveredOrders] = await Promise.all([
      this.prisma.$queryRaw<{ totalRevenue: string | number | null }[]>`
        SELECT COALESCE(
          SUM(
            od."quantity"
            * od."unitPrice"
            * (1 - od."discount" / 100)
          ),
          0
        ) AS "totalRevenue"
        FROM "OrderDetails" od
        INNER JOIN "Orders" o
          ON o."id" = od."orderId"
        WHERE o."orderStatus" = 'DELIVERED'::"OrderStatus"
          AND (${fromDate ?? null}::timestamp IS NULL
            OR o."orderDate" >= ${fromDate ?? null}::timestamp)
          AND (${toExclusive ?? null}::timestamp IS NULL
            OR o."orderDate" < ${toExclusive ?? null}::timestamp)
      `,

      this.prisma.orders.count({
        where: {
          orderStatus: 'DELIVERED',
          ...dateFilter,
        },
      }),
    ]);

    const totalRevenue = Number(
      Number(revenueResult[0].totalRevenue ?? 0).toFixed(2),
    );

    const averageOrderValue =
      deliveredOrders > 0
        ? Number((totalRevenue / deliveredOrders).toFixed(2))
        : 0;

    const result = {
      totalRevenue,
      deliveredOrders,
      averageOrderValue,
      period: {
        from: from ?? null,
        to: to ?? null,
      },
    };

    await this.redis.set(cacheKey, JSON.stringify(result), 60);

    return result;
  }

  async getSalesTrends(query: SalesTrendsQueryDto) {
    const groupBy = query.groupBy ?? 'day';

    const config = {
      day: { periods: 30, step: '1 day' },
      week: { periods: 12, step: '1 week' },
      month: { periods: 12, step: '1 month' },
    } as const;

    const { periods, step } = config[groupBy];
    const rows = await this.prisma.$queryRaw<
      {
        date: Date;
        totalRevenue: string | number | null;
        orderCount: bigint | number;
      }[]
    >`
  WITH bounds AS (
    SELECT
      DATE_TRUNC(${groupBy}, CURRENT_TIMESTAMP) AS end_period,
      DATE_TRUNC(${groupBy}, CURRENT_TIMESTAMP)
        - (${periods - 1} * ${step}::interval) AS start_period
  ),
  time_periods AS (
    SELECT GENERATE_SERIES(
      start_period,
      end_period,
      ${step}::interval
    ) AS period_start
    FROM bounds
  ),
  sales_base AS (
    SELECT
      DATE_TRUNC(
        ${groupBy},
        COALESCE(o."orderDate", o."createdAt")
      ) AS period_start,
      o."id" AS order_id,
      od."quantity" * od."unitPrice"
        * (1 - od."discount" / 100) AS line_revenue
    FROM "Orders" o
    INNER JOIN "OrderDetails" od
      ON od."orderId" = o."id"
    CROSS JOIN bounds b
    WHERE o."orderStatus" = 'DELIVERED'::"OrderStatus"
      AND COALESCE(o."orderDate", o."createdAt") >= b.start_period
      AND COALESCE(o."orderDate", o."createdAt")
        < b.end_period + ${step}::interval
  ),
  sales AS (
    SELECT
      period_start,
      SUM(line_revenue) AS total_revenue,
      COUNT(DISTINCT order_id) AS order_count
    FROM sales_base
    GROUP BY period_start
  )
  SELECT
    tp.period_start AS date,
    COALESCE(s.total_revenue, 0) AS "totalRevenue",
    COALESCE(s.order_count, 0) AS "orderCount"
  FROM time_periods tp
  LEFT JOIN sales s
    ON s.period_start = tp.period_start
  ORDER BY tp.period_start ASC
`;

    return {
      groupBy,
      trends: rows.map((row) => ({
        date: row.date,
        totalRevenue: Number(Number(row.totalRevenue ?? 0).toFixed(2)),
        orderCount: Number(row.orderCount),
      })),
    };
  }

  async getTopSellingProducts(query: TopSellingProductsQueryDto) {
    const limit = query.limit ?? 5;

    const rows = await this.prisma.$queryRaw<
      {
        productId: string;
        productName: string;
        totalQuantitySold: bigint | number;
        totalRevenue: string | number | null;
        orderCount: bigint | number;
      }[]
    >`
    SELECT
      p."id" AS "productId",
      p."productName" AS "productName",
      SUM(od."quantity") AS "totalQuantitySold",
      ROUND(
        SUM(
          od."quantity" * od."unitPrice"
          * (1 - od."discount" / 100)
        ),
        2
      ) AS "totalRevenue",
      COUNT(DISTINCT o."id") AS "orderCount"
    FROM "OrderDetails" od
    INNER JOIN "Orders" o
      ON o."id" = od."orderId"
    INNER JOIN "Product" p
      ON p."id" = od."productId"
    WHERE o."orderStatus" = 'DELIVERED'::"OrderStatus"
    GROUP BY p."id", p."productName"
    ORDER BY SUM(od."quantity") DESC, p."productName" ASC
    LIMIT ${limit}
  `;

    return {
      limit,
      products: rows.map((row) => ({
        productId: row.productId,
        productName: row.productName,
        totalQuantitySold: Number(row.totalQuantitySold),
        totalRevenue: Number(Number(row.totalRevenue ?? 0).toFixed(2)),
        orderCount: Number(row.orderCount),
      })),
    };
  }

  async getInventorySummary() {
    const LOW_STOCK_THRESHOLD = 10;
    const LOW_STOCK_ITEMS_LIMIT = 10;

    const [summaryRows, lowStockRows] = await Promise.all([
      this.prisma.$queryRaw<
        {
          totalProducts: bigint;
          totalStockQuantity: bigint | number;
          inStockProducts: bigint;
          lowStockProducts: bigint;
          outOfStockProducts: bigint;
          unknownStockProducts: bigint;
          totalStockValue: string | number | null;
        }[]
      >`
      SELECT
        COUNT(*) AS "totalProducts",

        COALESCE(
          SUM(GREATEST(COALESCE(p."unitsInStock", 0), 0)),
          0
        ) AS "totalStockQuantity",

        COUNT(*) FILTER (
          WHERE p."unitsInStock" > ${LOW_STOCK_THRESHOLD}
        ) AS "inStockProducts",

        COUNT(*) FILTER (
          WHERE p."unitsInStock" BETWEEN 1 AND ${LOW_STOCK_THRESHOLD}
        ) AS "lowStockProducts",

        COUNT(*) FILTER (
          WHERE p."unitsInStock" <= 0
        ) AS "outOfStockProducts",

        COUNT(*) FILTER (
          WHERE p."unitsInStock" IS NULL
        ) AS "unknownStockProducts",

        COALESCE(
          SUM(
            COALESCE(p."unitPrice", 0)
            * GREATEST(COALESCE(p."unitsInStock", 0), 0)
          ),
          0
        ) AS "totalStockValue"

      FROM "Product" p
    `,

      this.prisma.$queryRaw<
        {
          productId: string;
          productName: string;
          unitsInStock: number;
          unitPrice: string | number | null;
        }[]
      >`
      SELECT
        p."id" AS "productId",
        p."productName" AS "productName",
        p."unitsInStock" AS "unitsInStock",
        p."unitPrice" AS "unitPrice"
      FROM "Product" p
      WHERE p."unitsInStock" BETWEEN 1 AND ${LOW_STOCK_THRESHOLD}
      ORDER BY
        p."unitsInStock" ASC,
        p."productName" ASC
      LIMIT ${LOW_STOCK_ITEMS_LIMIT}
    `,
    ]);

    const summary = summaryRows[0];

    return {
      totalProducts: Number(summary.totalProducts),
      totalStockQuantity: Number(summary.totalStockQuantity),
      inStockProducts: Number(summary.inStockProducts),
      lowStockProducts: Number(summary.lowStockProducts),
      outOfStockProducts: Number(summary.outOfStockProducts),
      unknownStockProducts: Number(summary.unknownStockProducts),

      totalStockValue: Number(Number(summary.totalStockValue ?? 0).toFixed(2)),

      lowStockThreshold: LOW_STOCK_THRESHOLD,

      lowStockItems: lowStockRows.map((product) => ({
        productId: product.productId,
        productName: product.productName,
        unitsInStock: product.unitsInStock,
        unitPrice: Number(product.unitPrice ?? 0),
      })),
    };
  }

  async getTopCustomers(query: TopCustomersQueryDto) {
    const limit = query.limit ?? 10;

    const rows = await this.prisma.$queryRaw<
      {
        customerId: number;
        firstName: string;
        lastName: string | null;
        totalOrders: bigint | number;
        totalSpent: string | number | null;
        totalUnitsPurchased: bigint | number;
        lastOrderDate: Date | null;
      }[]
    >`
    SELECT
      c."id" AS "customerId",
      c."firstName" AS "firstName",
      c."lastName" AS "lastName",
      COUNT(DISTINCT o."id") AS "totalOrders",
      ROUND(
        SUM(
          od."quantity" * od."unitPrice"
          * (1 - od."discount" / 100)
        ),
        2
      ) AS "totalSpent",
      SUM(od."quantity") AS "totalUnitsPurchased",
      MAX(COALESCE(o."orderDate", o."createdAt")) AS "lastOrderDate"
    FROM "Customer" c
    INNER JOIN "Orders" o
      ON o."customerId" = c."id"
    INNER JOIN "OrderDetails" od
      ON od."orderId" = o."id"
    WHERE o."orderStatus" = 'DELIVERED'::"OrderStatus"
    GROUP BY c."id", c."firstName", c."lastName"
    ORDER BY
      SUM(
        od."quantity" * od."unitPrice"
        * (1 - od."discount" / 100)
      ) DESC,
      c."firstName" ASC
    LIMIT ${limit}
  `;

    return {
      limit,
      customers: rows.map((row) => ({
        customerId: row.customerId,
        firstName: row.firstName,
        lastName: row.lastName,
        totalOrders: Number(row.totalOrders),
        totalSpent: Number(Number(row.totalSpent ?? 0).toFixed(2)),
        totalUnitsPurchased: Number(row.totalUnitsPurchased),
        lastOrderDate: row.lastOrderDate,
      })),
    };
  }

  async getCategoryPerformance(query: CategoryPerformanceQueryDto) {
    const limit = query.limit ?? 10;

    const rows = await this.prisma.$queryRaw<
      {
        categoryId: number;
        categoryName: string;
        totalQuantitySold: bigint | number;
        totalRevenue: string | number | null;
        orderCount: bigint | number;
        productsSold: bigint | number;
      }[]
    >`
    SELECT
      c."id" AS "categoryId",
      c."categoryName" AS "categoryName",
      SUM(od."quantity") AS "totalQuantitySold",
      ROUND(
        SUM(
          od."quantity" * od."unitPrice"
          * (1 - od."discount" / 100)
        ),
        2
      ) AS "totalRevenue",
      COUNT(DISTINCT o."id") AS "orderCount",
      COUNT(DISTINCT p."id") AS "productsSold"
    FROM "Category" c
    INNER JOIN "Product" p
      ON p."categoryId" = c."id"
    INNER JOIN "OrderDetails" od
      ON od."productId" = p."id"
    INNER JOIN "Orders" o
      ON o."id" = od."orderId"
    WHERE o."orderStatus" = 'DELIVERED'::"OrderStatus"
    GROUP BY c."id", c."categoryName"
    ORDER BY
      SUM(
        od."quantity" * od."unitPrice"
        * (1 - od."discount" / 100)
      ) DESC,
      c."categoryName" ASC
    LIMIT ${limit}
  `;

    return {
      limit,
      categories: rows.map((row) => ({
        categoryId: row.categoryId,
        categoryName: row.categoryName,
        totalQuantitySold: Number(row.totalQuantitySold),
        totalRevenue: Number(Number(row.totalRevenue ?? 0).toFixed(2)),
        orderCount: Number(row.orderCount),
        productsSold: Number(row.productsSold),
      })),
    };
  }

  async getSalesComparison(query: SalesComparisonQueryDto) {
    const period = query.period ?? 'month';

    // Period value DTO দিয়ে validate করা হচ্ছে।
    const interval =
      period === 'week' ? '1 week' : period === 'year' ? '1 year' : '1 month';

    const [row] = await this.prisma.$queryRaw<
      {
        currentRevenue: string | number | null;
        previousRevenue: string | number | null;
        currentOrders: bigint | number;
        previousOrders: bigint | number;
      }[]
    >`
    WITH bounds AS (
      SELECT
        DATE_TRUNC(${period}, CURRENT_TIMESTAMP) AS current_start,
        DATE_TRUNC(${period}, CURRENT_TIMESTAMP)
          + ${interval}::interval AS current_end,
        DATE_TRUNC(${period}, CURRENT_TIMESTAMP)
          - ${interval}::interval AS previous_start
    )
    SELECT
      COALESCE(
        SUM(
          od."quantity" * od."unitPrice"
          * (1 - od."discount" / 100)
        ) FILTER (
          WHERE COALESCE(o."orderDate", o."createdAt") >= b.current_start
            AND COALESCE(o."orderDate", o."createdAt") < b.current_end
        ),
        0
      ) AS "currentRevenue",

      COALESCE(
        SUM(
          od."quantity" * od."unitPrice"
          * (1 - od."discount" / 100)
        ) FILTER (
          WHERE COALESCE(o."orderDate", o."createdAt") >= b.previous_start
            AND COALESCE(o."orderDate", o."createdAt") < b.current_start
        ),
        0
      ) AS "previousRevenue",

      COUNT(DISTINCT o."id") FILTER (
        WHERE COALESCE(o."orderDate", o."createdAt") >= b.current_start
          AND COALESCE(o."orderDate", o."createdAt") < b.current_end
      ) AS "currentOrders",

      COUNT(DISTINCT o."id") FILTER (
        WHERE COALESCE(o."orderDate", o."createdAt") >= b.previous_start
          AND COALESCE(o."orderDate", o."createdAt") < b.current_start
      ) AS "previousOrders"

    FROM "Orders" o
    INNER JOIN "OrderDetails" od
      ON od."orderId" = o."id"
    CROSS JOIN bounds b
    WHERE o."orderStatus" = 'DELIVERED'::"OrderStatus"
      AND COALESCE(o."orderDate", o."createdAt") >= b.previous_start
      AND COALESCE(o."orderDate", o."createdAt") < b.current_end
  `;

    const currentRevenue = Number(Number(row.currentRevenue ?? 0).toFixed(2));

    const previousRevenue = Number(Number(row.previousRevenue ?? 0).toFixed(2));

    const currentOrders = Number(row.currentOrders);
    const previousOrders = Number(row.previousOrders);

    const averageOrderValue = (revenue: number, orders: number) =>
      orders > 0 ? Number((revenue / orders).toFixed(2)) : 0;

    // Previous revenue 0 হলে percentage mathematically undefined।
    const revenueChangePercent =
      previousRevenue > 0
        ? Number(
            (
              ((currentRevenue - previousRevenue) / previousRevenue) *
              100
            ).toFixed(2),
          )
        : null;

    return {
      period,

      current: {
        revenue: currentRevenue,
        deliveredOrders: currentOrders,
        averageOrderValue: averageOrderValue(currentRevenue, currentOrders),
      },

      previous: {
        revenue: previousRevenue,
        deliveredOrders: previousOrders,
        averageOrderValue: averageOrderValue(previousRevenue, previousOrders),
      },

      revenueChange: Number((currentRevenue - previousRevenue).toFixed(2)),

      revenueChangePercent,
    };
  }

  async getSlowMovingProducts(query: SlowMovingProductsQueryDto) {
    const days = query.days ?? 30;
    const limit = query.limit ?? 20;

    const products = await this.prisma.$queryRaw<
      {
        productId: number | string;
        productName: string;
        unitPrice: number | string | null;
        unitsInStock: number | null;
        discontinued: boolean | null;
        lastSoldAt: Date | null;
        quantitySoldInPeriod: bigint | number;
        revenueInPeriod: number | string | null;
      }[]
    >`
    WITH product_sales AS (
      SELECT
        od."productId" AS product_id,
        MAX(COALESCE(o."orderDate", o."createdAt")) AS last_sold_at,
        SUM(od."quantity") FILTER (
          WHERE COALESCE(o."orderDate", o."createdAt")
            >= CURRENT_TIMESTAMP - (${days} * INTERVAL '1 day')
        ) AS quantity_sold_in_period,
        SUM(
          od."quantity" * od."unitPrice"
          * (1 - od."discount" / 100)
        ) FILTER (
          WHERE COALESCE(o."orderDate", o."createdAt")
            >= CURRENT_TIMESTAMP - (${days} * INTERVAL '1 day')
        ) AS revenue_in_period
      FROM "OrderDetails" od
      INNER JOIN "Orders" o
        ON o."id" = od."orderId"
      WHERE o."orderStatus" = 'DELIVERED'::"OrderStatus"
      GROUP BY od."productId"
    )
    SELECT
      p."id" AS "productId",
      p."productName" AS "productName",
      p."unitPrice" AS "unitPrice",
      p."unitsInStock" AS "unitsInStock",
      p."discontinued" AS "discontinued",
      ps.last_sold_at AS "lastSoldAt",
      COALESCE(ps.quantity_sold_in_period, 0)
        AS "quantitySoldInPeriod",
      COALESCE(ps.revenue_in_period, 0)
        AS "revenueInPeriod"
    FROM "Product" p
    LEFT JOIN product_sales ps
      ON ps.product_id = p."id"
    WHERE COALESCE(p."discontinued", false) = false
      AND (
        ps.last_sold_at IS NULL
        OR ps.last_sold_at < CURRENT_TIMESTAMP - (${days} * INTERVAL '1 day')
      )
    ORDER BY
      ps.last_sold_at ASC NULLS FIRST,
      p."productName" ASC
    LIMIT ${limit}
  `;

    return {
      filters: {
        days,
        limit,
      },
      count: products.length,
      products: products.map((product) => ({
        productId: Number(product.productId),
        productName: product.productName,
        unitPrice:
          product.unitPrice === null ? null : Number(product.unitPrice),
        unitsInStock: product.unitsInStock,
        lastSoldAt: product.lastSoldAt,
        daysSinceLastSale:
          product.lastSoldAt === null
            ? null
            : Math.max(
                0,
                Math.floor(
                  (Date.now() - new Date(product.lastSoldAt).getTime()) /
                    (1000 * 60 * 60 * 24),
                ),
              ),
        quantitySoldInPeriod: Number(product.quantitySoldInPeriod),
        revenueInPeriod: Number(
          Number(product.revenueInPeriod ?? 0).toFixed(2),
        ),
      })),
    };
  }
}
