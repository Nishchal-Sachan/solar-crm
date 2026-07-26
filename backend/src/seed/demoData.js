const Lead = require('../models/Lead');

const DEMO_TAG = '[demo]';

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function seedDemoData({ admin, manager, employee, stockItems }) {
  // Clear previous demo-tagged records so re-seed is safe
  await Lead.deleteMany({ source: { $regex: /^Demo/i } });
  const Complaint = require('../models/Complaint');
  const Order = require('../models/Order');
  const StockVoucher = require('../models/StockVoucher');

  await Complaint.deleteMany({ description: { $regex: DEMO_TAG } });
  await Order.deleteMany({ notes: { $regex: DEMO_TAG } });
  await StockVoucher.deleteMany({ note: { $regex: DEMO_TAG } });

  const leadNames = [
    { name: 'Demo Lead 01', phone: '0000000001', city: 'Demo City A', stage: 'Lead', size: '3kW' },
    { name: 'Demo Lead 02', phone: '0000000002', city: 'Demo City B', stage: 'Calling', size: '5kW' },
    { name: 'Demo Lead 03', phone: '0000000003', city: 'Demo City A', stage: 'Visit', size: '5kW' },
    { name: 'Demo Lead 04', phone: '0000000004', city: 'Demo City C', stage: 'Filing', size: '3kW' },
    { name: 'Demo Lead 05', phone: '0000000005', city: 'Demo City A', stage: 'Loan Filing', size: '10kW' },
    { name: 'Demo Lead 06', phone: '0000000006', city: 'Demo City B', stage: 'Loan Process', size: '5kW' },
    { name: 'Demo Lead 07', phone: '0000000007', city: 'Demo City A', stage: 'Installation', size: '3kW' },
    { name: 'Demo Lead 08', phone: '0000000008', city: 'Demo City B', stage: 'Kesco Filing', size: '5kW' },
    { name: 'Demo Lead 09', phone: '0000000009', city: 'Demo City A', stage: 'Meter Install', size: '10kW' },
    { name: 'Demo Lead 10', phone: '0000000010', city: 'Demo City C', stage: 'Subsidy Apply', size: '3kW' },
    { name: 'Demo Lead 11', phone: '0000000011', city: 'Demo City A', stage: 'Subsidy Release', size: '5kW' },
    { name: 'Demo Lead 12', phone: '0000000012', city: 'Demo City B', stage: 'Commission', size: '5kW' },
    { name: 'Demo Lead 13', phone: '0000000013', city: 'Demo City A', stage: 'Lead', size: '2kW' },
    { name: 'Demo Lead 14', phone: '0000000014', city: 'Demo City B', stage: 'Calling', size: '5kW' },
    { name: 'Demo Lead 15', phone: '0000000015', city: 'Demo City A', stage: 'Visit', size: '10kW' },
  ];

  const leads = [];
  for (let i = 0; i < leadNames.length; i++) {
    const row = leadNames[i];
    const assignee = i % 3 === 0 ? employee : (i % 2 === 0 ? manager : admin);
    const created = daysAgo(20 - i);
    const n = String(i + 1).padStart(2, '0');
    const lead = await Lead.create({
      name: row.name,
      phone: row.phone,
      email: `demo.lead.${n}@example.com`,
      address: `Plot ${100 + i}, Demo Sample Colony`,
      city: row.city,
      requirements: `[DEMO] Sample rooftop enquiry ${row.size}`,
      systemSize: row.size,
      source: 'Demo Seed',
      stage: row.stage,
      assignedTo: assignee._id,
      createdBy: admin._id,
      stageHistory: [{
        stage: 'Lead',
        assignedTo: assignee._id,
        movedBy: admin._id,
        note: 'Lead created (demo)',
        date: created,
      }, ...(row.stage !== 'Lead' ? [{
        stage: row.stage,
        assignedTo: assignee._id,
        movedBy: manager._id,
        note: `Moved to ${row.stage} (demo)`,
        date: daysAgo(10 - (i % 8)),
      }] : [])],
      notes: i % 4 === 0 ? [{
        text: `Follow-up call completed ${DEMO_TAG}`,
        images: [],
        addedBy: assignee._id,
        date: daysAgo(3),
      }] : [],
      createdAt: created,
      updatedAt: daysAgo(i % 7),
    });
    leads.push(lead);
  }
  console.log(`Demo leads seeded: ${leads.length}`);

  const complaints = [
    {
      complaintNumber: 'CP-D0001',
      category: 'Inverter Fault',
      name: 'Ravi Kapoor',
      phone: '9811100001',
      email: 'ravi.kapoor@example.com',
      address: '12 Civil Lines, Kanpur',
      description: `Inverter showing error code E01 ${DEMO_TAG}`,
      status: 'Open',
      assignedTo: employee._id,
    },
    {
      complaintNumber: 'CP-D0002',
      category: 'Low Power Generation',
      name: 'Sangeeta Rai',
      phone: '9811100002',
      email: 'sangeeta.rai@example.com',
      address: '45 Swaroop Nagar, Kanpur',
      description: `Generation dropped after monsoon ${DEMO_TAG}`,
      status: 'In Progress',
      assignedTo: employee._id,
    },
    {
      complaintNumber: 'CP-D0003',
      category: 'Panel Cleaning/Maintenance Required',
      name: 'Mohit Agarwal',
      phone: '9811100003',
      email: 'mohit.a@example.com',
      address: '8 Sharda Nagar, Kanpur',
      description: `Annual cleaning requested ${DEMO_TAG}`,
      status: 'Resolved',
      assignedTo: null,
    },
    {
      complaintNumber: 'CP-D0004',
      category: 'Net Meter Fault',
      name: 'Farhan Ali',
      phone: '9811100004',
      email: 'farhan.ali@example.com',
      address: '22 Kakadeo, Kanpur',
      description: `Meter not recording export ${DEMO_TAG}`,
      status: 'Open',
      assignedTo: employee._id,
    },
  ];

  await Complaint.deleteMany({ complaintNumber: { $regex: /^CP-D/ } });
  for (const c of complaints) {
    await Complaint.create(c);
  }
  console.log(`Demo complaints seeded: ${complaints.length}`);

  const panel = stockItems.find((i) => /panel/i.test(i.name)) || stockItems[0];
  const inverter = stockItems.find((i) => /inverter/i.test(i.name)) || stockItems[1] || stockItems[0];

  const orders = [
    {
      orderNumber: `ORD-${new Date().getFullYear()}-900001`,
      customerName: 'Shop Customer One',
      phone: '9822200001',
      address: 'Market Road 1',
      city: 'Kanpur',
      notes: `Offline shop inquiry ${DEMO_TAG}`,
      items: [{
        itemId: panel._id,
        itemName: panel.name,
        category: panel.category,
        price: panel.sellPrice,
        quantity: 2,
        unit: panel.unit,
        total: panel.sellPrice * 2,
      }],
      totalAmount: panel.sellPrice * 2,
      status: 'Pending',
      assignedTo: manager._id,
    },
    {
      orderNumber: `ORD-${new Date().getFullYear()}-900002`,
      customerName: 'Shop Customer Two',
      phone: '9822200002',
      address: 'Market Road 2',
      city: 'Lucknow',
      notes: `Wants inverter quote ${DEMO_TAG}`,
      items: [{
        itemId: inverter._id,
        itemName: inverter.name,
        category: inverter.category,
        price: inverter.sellPrice,
        quantity: 1,
        unit: inverter.unit,
        total: inverter.sellPrice,
      }],
      totalAmount: inverter.sellPrice,
      status: 'Confirmed',
      assignedTo: admin._id,
    },
    {
      orderNumber: `ORD-${new Date().getFullYear()}-900003`,
      customerName: 'Shop Customer Three',
      phone: '9822200003',
      address: 'Market Road 3',
      city: 'Kanpur',
      notes: `Bundle request ${DEMO_TAG}`,
      items: [
        {
          itemId: panel._id,
          itemName: panel.name,
          category: panel.category,
          price: panel.sellPrice,
          quantity: 4,
          unit: panel.unit,
          total: panel.sellPrice * 4,
        },
        {
          itemId: inverter._id,
          itemName: inverter.name,
          category: inverter.category,
          price: inverter.sellPrice,
          quantity: 1,
          unit: inverter.unit,
          total: inverter.sellPrice,
        },
      ],
      totalAmount: panel.sellPrice * 4 + inverter.sellPrice,
      status: 'Pending',
      assignedTo: manager._id,
    },
  ];

  for (const o of orders) {
    await Order.create(o);
  }
  console.log(`Demo orders seeded: ${orders.length}`);

  if (panel && inverter) {
    await StockVoucher.create({
      type: 'SELL',
      items: [{
        item: panel._id,
        itemName: panel.name,
        unit: panel.unit || 'piece',
        quantity: 2,
        price: panel.sellPrice,
        total: panel.sellPrice * 2,
      }],
      totalAmount: panel.sellPrice * 2,
      party: 'Demo Customer Pvt Ltd',
      partyAddress: 'Kanpur',
      note: `Sample sale voucher ${DEMO_TAG}`,
      date: daysAgo(5),
      createdBy: admin._id,
    });

    await StockVoucher.create({
      type: 'ADD',
      items: [{
        item: inverter._id,
        itemName: inverter.name,
        unit: inverter.unit || 'piece',
        quantity: 3,
        price: inverter.purchasePrice || 1000,
        total: (inverter.purchasePrice || 1000) * 3,
      }],
      totalAmount: (inverter.purchasePrice || 1000) * 3,
      party: 'Demo Supplier',
      partyAddress: 'Delhi',
      note: `Sample purchase voucher ${DEMO_TAG}`,
      date: daysAgo(12),
      createdBy: admin._id,
    });
    console.log('Demo stock vouchers seeded: 2');
  }
}

module.exports = { seedDemoData, DEMO_TAG };
