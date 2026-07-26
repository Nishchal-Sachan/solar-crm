const express = require('express');

function createDashboardRoutes({ controller, auth }) {
  const router = express.Router();

  router.get('/crm', auth.protect, controller.crm);
  router.get('/admin', auth.protect, auth.adminOnly, controller.admin);
  router.get('/stock', auth.protect, auth.stockAccess, controller.stock);

  return router;
}

module.exports = { createDashboardRoutes };
