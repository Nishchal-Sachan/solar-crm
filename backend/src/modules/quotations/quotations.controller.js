const { sendError } = require('../../shared/utils/sendError');

function createQuotationsController({ service }) {
  return {
    async listTemplates(req, res) {
      try {
        res.json(await service.listTemplates());
      } catch (err) {
        sendError(res, err);
      }
    },
    async createTemplate(req, res) {
      try {
        res.status(201).json(await service.createTemplate(req.body, req.user._id));
      } catch (err) {
        sendError(res, err);
      }
    },
    async updateTemplate(req, res) {
      try {
        res.json(await service.updateTemplate(req.params.id, req.body));
      } catch (err) {
        sendError(res, err);
      }
    },
    async deleteTemplate(req, res) {
      try {
        res.json(await service.deleteTemplate(req.params.id));
      } catch (err) {
        sendError(res, err);
      }
    },
  };
}

module.exports = { createQuotationsController };
