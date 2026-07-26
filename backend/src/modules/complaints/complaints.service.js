const { httpError } = require('../../shared/utils/sendError');
const { COMPLAINT_CATEGORIES } = require('../../shared/constants/complaintCategories');

function createComplaintsService({ Complaint, User, auth, mail, pagination }) {
  function buildFilter(user, query) {
    const filter = {};
    if (!auth.canManageAllComplaints(user)) {
      filter.assignedTo = user._id;
    }
    if (query.status) filter.status = query.status;
    if (query.assignedTo && auth.canManageAllComplaints(user)) {
      filter.assignedTo = query.assignedTo;
    }
    const search = (query.search || '').trim();
    if (search) {
      filter.$or = [
        { complaintNumber: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    return filter;
  }

  function accessFilter(id, user) {
    const filter = { _id: id };
    if (!auth.canManageAllComplaints(user)) {
      filter.assignedTo = user._id;
    }
    return filter;
  }

  function getCategories() {
    return { categories: COMPLAINT_CATEGORIES };
  }

  async function registerPublic(body) {
    const { category, name, phone, email, address, description } = body;

    if (!category || !name || !phone || !email || !address) {
      throw httpError(400, 'Name, phone, email, address and issue category are required');
    }
    if (!COMPLAINT_CATEGORIES.includes(category)) {
      throw httpError(400, 'Invalid issue category');
    }

    const complaint = await Complaint.create({
      category,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      address: address.trim(),
      description: (description || '').trim(),
    });

    let emailResult = { sent: false };
    try {
      emailResult = await mail.sendComplaintConfirmation(complaint.toObject());
    } catch (mailErr) {
      console.error('Complaint confirmation email failed:', mailErr.message);
    }

    return {
      message: 'Complaint registered successfully',
      complaint: {
        complaintNumber: complaint.complaintNumber,
        category: complaint.category,
        status: complaint.status,
        createdAt: complaint.createdAt,
      },
      emailSent: emailResult.sent,
    };
  }

  async function listComplaints(user, query) {
    const { page, limit, skip } = pagination.parsePagination(query, 20, 100);
    const filter = buildFilter(user, query);

    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .populate('assignedTo', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Complaint.countDocuments(filter),
    ]);

    return { complaints, pagination: pagination.paginationMeta(page, limit, total) };
  }

  async function getComplaint(id, user) {
    const complaint = await Complaint.findOne(accessFilter(id, user))
      .populate('assignedTo', 'name email phone');
    if (!complaint) throw httpError(404, 'Complaint not found');
    return complaint;
  }

  async function updateComplaint(id, user, body) {
    const complaint = await Complaint.findOne(accessFilter(id, user));
    if (!complaint) throw httpError(404, 'Complaint not found');

    const { status, internalNote, assignedTo } = body;
    const { COMPLAINT_STATUSES } = require('../../models/Complaint');

    if (status) {
      if (!COMPLAINT_STATUSES.includes(status)) {
        throw httpError(400, 'Invalid status');
      }
      complaint.status = status;
    }
    if (internalNote !== undefined) complaint.internalNote = internalNote;

    if (assignedTo !== undefined && auth.isAdmin(user)) {
      const handler = await User.findOne({
        _id: assignedTo,
        isActive: true,
        handlesComplaints: true,
      });
      if (!handler) {
        throw httpError(400, 'Assignee must be an active employee with complaint access enabled');
      }
      complaint.assignedTo = handler._id;
    }

    await complaint.save();
    await complaint.populate('assignedTo', 'name email phone');
    return complaint;
  }

  return {
    getCategories,
    registerPublic,
    listComplaints,
    getComplaint,
    updateComplaint,
  };
}

module.exports = { createComplaintsService };
