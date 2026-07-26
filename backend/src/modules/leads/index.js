const { createLeadsService } = require('./leads.service');
const { createLeadsController } = require('./leads.controller');
const { createLeadsRoutes } = require('./leads.routes');

function createLeadsModule({ Lead, User, auth, dashCache, token, upload }) {
  const uploadHelpers = {
    uploadMany: upload.uploadMany,
    destroyMany: upload.destroyMany,
  };
  const service = createLeadsService({ Lead, User, dashCache, token, uploadHelpers });
  const controller = createLeadsController({ service });
  return createLeadsRoutes({ controller, auth, upload });
}

module.exports = { createLeadsModule };
