import { Module } from '@nestjs/common';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';

import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { createAuth } from './auth';
import { AuthTestController } from './auth-test.controller';

@Module({
  imports: [
    BetterAuthModule.forRootAsync({
      imports: [PrismaModule],
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => ({
        auth: createAuth(prisma),
        bodyParser: {
          json: { limit: '10kb' },
          urlencoded: {
            extended: true,
            limit: '10kb',
          },
        },
      }),
    }),
  ],
  controllers: [AuthTestController],
})
export class AuthModule {}
