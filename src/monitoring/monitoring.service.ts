import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MonitoringSummary } from './monitoring.types';

/* eslint-disable */
function serializeBigInt<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_key, value) =>
      typeof value === 'bigint' ? value.toString() : value,
    ),
  );
}
/* eslint-enable */

@Injectable()
export class MonitoringService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(): Promise<MonitoringSummary> {
    try {
      const [databaseRows, connectionRows, queryRows] = await Promise.all([
        this.prisma.$queryRaw<{ name: string; size: string }[]>`
          SELECT
            current_database() AS name,
            pg_size_pretty(
              pg_database_size(current_database())
            ) AS size
        `,

        this.prisma.$queryRaw<
          {
            total: bigint;
            active: bigint;
            idle: bigint;
          }[]
        >`
          SELECT
            COUNT(*)::bigint AS total,
            COUNT(*) FILTER (
              WHERE state = 'active'
            )::bigint AS active,
            COUNT(*) FILTER (
              WHERE state = 'idle'
            )::bigint AS idle
          FROM pg_stat_activity
          WHERE datname = current_database()
        `,

        this.prisma.$queryRaw<
          {
            totalCalls: bigint;
            totalExecutionTimeMs: number;
            averageExecutionTimeMs: number;
          }[]
        >`
          SELECT
            COALESCE(SUM(calls), 0)::bigint
              AS "totalCalls",

            COALESCE(SUM(total_exec_time), 0)::float8
              AS "totalExecutionTimeMs",

            COALESCE(
              SUM(total_exec_time) / NULLIF(SUM(calls), 0),
              0
            )::float8 AS "averageExecutionTimeMs"

          FROM pg_stat_monitor
          WHERE datname = current_database()
        `,
      ]);

      const database = databaseRows[0];
      const connections = connectionRows[0];
      const queries = queryRows[0];

      if (!database || !connections || !queries) {
        throw new Error('Monitoring data unavailable');
      }

      return {
        database: {
          name: database.name,
          size: database.size,
        },

        connections: {
          total: Number(connections.total),
          active: Number(connections.active),
          idle: Number(connections.idle),
        },

        queries: {
          totalCalls: Number(queries.totalCalls),
          totalExecutionTimeMs: Number(queries.totalExecutionTimeMs),
          averageExecutionTimeMs: Number(queries.averageExecutionTimeMs),
        },

        generatedAt: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException(
        'Unable to retrieve database monitoring metrics',
      );
    }
  }

  // 1. Recent query activity
  async getRecentQueries(limit = 20) {
    try {
      const safeLimit = Math.min(100, Math.max(1, limit));

      const rows = await this.prisma.$queryRaw<Record<string, unknown>[]>`
        SELECT
          bucket_start_time AS time,
          username,
          client_ip::text AS client_ip,
          query,
          calls,
          total_exec_time AS total_time_ms,
          mean_exec_time AS avg_time_ms,
          max_exec_time AS max_time_ms,
          rows,
          message,
          elevel
        FROM pg_stat_monitor
        WHERE datname = current_database()
        ORDER BY bucket_start_time DESC NULLS LAST, bucket DESC
        LIMIT ${safeLimit}
      `;

      return serializeBigInt({
        data: rows,
        count: rows.length,
      });
    } catch {
      throw new ServiceUnavailableException(
        'Unable to retrieve recent queries',
      );
    }
  }

  // 2. Slowest queries
  async getSlowQueries(limit = 10) {
    try {
      const safeLimit = Math.min(100, Math.max(1, limit));

      const rows = await this.prisma.$queryRaw<Record<string, unknown>[]>`
        SELECT
          queryid::text AS queryid,
          query,
          calls,
          mean_exec_time AS avg_time_ms,
          max_exec_time AS max_time_ms,
          total_exec_time AS total_time_ms,
          rows
        FROM pg_stat_statements
        WHERE dbid = (
          SELECT oid
          FROM pg_database
          WHERE datname = current_database()
        )
        ORDER BY max_exec_time DESC NULLS LAST
        LIMIT ${safeLimit}
      `;

      return serializeBigInt({ data: rows });
    } catch {
      throw new ServiceUnavailableException('Unable to retrieve slow queries');
    }
  }

  // 3. Most frequently executed queries
  async getTopQueries(limit = 10) {
    try {
      const safeLimit = Math.min(100, Math.max(1, limit));

      const rows = await this.prisma.$queryRaw<Record<string, unknown>[]>`
        SELECT
          queryid::text AS queryid,
          query,
          calls,
          mean_exec_time AS avg_time_ms,
          max_exec_time AS max_time_ms,
          total_exec_time AS total_time_ms,
          rows
        FROM pg_stat_statements
        WHERE dbid = (
          SELECT oid
          FROM pg_database
          WHERE datname = current_database()
        )
        ORDER BY calls DESC
        LIMIT ${safeLimit}
      `;

      return serializeBigInt({ data: rows });
    } catch {
      throw new ServiceUnavailableException('Unable to retrieve top queries');
    }
  }
}
