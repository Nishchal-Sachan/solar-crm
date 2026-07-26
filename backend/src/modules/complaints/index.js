const { createComplaintsService } = require('./complaints.service');
const { createComplaintsController } = require('./complaints.controller');
const { createComplaintsRoutes } = require('./complaints.routes');

function createComplaintsModule({ Complaint, User, auth, mail, pagination }) {
  const service = createComplaintsService({ Complaint, User, auth, mail, pagination });
  const controller = createComplaintsController({ service });
  return createComplaintsRoutes({ controller, auth });
}

module.exports = { createComplaintsModule };
