const express = require('express');

function createOrdersRoutes({ controller, auth }) {
  const router = express.Router();

  router.post('/public', controller.createPublic);
  router.use(auth.protect);
  router.get('/', controller.listOrders);
  router.get('/:id', controller.getOrder);
  router.put('/:id', controller.updateOrder);
  router.delete('/:id', controller.deleteOrder);

  return router;
}

module.exports = { createOrdersRoutes };
