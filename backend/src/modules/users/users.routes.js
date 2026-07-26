const express = require('express');

function createUsersRoutes({ controller, auth }) {
  const router = express.Router();

  router.get('/assignees', auth.protect, controller.listAssignees);
  router.get('/complaint-handlers', auth.protect, auth.adminOnly, controller.listComplaintHandlers);
  router.get('/team', auth.protect, auth.teamViewAccess, controller.listTeam);
  router.get('/', auth.protect, auth.adminOnly, controller.listUsers);
  router.post('/reset-points', auth.protect, auth.adminOnly, controller.resetAllPoints);
  router.post('/:id/reset-points', auth.protect, auth.adminOnly, controller.resetUserPoints);
  router.post('/', auth.protect, auth.adminOnly, controller.createUser);
  router.put('/:id', auth.protect, auth.adminOnly, controller.updateUser);
  router.delete('/:id', auth.protect, auth.adminOnly, controller.deleteUser);

  return router;
}

module.exports = { createUsersRoutes };
