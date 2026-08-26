import { Injectable } from '@nestjs/common';
import { Redis } from '@upstash/redis';

/* eslint-disable */
@Injectable()
export class RedisService {
  private readonly redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  async get<T>(key: string): Promise<T | null> {
    return this.redis.get<T>(key);
  }

  async set<T>(
    key: string,
    value: T,
    ttlSeconds?: number,
  ) {
    if (ttlSeconds) {
      return this.redis.set(key, value, {
        ex: ttlSeconds,
      });
    }

    return this.redis.set(key, value);
  }

  async del(key: string) {
    return this.redis.del(key);
  }

  async deleteByPattern(pattern: string) {
    const keys = await this.redis.keys(pattern);

    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
// import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
// import { createClient, RedisClientType } from 'redis';

// @Injectable()
// export class RedisService implements OnModuleInit, OnModuleDestroy {
//   private readonly redis: RedisClientType = createClient({
//     url: process.env.REDIS_URL,
//   });

//   async onModuleInit() {
//     this.redis.on('error', (err) => {
//       console.error('Redis Client Error:', err);
//     });

//     await this.redis.connect();

//     console.log('Redis connected');
//   }

//   async onModuleDestroy() {
//     await this.redis.quit();
//   }

//   async get<T>(key: string): Promise<T | null> {
//     const value = await this.redis.get(key);

//     if (value === null) {
//       return null;
//     }

//     return JSON.parse(value) as T;
//   }

//   async set<T>(key: string, value: T, ttlSeconds?: number) {
//     const serialized = JSON.stringify(value);

//     if (ttlSeconds) {
//       return this.redis.set(key, serialized, {
//         EX: ttlSeconds,
//       });
//     }

//     return this.redis.set(key, serialized);
//   }

//   async del(key: string) {
//     return this.redis.del(key);
//   }

//   async deleteByPattern(pattern: string) {
//     for await (const key of this.redis.scanIterator({
//       MATCH: pattern,
//       COUNT: 100,
//     })) {
//       await this.redis.del(key);
//     }
//   }
// }
