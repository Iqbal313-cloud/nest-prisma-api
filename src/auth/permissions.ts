import { createAccessControl } from 'better-auth/plugins/access';
import { defaultStatements, adminAc } from 'better-auth/plugins/admin/access';

const statement = {
  ...defaultStatements,

  product: ['create', 'read', 'update', 'delete'],
  category: ['create', 'read', 'update', 'delete'],
  order: ['create', 'read', 'update', 'delete'],
  customer: ['create', 'read', 'update', 'delete'],
  employee: ['create', 'read', 'update', 'delete'],
  supplier: ['create', 'read', 'update', 'delete'],
  analytics: ['read'],
  monitoring: ['read'],
} as const;

export const ac = createAccessControl(statement);

// Super Admin permissions
// Super Admin permissions
export const superAdmin = ac.newRole({
  ...adminAc.statements,

  user: [...adminAc.statements.user, 'impersonate-admins'],

  product: ['create', 'read', 'update', 'delete'],
  category: ['create', 'read', 'update', 'delete'],
  order: ['create', 'read', 'update', 'delete'],
  customer: ['create', 'read', 'update', 'delete'],
  employee: ['create', 'read', 'update', 'delete'],
  supplier: ['create', 'read', 'update', 'delete'],
  analytics: ['read'],
  monitoring: ['read'],
});

// Admin permissions
export const admin = ac.newRole({
  ...adminAc.statements,

  product: ['create', 'read', 'update', 'delete'],
  category: ['create', 'read', 'update', 'delete'],
  order: ['create', 'read', 'update', 'delete'],
  customer: ['create', 'read', 'update', 'delete'],
  employee: ['create', 'read', 'update', 'delete'],
  supplier: ['create', 'read', 'update', 'delete'],
  analytics: ['read'],
  monitoring: ['read'],
});

// Manager permissions
export const manager = ac.newRole({
  product: ['read'],
  category: ['read'],
  order: ['create', 'read', 'update'],
  customer: ['create', 'read', 'update'],
  employee: ['read'],
  supplier: ['read'],
  analytics: ['read'],
  monitoring: ['read'],
});

// Sales permissions
export const sales = ac.newRole({
  product: ['read'],
  category: ['read'],
  supplier: ['read'],
  order: ['create', 'read', 'update'],
  customer: ['create', 'read', 'update'],
});

// Accountant permissions
export const accountant = ac.newRole({
  order: ['read'],
  customer: ['read'],
  analytics: ['read'],
});

// Inventory Manager permissions
export const inventoryManager = ac.newRole({
  product: ['create', 'read', 'update'],
  category: ['read'],
  supplier: ['create', 'read', 'update'],
});

// Viewer permissions
export const viewer = ac.newRole({
  product: ['read'],
  category: ['read'],
  order: ['read'],
  customer: ['read'],
  employee: ['read'],
  supplier: ['read'],
  analytics: ['read'],
  monitoring: ['read'],
});
