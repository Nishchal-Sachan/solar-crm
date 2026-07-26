const { sendError } = require('../../shared/utils/sendError');

function createAuthController({ service }) {
  async function login(req, res) {
    try {
      const result = await service.login(req.body.email, req.body.password);
      res.json(result);
    } catch (err) {
      sendError(res, err, 'Login failed. Please try again.');
    }
  }

  async function me(req, res) {
    try {
      const result = await service.getMe(req.user._id);
      res.json(result);
    } catch (err) {
      sendError(res, err, 'Could not load your profile.');
    }
  }

  async function refresh(req, res) {
    try {
      const result = await service.refresh(req.user._id);
      res.json(result);
    } catch (err) {
      sendError(res, err, 'Could not refresh session.');
    }
  }

  return { login, me, refresh };
}

module.exports = { createAuthController };
