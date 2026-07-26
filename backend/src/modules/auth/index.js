const { createAuthService } = require('./auth.service');
const { createAuthController } = require('./auth.controller');
const { createAuthRoutes } = require('./auth.routes');

function createAuthModule({ User, auth, token }) {
  const service = createAuthService({ User, token });
  const controller = createAuthController({ service });
  return createAuthRoutes({ controller, auth });
}

module.exports = { createAuthModule };
