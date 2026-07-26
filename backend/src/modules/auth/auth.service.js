const { httpError } = require('../../shared/utils/sendError');

function createAuthService({ User, token }) {
  async function login(email, password) {
    if (!email || !password) {
      throw httpError(400, 'Email and password required');
    }

    const user = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { name: { $regex: new RegExp(`^${email}$`, 'i') } },
      ],
    });

    if (!user || !(await user.matchPassword(password))) {
      throw httpError(401, 'Invalid credentials');
    }
    if (!user.isActive) {
      throw httpError(401, 'Account deactivated');
    }

    return token.tokenPayloadForUser(user);
  }

  async function getMe(userId) {
    const user = await User.findById(userId).select('-password');
    if (!user || !user.isActive) {
      throw httpError(401, 'Not authorized');
    }
    return token.tokenPayloadForUser(user);
  }

  async function refresh(userId) {
    return getMe(userId);
  }

  return { login, getMe, refresh };
}

module.exports = { createAuthService };
