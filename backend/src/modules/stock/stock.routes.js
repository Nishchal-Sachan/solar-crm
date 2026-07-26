const express = require('express');

function createStockRoutes({ controller, auth, upload }) {
  const router = express.Router();

  router.get('/public/items', controller.listPublicItems);

  router.use(auth.protect);

  router.post('/upload-image', auth.stockItemManage, upload.upload.single('image'), controller.uploadImage);
  router.get('/items', auth.stockAccess, controller.listItems);
  router.post('/items', auth.stockItemManage, controller.createItem);
  router.put('/items/:id', auth.stockItemManage, controller.updateItem);
  router.delete('/items/:id', auth.stockItemManage, controller.deactivateItem);

  router.get('/vouchers', auth.stockAccess, controller.listVouchers);
  router.get('/vouchers/:id', auth.stockAccess, controller.getVoucher);
  router.delete('/vouchers/:id', auth.stockTransact, controller.deleteVoucher);
  router.post('/vouchers', auth.stockTransact, controller.createVoucher);

  return router;
}

module.exports = { createStockRoutes };
