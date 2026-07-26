const express = require('express');

function createQuotationsRoutes({ controller, auth }) {
  const router = express.Router();

  router.get('/templates', auth.protect, controller.listTemplates);
  router.post('/templates', auth.protect, auth.adminOnly, controller.createTemplate);
  router.put('/templates/:id', auth.protect, auth.adminOnly, controller.updateTemplate);
  router.delete('/templates/:id', auth.protect, auth.adminOnly, controller.deleteTemplate);

  return router;
}

module.exports = { createQuotationsRoutes };
