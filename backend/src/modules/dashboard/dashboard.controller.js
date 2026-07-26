const { sendError } = require('../../shared/utils/sendError');

function createDashboardController({ service }) {
  return {
    async crm(req, res) {
      try {
        res.json(await service.getCrmDashboard(req.user));
      } catch (err) {
        sendError(res, err, 'Could not load dashboard.');
      }
    },
    async admin(req, res) {
      try {
        res.json(await service.getAdminDashboard());
      } catch (err) {
        sendError(res, err, 'Could not load dashboard.');
      }
    },
    async stock(req, res) {
      try {
        res.json(await service.getStockDashboard(req.user));
      } catch (err) {
        sendError(res, err, 'Could not load dashboard.');
      }
    },
  };
}

module.exports = { createDashboardController };
