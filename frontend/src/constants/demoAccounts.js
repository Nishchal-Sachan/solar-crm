/** Portfolio demo accounts — must match backend/src/seed/demoUsers.js */
export const DEMO_PASSWORD = 'Demo@123';

export const DEMO_ACCOUNTS = [
  {
    role: 'admin',
    label: 'Admin',
    description: 'Full CRM, stock & users',
    email: 'admin@demo.solarji.com',
    password: DEMO_PASSWORD,
  },
  {
    role: 'manager',
    label: 'Manager',
    description: 'All leads & team view',
    email: 'manager@demo.solarji.com',
    password: DEMO_PASSWORD,
  },
  {
    role: 'stock_manager',
    label: 'Stock Manager',
    description: 'Inventory & vouchers',
    email: 'stock@demo.solarji.com',
    password: DEMO_PASSWORD,
  },
  {
    role: 'user',
    label: 'Employee',
    description: 'Assigned leads & complaints',
    email: 'employee@demo.solarji.com',
    password: DEMO_PASSWORD,
  },
];
