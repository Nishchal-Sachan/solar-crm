const { createUsersService } = require('./users.service');
const { createUsersController } = require('./users.controller');
const { createUsersRoutes } = require('./users.routes');

function createUsersModule({ User, auth, dashCache, token, pagination }) {
  const service = createUsersService({ User, dashCache, token, pagination });
  const controller = createUsersController({ service });
  return createUsersRoutes({ controller, auth });
}

module.exports = { createUsersModule };
