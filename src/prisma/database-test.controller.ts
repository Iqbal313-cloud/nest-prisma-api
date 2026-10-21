import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Controller('database-test')
export class DatabaseTestController {
  constructor(private readonly prismaService: PrismaService) {}

  @Get('latency')
  async testLatency() {
    const results: { dbRoundTripMs: number }[] = [];

    for (let i = 0; i < 5; i++) {
      results.push(await this.prismaService.testDbLatency());
    }

    return results;
  }
}
