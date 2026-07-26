const { createDashboardService } = require('./dashboard.service');
const { createDashboardController } = require('./dashboard.controller');
const { createDashboardRoutes } = require('./dashboard.routes');

function createDashboardModule(deps) {
  const service = createDashboardService(deps);
  const controller = createDashboardController({ service });
  return createDashboardRoutes({ controller, auth: deps.auth });
}

module.exports = { createDashboardModule };
