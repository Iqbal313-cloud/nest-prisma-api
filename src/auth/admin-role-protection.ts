import {
  APIError,
  createAuthMiddleware,
  getSessionFromCtx,
} from 'better-auth/api';

import type { PrismaClient } from '../generated/prisma/client';

import { canManageRole, canAssignRole } from './role-hierarchy';

type RoleInput = string | string[];

function isRoleInput(value: unknown): value is RoleInput {
  return (
    typeof value === 'string' ||
    (Array.isArray(value) && value.every((role) => typeof role === 'string'))
  );
}

const TARGET_USER_ENDPOINTS = new Set([
  '/admin/set-role',
  '/admin/update-user',
  '/admin/remove-user',
  '/admin/ban-user',
  '/admin/unban-user',
  '/admin/set-user-password',
  '/admin/impersonate-user',
  '/admin/list-user-sessions',
  '/admin/revoke-user-sessions',
  '/admin/revoke-user-session',
]);

export function createAdminRoleProtection(prisma: PrismaClient) {
  return createAuthMiddleware(async (ctx) => {
    const body = (ctx.body ?? {}) as Record<string, any>;

    // Only handle the Admin API endpoints we want to protect.
    const isCreateUser = ctx.path === '/admin/create-user';
    const isTargetEndpoint = TARGET_USER_ENDPOINTS.has(ctx.path);

    if (!isCreateUser && !isTargetEndpoint) {
      return;
    }

    // Get the authenticated session.
    const session = await getSessionFromCtx(ctx);

    if (!session?.user) {
      throw new APIError('UNAUTHORIZED', {
        message: 'Authentication required',
      });
    }

    // Read actor's current role directly from the database.
    const actor = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        role: true,
      },
    });

    if (!actor) {
      throw new APIError('UNAUTHORIZED', {
        message: 'User account not found',
      });
    }

    const actorRole = actor.role;

    // CREATE USER: validate every supplied role.
    if (isCreateUser) {
      const data =
        body.data && typeof body.data === 'object'
          ? (body.data as Record<string, unknown>)
          : {};

      const requestedRoles = [body.role, data.role].filter(
        (role) => role !== undefined,
      );

      // Better Auth defaultRole is sales in this project.
      if (requestedRoles.length === 0) {
        requestedRoles.push('sales');
      }

      for (const requestedRole of requestedRoles) {
        if (
          !isRoleInput(requestedRole) ||
          !canAssignRole(actorRole, requestedRole)
        ) {
          throw new APIError('FORBIDDEN', {
            message: 'You cannot assign this role',
          });
        }
      }

      return;
    }

    // Find target user ID.
    let targetUserId: string | undefined;

    if (ctx.path === '/admin/revoke-user-session') {
      const sessionToken = body.sessionToken;

      if (typeof sessionToken === 'string') {
        const targetSession = await prisma.session.findUnique({
          where: {
            token: sessionToken,
          },
          select: {
            userId: true,
          },
        });

        targetUserId = targetSession?.userId;
      }
    } else if (typeof body.userId === 'string') {
      targetUserId = body.userId;
    }

    // Let Better Auth handle its own missing/invalid input.
    if (!targetUserId) {
      return;
    }

    const targetUser = await prisma.user.findUnique({
      where: {
        id: targetUserId,
      },
      select: {
        role: true,
      },
    });

    // Let Better Auth handle a nonexistent target user.
    if (!targetUser) {
      return;
    }

    const targetRole = targetUser.role ?? 'sales';

    // Check whether actor can manage this target.
    if (!canManageRole(actorRole, targetRole)) {
      throw new APIError('FORBIDDEN', {
        message: 'You cannot manage this user',
      });
    }

    // Validate role changes through set-role.
    if (ctx.path === '/admin/set-role') {
      if (!isRoleInput(body.role) || !canAssignRole(actorRole, body.role)) {
        throw new APIError('FORBIDDEN', {
          message: 'You cannot assign this role',
        });
      }
    }

    // Validate role changes through update-user.
    if (
      ctx.path === '/admin/update-user' &&
      body.data &&
      Object.prototype.hasOwnProperty.call(body.data, 'role')
    ) {
      if (
        !isRoleInput(body.data.role) ||
        !canAssignRole(actorRole, body.data.role)
      ) {
        throw new APIError('FORBIDDEN', {
          message: 'You cannot assign this role',
        });
      }
    }
  });
}
