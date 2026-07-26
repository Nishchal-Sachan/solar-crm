const { sendError } = require('../../shared/utils/sendError');

function createComplaintsController({ service }) {
  return {
    getCategories(req, res) {
      res.json(service.getCategories());
    },
    async registerPublic(req, res) {
      try {
        res.status(201).json(await service.registerPublic(req.body));
      } catch (err) {
        sendError(res, err);
      }
    },
    async listComplaints(req, res) {
      try {
        res.json(await service.listComplaints(req.user, req.query));
      } catch (err) {
        sendError(res, err);
      }
    },
    async getComplaint(req, res) {
      try {
        res.json(await service.getComplaint(req.params.id, req.user));
      } catch (err) {
        sendError(res, err);
      }
    },
    async updateComplaint(req, res) {
      try {
        res.json(await service.updateComplaint(req.params.id, req.user, req.body));
      } catch (err) {
        sendError(res, err);
      }
    },
  };
}

module.exports = { createComplaintsController };
