const express = require('express');

function createAuthRoutes({ controller, auth }) {
  const router = express.Router();

  router.post('/login', controller.login);
  router.get('/me', auth.protect, controller.me);
  router.post('/refresh', auth.protect, controller.refresh);

  return router;
}

module.exports = { createAuthRoutes };
