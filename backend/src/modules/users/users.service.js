const { httpError } = require('../../shared/utils/sendError');

function createUsersService({ User, dashCache, token, pagination }) {
  async function listAssignees() {
    return User.find({ isActive: true })
      .select('name role')
      .sort({ name: 1 })
      .lean();
  }

  async function listComplaintHandlers() {
    return User.find({ isActive: true, handlesComplaints: true })
      .select('name email role phone')
      .sort({ name: 1 })
      .lean();
  }

  async function listTeam() {
    return User.find({ isActive: true })
      .select('name email role phone points')
      .sort({ name: 1 })
      .lean();
  }

  async function listUsers(query) {
    const { page, limit, skip } = pagination.parsePagination(query);
    const filter = {};
    const search = (query.search || '').trim();
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    return { users, pagination: pagination.paginationMeta(page, limit, total) };
  }

  async function resetAllPoints(currentUserId) {
    await User.updateMany({}, { $set: { points: 0 } });
    dashCache.invalidateCrm();
    const me = await User.findById(currentUserId).select('-password');
    return {
      message: 'All reward points reset to 0',
      ...(me ? token.tokenPayloadForUser(me) : {}),
    };
  }

  async function resetUserPoints(id, currentUserId) {
    const user = await User.findByIdAndUpdate(id, { points: 0 }, { new: true }).select('-password');
    if (!user) throw httpError(404, 'User not found');
    dashCache.invalidateCrm();
    const payload = String(user._id) === String(currentUserId) ? token.tokenPayloadForUser(user) : {};
    return { ...user.toObject(), ...payload };
  }

  async function createUser(body) {
    const { name, email, password, role, phone, handlesComplaints } = body;
    const exists = await User.findOne({ email });
    if (exists) throw httpError(400, 'Email already registered');

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user',
      phone,
      handlesComplaints: Boolean(handlesComplaints),
    });
    dashCache.invalidateAdmin();
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      handlesComplaints: user.handlesComplaints,
    };
  }

  async function updateUser(id, body, currentUserId) {
    const { name, email, role, phone, isActive, password, handlesComplaints } = body;
    const user = await User.findById(id);
    if (!user) throw httpError(404, 'User not found');

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (phone !== undefined) user.phone = phone;
    if (isActive !== undefined) user.isActive = isActive;
    if (handlesComplaints !== undefined) user.handlesComplaints = Boolean(handlesComplaints);
    if (password) user.password = password;

    await user.save();
    dashCache.invalidateAdmin();

    const json = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      isActive: user.isActive,
      handlesComplaints: user.handlesComplaints,
    };
    if (String(user._id) === String(currentUserId)) {
      Object.assign(json, token.tokenPayloadForUser(user));
    }
    return json;
  }

  async function deleteUser(id) {
    await User.findByIdAndDelete(id);
    dashCache.invalidateAdmin();
    return { message: 'User deleted' };
  }

  return {
    listAssignees,
    listComplaintHandlers,
    listTeam,
    listUsers,
    resetAllPoints,
    resetUserPoints,
    createUser,
    updateUser,
    deleteUser,
  };
}

module.exports = { createUsersService };
