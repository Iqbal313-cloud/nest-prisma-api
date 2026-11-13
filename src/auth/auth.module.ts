import { Module } from '@nestjs/common';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';

import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';

import { MailModule } from '../mail/mail.module';
import { MailService } from '../mail/mail.service';

import { createAuth } from './auth';
import { AuthTestController } from './auth-test.controller';

@Module({
  imports: [
    BetterAuthModule.forRootAsync({
      imports: [PrismaModule, MailModule],
      inject: [PrismaService, MailService],

      useFactory: (prisma: PrismaService, mailService: MailService) => ({
        auth: createAuth(prisma, mailService),
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
