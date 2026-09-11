// Central permission matrix — one source of truth for what each admin-tier role can do.
// 'superadmin' always bypasses this (full platform control per spec section 24).
const PERMISSIONS = {
  superadmin: ['*'],

  admin: [
    'users.manage', 'sellers.manage', 'products.manage', 'categories.manage', 'brands.manage',
    'orders.view', 'orders.manage', 'payments.view', 'returns.manage', 'refunds.manage',
    'coupons.manage', 'offers.manage', 'banners.manage', 'support.manage', 'notifications.send',
    'analytics.view', 'reports.view', 'auditlogs.view', 'settings.manage', 'campaigns.approve',
  ],

  product_manager: [
    'products.manage', 'categories.manage', 'brands.manage', 'campaigns.approve', 'analytics.view',
  ],

  order_manager: [
    'orders.view', 'orders.manage', 'returns.manage', 'analytics.view',
  ],

  finance_manager: [
    'payments.view', 'refunds.manage', 'coupons.manage', 'offers.manage', 'reports.view', 'analytics.view',
  ],

  support_manager: [
    'support.manage', 'notifications.send', 'users.manage',
  ],
};

function hasPermission(role, permission) {
  const perms = PERMISSIONS[role];
  if (!perms) return false;
  return perms.includes('*') || perms.includes(permission);
}

// Any role allowed through the /admin/* front door at all (fine-grained gating happens per-route)
const ADMIN_TIER_ROLES = ['admin', 'superadmin', 'product_manager', 'order_manager', 'finance_manager', 'support_manager'];

module.exports = { PERMISSIONS, hasPermission, ADMIN_TIER_ROLES };