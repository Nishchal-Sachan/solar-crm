const { sendError } = require('../../shared/utils/sendError');

function createLeadsController({ service }) {
  return {
    async createPublic(req, res) {
      try {
        res.status(201).json(await service.createPublic(req.body));
      } catch (err) {
        sendError(res, err);
      }
    },
    async listLeads(req, res) {
      try {
        res.json(await service.listLeads(req.user, req.query));
      } catch (err) {
        sendError(res, err);
      }
    },
    getStages(req, res) {
      res.json(service.getStages());
    },
    async getStats(req, res) {
      try {
        res.json(await service.getStats(req.user, req.query));
      } catch (err) {
        sendError(res, err);
      }
    },
    async getLeaderboard(req, res) {
      try {
        res.json(await service.getLeaderboard());
      } catch (err) {
        sendError(res, err);
      }
    },
    async bulkDelete(req, res) {
      try {
        res.json(await service.bulkDelete(req.body.ids));
      } catch (err) {
        sendError(res, err);
      }
    },
    async getLead(req, res) {
      try {
        res.json(await service.getLead(req.params.id));
      } catch (err) {
        sendError(res, err);
      }
    },
    async createLead(req, res) {
      try {
        res.status(201).json(await service.createLead(req.body, req.user));
      } catch (err) {
        sendError(res, err);
      }
    },
    async updateStage(req, res) {
      try {
        res.json(await service.updateStage(req.params.id, req.body, req.user));
      } catch (err) {
        sendError(res, err);
      }
    },
    async assignLead(req, res) {
      try {
        res.json(await service.assignLead(req.params.id, req.body, req.user));
      } catch (err) {
        sendError(res, err);
      }
    },
    async addNote(req, res) {
      try {
        res.json(await service.addNote(req.params.id, req.body, req.files, req.user));
      } catch (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ message: 'Image too large' });
        }
        sendError(res, err);
      }
    },
    async deleteNote(req, res) {
      try {
        res.json(await service.deleteNote(req.params.id, req.params.noteId, req.user));
      } catch (err) {
        sendError(res, err);
      }
    },
    async updateLead(req, res) {
      try {
        res.json(await service.updateLead(req.params.id, req.body));
      } catch (err) {
        sendError(res, err);
      }
    },
    async deleteLead(req, res) {
      try {
        res.json(await service.deleteLead(req.params.id));
      } catch (err) {
        sendError(res, err);
      }
    },
  };
}

module.exports = { createLeadsController };
