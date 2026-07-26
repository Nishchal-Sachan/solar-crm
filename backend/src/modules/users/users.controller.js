const { sendError } = require('../../shared/utils/sendError');

function createUsersController({ service }) {
  return {
    async listAssignees(req, res) {
      try {
        res.json(await service.listAssignees());
      } catch (err) {
        sendError(res, err);
      }
    },
    async listComplaintHandlers(req, res) {
      try {
        res.json(await service.listComplaintHandlers());
      } catch (err) {
        sendError(res, err);
      }
    },
    async listTeam(req, res) {
      try {
        res.json(await service.listTeam());
      } catch (err) {
        sendError(res, err);
      }
    },
    async listUsers(req, res) {
      try {
        res.json(await service.listUsers(req.query));
      } catch (err) {
        sendError(res, err);
      }
    },
    async resetAllPoints(req, res) {
      try {
        res.json(await service.resetAllPoints(req.user._id));
      } catch (err) {
        sendError(res, err);
      }
    },
    async resetUserPoints(req, res) {
      try {
        res.json(await service.resetUserPoints(req.params.id, req.user._id));
      } catch (err) {
        sendError(res, err);
      }
    },
    async createUser(req, res) {
      try {
        res.status(201).json(await service.createUser(req.body));
      } catch (err) {
        sendError(res, err);
      }
    },
    async updateUser(req, res) {
      try {
        res.json(await service.updateUser(req.params.id, req.body, req.user._id));
      } catch (err) {
        sendError(res, err);
      }
    },
    async deleteUser(req, res) {
      try {
        res.json(await service.deleteUser(req.params.id));
      } catch (err) {
        sendError(res, err);
      }
    },
  };
}

module.exports = { createUsersController };
