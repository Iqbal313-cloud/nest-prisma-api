export const ROLE_HIERARCHY = {
  superAdmin: 100,
  admin: 80,
  manager: 60,
  inventoryManager: 50,
  accountant: 40,
  sales: 30,
  viewer: 10,
} as const;

export type UserRole = keyof typeof ROLE_HIERARCHY;

function parseRoles(role?: string | string[] | null): string[] {
  if (!role) return [];

  const roles = Array.isArray(role) ? role : role.split(',');

  return roles.map((item) => item.trim()).filter(Boolean);
}

function getHighestRoleLevel(role?: string | string[] | null): number | null {
  const roles = parseRoles(role);

  if (roles.length === 0) return null;

  const levels = roles.map((item) => ROLE_HIERARCHY[item as UserRole]);

  if (levels.some((level) => level === undefined)) {
    return null;
  }

  return Math.max(...levels);
}

export function canManageRole(
  actorRole?: string | string[] | null,
  targetRole?: string | string[] | null,
): boolean {
  const actorLevel = getHighestRoleLevel(actorRole);
  const targetLevel = getHighestRoleLevel(targetRole);

  if (actorLevel === null || targetLevel === null) {
    return false;
  }

  return actorLevel > targetLevel;
}

export function canAssignRole(
  actorRole?: string | string[] | null,
  requestedRole?: string | string[] | null,
): boolean {
  const actorLevel = getHighestRoleLevel(actorRole);
  const requestedLevel = getHighestRoleLevel(requestedRole);

  if (actorLevel === null || requestedLevel === null) {
    return false;
  }

  // Super Admin can assign the Super Admin role.
  if (
    actorLevel === ROLE_HIERARCHY.superAdmin &&
    requestedLevel === ROLE_HIERARCHY.superAdmin
  ) {
    return true;
  }

  return actorLevel > requestedLevel;
}
