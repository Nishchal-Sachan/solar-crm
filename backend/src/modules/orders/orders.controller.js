const { sendError } = require('../../shared/utils/sendError');

function createOrdersController({ service }) {
  return {
    async createPublic(req, res) {
      try {
        res.status(201).json(await service.createPublic(req.body));
      } catch (err) {
        sendError(res, err, 'Could not create order inquiry.');
      }
    },
    async listOrders(req, res) {
      try {
        res.json(await service.listOrders(req.user, req.query));
      } catch (err) {
        sendError(res, err, 'Could not load orders.');
      }
    },
    async getOrder(req, res) {
      try {
        res.json(await service.getOrder(req.params.id, req.user));
      } catch (err) {
        sendError(res, err);
      }
    },
    async updateOrder(req, res) {
      try {
        res.json(await service.updateOrder(req.params.id, req.user, req.body));
      } catch (err) {
        sendError(res, err);
      }
    },
    async deleteOrder(req, res) {
      try {
        res.json(await service.deleteOrder(req.params.id, req.user));
      } catch (err) {
        sendError(res, err);
      }
    },
  };
}

module.exports = { createOrdersController };
