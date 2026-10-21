import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL is not configured');
    }

    const adapter = new PrismaPg({
      connectionString,
      max: 10,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 10000,
    });

    super({
      adapter,
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
      ],
    });

    (this as any).$on(
      'query',
      (e: { query: string; params: string; duration: number }) => {
        console.log('*********** Prisma Query ***********');
        console.log('Query:', e.query);
        console.log('Params:', e.params);
        console.log('Duration:', `${e.duration}ms`);
        console.log('************************************');
      },
    );
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async testDbLatency() {
    const start = performance.now();

    await this.$queryRaw`SELECT 1`;

    const dbRoundTripMs = Number((performance.now() - start).toFixed(2));

    return { dbRoundTripMs };
  }
}
