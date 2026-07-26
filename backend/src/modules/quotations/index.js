const { createQuotationsService } = require('./quotations.service');
const { createQuotationsController } = require('./quotations.controller');
const { createQuotationsRoutes } = require('./quotations.routes');

function createQuotationsModule({ QuotationTemplate, auth }) {
  const service = createQuotationsService({ QuotationTemplate });
  const controller = createQuotationsController({ service });
  return createQuotationsRoutes({ controller, auth });
}

module.exports = { createQuotationsModule };
