const express = require('express');

function createLeadsRoutes({ controller, auth, upload }) {
  const router = express.Router();

  router.post('/public', controller.createPublic);
  router.get('/', auth.protect, controller.listLeads);
  router.get('/stages', auth.protect, controller.getStages);
  router.get('/stats', auth.protect, controller.getStats);
  router.get('/leaderboard', auth.protect, controller.getLeaderboard);
  router.post('/bulk-delete', auth.protect, auth.adminOnly, controller.bulkDelete);
  router.get('/:id', auth.protect, controller.getLead);
  router.post('/', auth.protect, controller.createLead);
  router.put('/:id/stage', auth.protect, controller.updateStage);
  router.put('/:id/assign', auth.protect, controller.assignLead);
  router.post('/:id/notes', auth.protect, upload.upload.array('images', 6), controller.addNote);
  router.delete('/:id/notes/:noteId', auth.protect, controller.deleteNote);
  router.put('/:id', auth.protect, controller.updateLead);
  router.delete('/:id', auth.protect, auth.adminOnly, controller.deleteLead);

  return router;
}

module.exports = { createLeadsRoutes };
