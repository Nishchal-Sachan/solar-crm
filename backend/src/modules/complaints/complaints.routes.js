const express = require('express');

function createComplaintsRoutes({ controller, auth }) {
  const router = express.Router();

  router.get('/categories', controller.getCategories);
  router.post('/', controller.registerPublic);

  router.use(auth.protect, auth.complaintsAccess);

  router.get('/', controller.listComplaints);
  router.get('/:id', controller.getComplaint);
  router.put('/:id', controller.updateComplaint);

  return router;
}

module.exports = { createComplaintsRoutes };
