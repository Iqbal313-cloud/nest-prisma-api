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
  monitoring: ['read'],
} as const;

export const ac = createAccessControl(statement);

// Full access to Admin Plugin + Ecommerce resources
export const admin = ac.newRole({
  ...adminAc.statements,

  product: ['create', 'read', 'update', 'delete'],
  category: ['create', 'read', 'update', 'delete'],
  order: ['create', 'read', 'update', 'delete'],
  customer: ['create', 'read', 'update', 'delete'],
  employee: ['create', 'read', 'update', 'delete'],
  supplier: ['create', 'read', 'update', 'delete'],
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
  monitoring: ['read'],
});

// Sales permissions
export const sales = ac.newRole({
  product: ['read'],
  category: ['read'],
  order: ['create', 'read', 'update'],
  customer: ['create', 'read', 'update'],
});
