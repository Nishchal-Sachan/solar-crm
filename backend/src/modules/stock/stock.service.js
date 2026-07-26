const { httpError } = require('../../shared/utils/sendError');

function createStockService({ StockItem, StockVoucher, auth, dashCache, pagination, uploadHelpers }) {
  async function loadStockItemMap(itemIds) {
    const uniqueIds = [...new Set(itemIds.map(String))];
    if (!uniqueIds.length) return new Map();
    const stockItems = await StockItem.find({ _id: { $in: uniqueIds }, isActive: true });
    return new Map(stockItems.map((item) => [String(item._id), item]));
  }

  function applyVoucherRowChange(changes, stockItem, type, row) {
    const id = String(stockItem._id);
    if (!changes.has(id)) {
      changes.set(id, {
        item: stockItem,
        quantityDelta: 0,
        purchasePrice: undefined,
        sellPrice: undefined,
      });
    }

    const change = changes.get(id);
    const price = type === 'ADD'
      ? (row.price ?? stockItem.purchasePrice)
      : (row.price ?? stockItem.sellPrice);

    change.quantityDelta += type === 'ADD' ? row.quantity : -row.quantity;
    if (row.price && type === 'ADD') change.purchasePrice = row.price;
    if (row.price && type === 'SELL') change.sellPrice = row.price;

    return { price, total: price * row.quantity };
  }

  function buildStockBulkOps(changes) {
    return [...changes.entries()].map(([id, change]) => {
      const update = { $inc: { quantity: change.quantityDelta } };
      const $set = {};
      if (change.purchasePrice !== undefined) $set.purchasePrice = change.purchasePrice;
      if (change.sellPrice !== undefined) $set.sellPrice = change.sellPrice;
      if (Object.keys($set).length) update.$set = $set;
      return { updateOne: { filter: { _id: id }, update } };
    });
  }

  function duplicateItemMessage(name) {
    return `"${name}" already exists. Edit that item or use Stock Voucher to add quantity.`;
  }

  async function listPublicItems() {
    const items = await StockItem.find({ isActive: true })
      .select('name category unit sellPrice quantity imageUrl')
      .sort({ name: 1 })
      .lean();
    return { items };
  }

  async function uploadImage(file) {
    if (!file) throw httpError(400, 'No file uploaded');
    const result = await uploadHelpers.compressAndUpload(file, { folder: 'solarji/stock' });
    return { imageUrl: result.url };
  }

  async function listItems(user, query) {
    const canSeePurchaseCost = auth.canTransactStock(user);
    if (query.picker === '1') {
      const search = (query.search || '').trim();
      const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 100));
      const filter = { isActive: true };
      if (search) filter.name = { $regex: search, $options: 'i' };
      const selectFields = canSeePurchaseCost
        ? 'name quantity unit purchasePrice sellPrice'
        : 'name quantity unit sellPrice';
      const items = await StockItem.find(filter)
        .select(selectFields)
        .sort({ name: 1 })
        .limit(limit)
        .lean();
      return { items };
    }

    const { page, limit, skip } = pagination.parsePagination(query, 20, 100);
    const filter = { isActive: true };
    const search = (query.search || '').trim();
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    const findQuery = StockItem.find(filter).sort({ name: 1 }).skip(skip).limit(limit);
    if (!canSeePurchaseCost) {
      findQuery.select('-purchasePrice');
    }

    const [items, total] = await Promise.all([
      findQuery,
      StockItem.countDocuments(filter),
    ]);

    return { items, pagination: pagination.paginationMeta(page, limit, total) };
  }

  async function createItem(body) {
    const data = { ...body, name: body.name?.trim() };
    if (!data.name) throw httpError(400, 'Item name required');

    const existing = await StockItem.findOne({ name: data.name });
    if (existing) {
      if (existing.isActive) {
        throw httpError(409, duplicateItemMessage(existing.name));
      }
      Object.assign(existing, data, { isActive: true });
      await existing.save();
      dashCache.invalidateStock();
      dashCache.invalidateAdmin();
      return { item: existing, created: false };
    }

    const item = await StockItem.create(data);
    dashCache.invalidateStock();
    dashCache.invalidateAdmin();
    return { item, created: true };
  }

  async function updateItem(id, body) {
    const data = { ...body };
    if (data.name) data.name = data.name.trim();

    if (data.name) {
      const duplicate = await StockItem.findOne({
        name: data.name,
        _id: { $ne: id },
        isActive: true,
      });
      if (duplicate) {
        throw httpError(409, duplicateItemMessage(duplicate.name));
      }
    }

    const item = await StockItem.findByIdAndUpdate(id, data, { new: true });
    dashCache.invalidateStock();
    return item;
  }

  async function deactivateItem(id) {
    await StockItem.findByIdAndUpdate(id, { isActive: false });
    dashCache.invalidateStock();
    dashCache.invalidateAdmin();
    return { message: 'Item deactivated' };
  }

  async function listVouchers(user, query) {
    const { page, limit, skip } = pagination.parsePagination(query);
    const filter = {};
    if (query.type) filter.type = query.type;

    const [vouchers, total, summaryAgg] = await Promise.all([
      StockVoucher.find(filter)
        .populate('createdBy', 'name')
        .populate('items.item', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      StockVoucher.countDocuments(filter),
      StockVoucher.aggregate([
        ...(Object.keys(filter).length ? [{ $match: filter }] : []),
        { $group: { _id: '$type', total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    const summary = { purchase: 0, sales: 0 };
    summaryAgg.forEach((row) => {
      if (row._id === 'ADD') summary.purchase = row.total;
      if (row._id === 'SELL') summary.sales = row.total;
    });

    return { vouchers, pagination: pagination.paginationMeta(page, limit, total), summary };
  }

  async function getVoucher(id) {
    const voucher = await StockVoucher.findById(id)
      .populate('createdBy', 'name')
      .populate('items.item');
    if (!voucher) throw httpError(404, 'Voucher not found');
    return voucher;
  }

  async function deleteVoucher(id) {
    const voucher = await StockVoucher.findById(id).populate('items.item');
    if (!voucher) throw httpError(404, 'Voucher not found');

    const reverseType = voucher.type === 'ADD' ? 'SELL' : 'ADD';
    const changes = new Map();

    for (const row of voucher.items) {
      const stockItem = row.item;
      if (!stockItem?._id) continue;
      applyVoucherRowChange(changes, stockItem, reverseType, row);
    }

    const bulkOps = buildStockBulkOps(changes);
    if (bulkOps.length) await StockItem.bulkWrite(bulkOps);

    await StockVoucher.findByIdAndDelete(id);
    dashCache.invalidateStock();
    dashCache.invalidateAdmin();
    return { message: 'Voucher deleted and stock reversed' };
  }

  async function createVoucher(body, user) {
    const { type, items, party, partyAddress, note, date } = body;
    if (!items?.length) {
      throw httpError(400, 'At least one item is required');
    }

    const itemMap = await loadStockItemMap(items.map((row) => row.item));
    const changes = new Map();
    let totalAmount = 0;
    const processedItems = [];

    for (const row of items) {
      const stockItem = itemMap.get(String(row.item));
      if (!stockItem) {
        throw httpError(400, `Item not found: ${row.item}`);
      }

      const { price, total } = applyVoucherRowChange(changes, stockItem, type, row);
      totalAmount += total;

      processedItems.push({
        item: stockItem._id,
        itemName: stockItem.name,
        unit: stockItem.unit || 'piece',
        quantity: row.quantity,
        price,
        total,
      });
    }

    for (const change of changes.values()) {
      const newQuantity = change.item.quantity + change.quantityDelta;
      if (newQuantity < 0) {
        throw httpError(400, `Insufficient stock for ${change.item.name}`);
      }
    }

    const bulkOps = buildStockBulkOps(changes);
    if (bulkOps.length) await StockItem.bulkWrite(bulkOps);

    const voucher = await StockVoucher.create({
      type,
      items: processedItems,
      totalAmount,
      party,
      partyAddress,
      note,
      date: date ? new Date(date) : new Date(),
      createdBy: user._id,
    });

    await voucher.populate('createdBy', 'name');
    dashCache.invalidateStock();
    dashCache.invalidateAdmin();
    return voucher;
  }

  return {
    listPublicItems,
    uploadImage,
    listItems,
    createItem,
    updateItem,
    deactivateItem,
    listVouchers,
    getVoucher,
    deleteVoucher,
    createVoucher,
  };
}

module.exports = { createStockService };
