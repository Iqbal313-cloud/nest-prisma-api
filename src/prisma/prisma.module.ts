import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { DatabaseTestController } from './database-test.controller';

@Global()
@Module({
  controllers: [DatabaseTestController],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
