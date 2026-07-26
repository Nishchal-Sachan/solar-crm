const DEMO_PASSWORD = 'Demo@123';

const DEMO_USERS = [
  {
    name: 'Demo Admin',
    email: 'admin@demo.solarji.com',
    role: 'admin',
    phone: '9000000001',
    handlesComplaints: false,
    points: 12,
  },
  {
    name: 'Demo Manager',
    email: 'manager@demo.solarji.com',
    role: 'manager',
    phone: '9000000002',
    handlesComplaints: false,
    points: 28,
  },
  {
    name: 'Demo Stock',
    email: 'stock@demo.solarji.com',
    role: 'stock_manager',
    phone: '9000000003',
    handlesComplaints: false,
    points: 5,
  },
  {
    name: 'Demo Employee',
    email: 'employee@demo.solarji.com',
    role: 'user',
    phone: '9000000004',
    handlesComplaints: true,
    points: 18,
  },
];

module.exports = { DEMO_USERS, DEMO_PASSWORD };
