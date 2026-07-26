const { canViewAllLeads } = require('../middleware/auth');

function buildLeadFilter(user, query = {}) {
  const filter = {};
  if (!canViewAllLeads(user)) filter.assignedTo = user._id;
  if (query.stage) filter.stage = query.stage;
  if (query.assignedTo) filter.assignedTo = query.assignedTo;

  const search = (query.search || '').trim();
  if (search) {
    filter.$text = { $search: search };
  }
  return filter;
}

module.exports = { buildLeadFilter };
