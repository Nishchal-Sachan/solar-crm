const { sendError } = require('../../shared/utils/sendError');

function createStockController({ service }) {
  return {
    async listPublicItems(req, res) {
      try {
        res.json(await service.listPublicItems());
      } catch (err) {
        sendError(res, err, 'Could not load public stock items.');
      }
    },
    async uploadImage(req, res) {
      try {
        res.json(await service.uploadImage(req.file));
      } catch (err) {
        sendError(res, err, 'Could not upload image.');
      }
    },
    async listItems(req, res) {
      try {
        res.json(await service.listItems(req.user, req.query));
      } catch (err) {
        sendError(res, err, 'Could not load stock items.');
      }
    },
    async createItem(req, res) {
      try {
        const { item, created } = await service.createItem(req.body);
        res.status(created ? 201 : 200).json(item);
      } catch (err) {
        sendError(res, err, 'Could not save stock item.');
      }
    },
    async updateItem(req, res) {
      try {
        res.json(await service.updateItem(req.params.id, req.body));
      } catch (err) {
        sendError(res, err, 'Could not update stock item.');
      }
    },
    async deactivateItem(req, res) {
      try {
        res.json(await service.deactivateItem(req.params.id));
      } catch (err) {
        sendError(res, err, 'Could not deactivate stock item.');
      }
    },
    async listVouchers(req, res) {
      try {
        res.json(await service.listVouchers(req.user, req.query));
      } catch (err) {
        sendError(res, err, 'Could not load vouchers.');
      }
    },
    async getVoucher(req, res) {
      try {
        res.json(await service.getVoucher(req.params.id));
      } catch (err) {
        sendError(res, err, 'Could not load voucher details.');
      }
    },
    async deleteVoucher(req, res) {
      try {
        res.json(await service.deleteVoucher(req.params.id));
      } catch (err) {
        sendError(res, err, 'Could not delete voucher.');
      }
    },
    async createVoucher(req, res) {
      try {
        res.status(201).json(await service.createVoucher(req.body, req.user));
      } catch (err) {
        sendError(res, err, 'Could not create voucher.');
      }
    },
  };
}

module.exports = { createStockController };
