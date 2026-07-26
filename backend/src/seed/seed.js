require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('../models/User');
const StockItem = require('../models/StockItem');
const { DEMO_USERS, DEMO_PASSWORD } = require('./demoUsers');
const { seedDemoData } = require('./demoData');

const sha256 = (str) => crypto.createHash('sha256').update(str).digest('hex');

async function upsertDemoUser(profile) {
  await User.deleteOne({ email: profile.email });
  return User.create({
    name: profile.name,
    email: profile.email,
    password: sha256(DEMO_PASSWORD),
    role: profile.role,
    phone: profile.phone,
    handlesComplaints: profile.handlesComplaints,
    points: profile.points || 0,
    isActive: true,
  });
}

async function seedStockItems() {
  const items = [
    { name: 'Solar Panel 400W Mono PERC', category: 'Solar Panel', unit: 'piece', purchasePrice: 9500, sellPrice: 12000, quantity: 50, minQuantity: 5 },
    { name: 'Solar Panel 550W Bifacial', category: 'Solar Panel', unit: 'piece', purchasePrice: 14000, sellPrice: 17000, quantity: 30, minQuantity: 5 },
    { name: 'Solis 5kW String Inverter', category: 'Inverter', unit: 'piece', purchasePrice: 28000, sellPrice: 35000, quantity: 15, minQuantity: 2 },
    { name: 'GI Mounting Structure per kW', category: 'Structure', unit: 'set', purchasePrice: 3500, sellPrice: 5000, quantity: 40, minQuantity: 5 },
    { name: '4mm Solar DC Wire', category: 'Wire', unit: 'meter', purchasePrice: 25, sellPrice: 40, quantity: 500, minQuantity: 50 },
    { name: '6mm Solar DC Wire', category: 'Wire', unit: 'meter', purchasePrice: 35, sellPrice: 55, quantity: 300, minQuantity: 50 },
    { name: 'ACDB Box 3 Phase', category: 'ACDB/DCDB', unit: 'piece', purchasePrice: 3500, sellPrice: 5500, quantity: 20, minQuantity: 3 },
    { name: 'MC4 Connector Pair', category: 'Accessories', unit: 'pair', purchasePrice: 80, sellPrice: 150, quantity: 200, minQuantity: 20 },
  ];

  const saved = [];
  for (const item of items) {
    let doc = await StockItem.findOne({ name: item.name });
    if (!doc) {
      doc = await StockItem.create(item);
      console.log(`Stock item added: ${item.name}`);
    } else {
      Object.assign(doc, item, { isActive: true });
      await doc.save();
    }
    saved.push(doc);
  }
  return saved;
}

async function seed() {
  if (!process.env.MONGO_URI) {
    console.error('Missing MONGO_URI (see backend/.env.example)');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Optional legacy admin from env — otherwise demo admin is enough
  if (process.env.SEED_ADMIN_EMAIL && process.env.SEED_ADMIN_PASSWORD) {
    const email = process.env.SEED_ADMIN_EMAIL.trim().toLowerCase();
    await User.deleteOne({ email });
    await User.create({
      name: process.env.SEED_ADMIN_NAME?.trim() || 'Admin',
      email,
      password: sha256(process.env.SEED_ADMIN_PASSWORD.trim()),
      role: 'admin',
      phone: process.env.SEED_ADMIN_PHONE?.trim() || '',
    });
    console.log(`Env admin seeded: ${email}`);
  }

  const usersByRole = {};
  for (const profile of DEMO_USERS) {
    const user = await upsertDemoUser(profile);
    usersByRole[profile.role] = user;
    console.log(`Demo user seeded: ${profile.email} (${profile.role})`);
  }

  const stockItems = await seedStockItems();

  await seedDemoData({
    admin: usersByRole.admin,
    manager: usersByRole.manager,
    employee: usersByRole.user,
    stockItems,
  });

  console.log('\nSeed complete!');
  console.log('Demo logins (password for all): Demo@123');
  DEMO_USERS.forEach((u) => console.log(`  ${u.role.padEnd(14)} ${u.email}`));
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
