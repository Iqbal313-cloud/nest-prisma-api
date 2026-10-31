import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin as adminPlugin } from 'better-auth/plugins';

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

export function createAuth(prisma: PrismaClient) {
  const secret = process.env.BETTER_AUTH_SECRET;

  if (!secret) {
    throw new Error('BETTER_AUTH_SECRET is not configured');
  }

  return betterAuth({
    appName: 'Ecommerce API',
    baseURL: process.env.BETTER_AUTH_URL,
    secret,

    trustedOrigins: ['http://localhost:5173'],

    database: prismaAdapter(prisma, {
      provider: 'postgresql',
    }),

    emailAndPassword: {
      enabled: true,
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
