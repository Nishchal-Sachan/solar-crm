const { createOrdersService } = require('./orders.service');
const { createOrdersController } = require('./orders.controller');
const { createOrdersRoutes } = require('./orders.routes');

function createOrdersModule({ Order, User, auth, pagination }) {
  const service = createOrdersService({ Order, User, pagination });
  const controller = createOrdersController({ service });
  return createOrdersRoutes({ controller, auth });
}

module.exports = { createOrdersModule };
