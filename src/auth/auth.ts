import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin as adminPlugin } from 'better-auth/plugins';

import { createAdminRoleProtection } from './admin-role-protection';
import { MailService } from '../mail/mail.service';
import { PrismaClient } from '../generated/prisma/client';

import {
  ac,
  superAdmin,
  admin,
  manager,
  sales,
  accountant,
  inventoryManager,
  viewer,
} from './permissions';

function getTrustedOrigins(): string[] {
  return (process.env.TRUSTED_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function createAuth(prisma: PrismaClient, mailService: MailService) {
  const secret = process.env.BETTER_AUTH_SECRET;

  if (!secret) {
    throw new Error('BETTER_AUTH_SECRET is not configured');
  }

  return betterAuth({
    appName: 'Ecommerce API',
    baseURL: process.env.BETTER_AUTH_URL,
    secret,

    trustedOrigins: getTrustedOrigins(),

    advanced: {
      defaultCookieAttributes: {
        sameSite: 'none',
        secure: true,
        httpOnly: true,
      },
    },

    database: prismaAdapter(prisma, {
      provider: 'postgresql',
    }),

    session: {
      cookieCache: {
        enabled: true,
        maxAge: 60,
        strategy: 'compact',
      },
    },

    emailAndPassword: {
      enabled: true,
      resetPasswordTokenExpiresIn: 30 * 60,

      revokeSessionsOnPasswordReset: true,

      sendResetPassword: async ({ user, url }) => {
        await mailService.sendResetPasswordEmail({
          email: user.email,
          name: user.name,
          url,
        });
      },
    },

    socialProviders: {
      google: {
        clientId: process.env.BETTER_AUTH_GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.BETTER_AUTH_GOOGLE_CLIENT_SECRET as string,
      },

      github: {
        clientId: process.env.BETTER_AUTH_GITHUB_CLIENT_ID as string,
        clientSecret: process.env.BETTER_AUTH_GITHUB_CLIENT_SECRET as string,
      },
    },

    user: {
      changeEmail: {
        enabled: true,
        updateEmailWithoutVerification: true,
      },
    },

    hooks: {
      before: createAdminRoleProtection(prisma),
    },

    plugins: [
      adminPlugin({
        ac,
        roles: {
          superAdmin,
          admin,
          manager,
          sales,
          accountant,
          inventoryManager,
          viewer,
        },
        adminRoles: ['admin', 'superAdmin'],
        defaultRole: 'sales',
      }),
    ],
  });
}
