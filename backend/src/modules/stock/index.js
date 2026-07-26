const { createStockService } = require('./stock.service');
const { createStockController } = require('./stock.controller');
const { createStockRoutes } = require('./stock.routes');

function createStockModule({ StockItem, StockVoucher, auth, dashCache, pagination, upload }) {
  const uploadHelpers = {
    compressAndUpload: upload.compressAndUpload,
  };
  const service = createStockService({
    StockItem, StockVoucher, auth, dashCache, pagination, uploadHelpers,
  });
  const controller = createStockController({ service });
  return createStockRoutes({ controller, auth, upload });
}

module.exports = { createStockModule };
