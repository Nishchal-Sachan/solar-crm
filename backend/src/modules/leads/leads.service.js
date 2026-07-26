const { httpError } = require('../../shared/utils/sendError');
const { buildLeadFilter } = require('../../shared/utils/leads');

function calcPoints(stageSinceDate) {
  const now = new Date();
  const since = new Date(stageSinceDate);
  const daysElapsed = Math.floor((now - since) / (1000 * 60 * 60 * 24));
  return 5 - daysElapsed;
}

const LEAD_LIST_FIELDS = [
  { path: 'assignedTo', select: 'name email points' },
  { path: 'createdBy', select: 'name email' },
];

const LEAD_DETAIL_FIELDS = [
  ...LEAD_LIST_FIELDS,
  { path: 'stageHistory.assignedTo', select: 'name email' },
  { path: 'stageHistory.movedBy', select: 'name email' },
  { path: 'notes.addedBy', select: 'name email' },
];

function createLeadsService({ Lead, User, dashCache, token, uploadHelpers }) {
  async function createPublic(body) {
    const { name, phone, email, address, city, requirements, systemSize, source } = body;
    if (!name || !phone) {
      throw httpError(400, 'Name and phone number are required');
    }

    const admin = await User.findOne({ role: 'admin', isActive: true });
    if (!admin) {
      throw httpError(500, 'No active admin found in the system');
    }

    const lead = await Lead.create({
      name, phone, email, address, city, requirements, systemSize,
      source: source || 'Quotation Generator',
      assignedTo: admin._id,
      createdBy: admin._id,
      stageHistory: [{
        stage: 'Lead',
        assignedTo: admin._id,
        movedBy: admin._id,
        note: `Lead created from ${source || 'Quotation Generator'}`,
        date: new Date(),
      }],
    });

    dashCache.invalidateCrm();
    dashCache.invalidateAdmin();
    return lead;
  }

  async function listLeads(user, query) {
    const filter = buildLeadFilter(user, query);
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [leads, total] = await Promise.all([
      Lead.find(filter)
        .populate(LEAD_LIST_FIELDS)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      Lead.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    return {
      leads,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  function getStages() {
    return Lead.STAGES;
  }

  async function getStats(user, query) {
    const filter = buildLeadFilter(user, query);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const aggRows = await Lead.aggregate([
      { $match: filter },
      {
        $facet: {
          summary: [{
            $group: {
              _id: null,
              total: { $sum: 1 },
              commissioned: { $sum: { $cond: [{ $eq: ['$stage', 'Commission'] }, 1, 0] } },
              inProgress: {
                $sum: {
                  $cond: [{
                    $and: [
                      { $ne: ['$stage', 'Lead'] },
                      { $ne: ['$stage', 'Commission'] },
                    ],
                  }, 1, 0],
                },
              },
              newToday: { $sum: { $cond: [{ $gte: ['$createdAt', todayStart] }, 1, 0] } },
            },
          }],
          stageCounts: [{ $group: { _id: '$stage', count: { $sum: 1 } } }],
        },
      },
    ]);

    const facet = aggRows[0] || { summary: [], stageCounts: [] };
    const summary = facet.summary[0] || {
      total: 0, commissioned: 0, inProgress: 0, newToday: 0,
    };
    const stageCounts = Object.fromEntries(Lead.STAGES.map((s) => [s, 0]));
    facet.stageCounts.forEach(({ _id, count }) => {
      if (_id && stageCounts[_id] !== undefined) stageCounts[_id] = count;
    });

    const recent = await Lead.find(filter)
      .populate(LEAD_LIST_FIELDS)
      .sort({ updatedAt: -1 })
      .limit(8);

    return {
      total: summary.total,
      stageCounts,
      commissioned: summary.commissioned,
      inProgress: summary.inProgress,
      newToday: summary.newToday,
      recent,
    };
  }

  async function getLeaderboard() {
    return User.find({ isActive: true }).select('name email role points').sort({ points: -1 });
  }

  async function bulkDelete(ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw httpError(400, 'ids array is required');
    }
    if (ids.length > 100) {
      throw httpError(400, 'Maximum 100 leads can be deleted at once');
    }

    const result = await Lead.deleteMany({ _id: { $in: ids } });
    dashCache.invalidateCrm();
    dashCache.invalidateAdmin();
    return {
      message: `${result.deletedCount} lead(s) deleted`,
      deletedCount: result.deletedCount,
    };
  }

  async function getLead(id) {
    const lead = await Lead.findById(id).populate(LEAD_DETAIL_FIELDS);
    if (!lead) throw httpError(404, 'Lead not found');
    return lead;
  }

  async function createLead(body, user) {
    const { name, phone, email, address, city, requirements, systemSize, source, assignedTo } = body;
    const lead = await Lead.create({
      name, phone, email, address, city, requirements, systemSize, source,
      assignedTo: assignedTo || user._id,
      createdBy: user._id,
      stageHistory: [{
        stage: 'Lead',
        assignedTo: assignedTo || user._id,
        movedBy: user._id,
        note: 'Lead created',
        date: new Date(),
      }],
    });
    await lead.populate(LEAD_LIST_FIELDS);
    dashCache.invalidateCrm();
    dashCache.invalidateAdmin();
    return lead;
  }

  async function updateStage(id, body, user) {
    const { stage, assignedTo, note } = body;
    const lead = await Lead.findById(id);
    if (!lead) throw httpError(404, 'Lead not found');

    const isStageChange = lead.stage !== stage;
    let tokenExtras = {};

    if (isStageChange) {
      const lastEntry = lead.stageHistory.length > 0
        ? lead.stageHistory[lead.stageHistory.length - 1]
        : null;
      const stageSince = lastEntry?.date || lead.createdAt;

      const recipientId = (lead.assignedTo || '').toString();
      if (recipientId) {
        const earned = calcPoints(stageSince);
        const updatedUser = await User.findByIdAndUpdate(
          recipientId,
          { $inc: { points: earned } },
          { new: true },
        ).select('-password');
        if (updatedUser && String(updatedUser._id) === String(user._id)) {
          tokenExtras = token.tokenPayloadForUser(updatedUser);
        }
      }
    }

    lead.stage = stage;
    if (assignedTo) lead.assignedTo = assignedTo;

    lead.stageHistory.push({
      stage,
      assignedTo: assignedTo || lead.assignedTo,
      movedBy: user._id,
      note: note || `Moved to ${stage}`,
      date: new Date(),
    });

    await lead.save();
    await lead.populate(LEAD_LIST_FIELDS);
    dashCache.invalidateCrm();
    return { ...lead.toObject(), ...tokenExtras };
  }

  async function assignLead(id, body, user) {
    const { assignedTo, note } = body;
    const lead = await Lead.findById(id);
    if (!lead) throw httpError(404, 'Lead not found');

    lead.assignedTo = assignedTo;
    lead.stageHistory.push({
      stage: lead.stage,
      assignedTo,
      movedBy: user._id,
      note: note || 'Lead reassigned',
      date: new Date(),
    });

    await lead.save();
    await lead.populate([{ path: 'assignedTo', select: 'name email points' }]);
    dashCache.invalidateCrm();
    return lead;
  }

  async function addNote(id, body, files, user) {
    let uploaded = [];
    try {
      const lead = await Lead.findById(id);
      if (!lead) throw httpError(404, 'Lead not found');

      const text = (body.text || '').trim();
      if (!text && (!files || files.length === 0)) {
        throw httpError(400, 'Note must include text or at least one image');
      }

      if (files && files.length > 0) {
        uploaded = await uploadHelpers.uploadMany(files, { folder: `solarji/leads/${lead._id}` });
      }

      lead.notes.push({
        text,
        images: uploaded,
        addedBy: user._id,
        date: new Date(),
      });
      await lead.save();
      await lead.populate('notes.addedBy', 'name email');
      return lead.notes;
    } catch (err) {
      if (uploaded.length) {
        await uploadHelpers.destroyMany(uploaded.map((u) => u.publicId));
      }
      throw err;
    }
  }

  async function deleteNote(id, noteId, user) {
    const lead = await Lead.findById(id);
    if (!lead) throw httpError(404, 'Lead not found');

    const note = lead.notes.id(noteId);
    if (!note) throw httpError(404, 'Note not found');

    if (user.role !== 'admin' && String(note.addedBy) !== String(user._id)) {
      throw httpError(403, 'Not allowed to delete this note');
    }

    const publicIds = (note.images || []).map((img) => img.publicId).filter(Boolean);
    note.deleteOne();
    await lead.save();
    await uploadHelpers.destroyMany(publicIds);

    return { message: 'Note deleted' };
  }

  async function updateLead(id, body) {
    return Lead.findByIdAndUpdate(id, body, { new: true }).populate(LEAD_LIST_FIELDS);
  }

  async function deleteLead(id) {
    await Lead.findByIdAndDelete(id);
    dashCache.invalidateCrm();
    dashCache.invalidateAdmin();
    return { message: 'Lead deleted' };
  }

  return {
    createPublic,
    listLeads,
    getStages,
    getStats,
    getLeaderboard,
    bulkDelete,
    getLead,
    createLead,
    updateStage,
    assignLead,
    addNote,
    deleteNote,
    updateLead,
    deleteLead,
  };
}

module.exports = { createLeadsService };
