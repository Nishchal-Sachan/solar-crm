const { httpError } = require('../../shared/utils/sendError');

function canManageAllOrders(user) {
  return user.role === 'admin' || user.role === 'manager' || user.role === 'stock_manager';
}

function createOrdersService({ Order, User, pagination }) {
  async function createPublic(body) {
    const { customerName, phone, address, city, notes, items, totalAmount } = body;
    if (!customerName || !phone || !address || !city || !items || !Array.isArray(items) || items.length === 0) {
      throw httpError(400, 'Missing required customer or items details');
    }

    const datePrefix = `ORD-${new Date().getFullYear()}`;
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const orderNumber = `${datePrefix}-${randomSuffix}`;

    const admin = await User.findOne({ role: 'admin', isActive: true });

    return Order.create({
      orderNumber,
      customerName,
      phone,
      address,
      city,
      notes,
      items,
      totalAmount,
      assignedTo: admin ? admin._id : undefined,
    });
  }

  async function listOrders(user, query) {
    const filter = {};
    if (!canManageAllOrders(user)) {
      filter.assignedTo = user._id;
    }
    if (query.status) filter.status = query.status;

    const search = (query.search || '').trim();
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    return {
      orders,
      pagination: pagination.paginationMeta(page, limit, total),
    };
  }

  async function getOrder(id, user) {
    const filter = { _id: id };
    if (!canManageAllOrders(user)) {
      filter.assignedTo = user._id;
    }
    const order = await Order.findOne(filter).populate('assignedTo', 'name email');
    if (!order) throw httpError(404, 'Order not found');
    return order;
  }

  async function updateOrder(id, user, body) {
    const filter = { _id: id };
    if (!canManageAllOrders(user)) {
      filter.assignedTo = user._id;
    }

    const order = await Order.findOne(filter);
    if (!order) throw httpError(404, 'Order not found');

    const { status, assignedTo } = body;
    if (status) order.status = status;
    if (assignedTo && canManageAllOrders(user)) order.assignedTo = assignedTo;

    await order.save();
    return Order.findById(order._id).populate('assignedTo', 'name email');
  }

  async function deleteOrder(id, user) {
    if (user.role !== 'admin') {
      throw httpError(403, 'Access denied: Admin only');
    }
    const order = await Order.findByIdAndDelete(id);
    if (!order) throw httpError(404, 'Order not found');
    return { message: 'Order deleted successfully' };
  }

  return { createPublic, listOrders, getOrder, updateOrder, deleteOrder };
}

module.exports = { createOrdersService };
