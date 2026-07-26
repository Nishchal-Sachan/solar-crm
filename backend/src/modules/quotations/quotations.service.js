function createQuotationsService({ QuotationTemplate }) {
  async function listTemplates() {
    return QuotationTemplate.find({ isActive: true }).populate('createdBy', 'name');
  }

  async function createTemplate(body, userId) {
    return QuotationTemplate.create({ ...body, createdBy: userId });
  }

  async function updateTemplate(id, body) {
    return QuotationTemplate.findByIdAndUpdate(id, body, { new: true });
  }

  async function deleteTemplate(id) {
    await QuotationTemplate.findByIdAndUpdate(id, { isActive: false });
    return { message: 'Template deleted' };
  }

  return { listTemplates, createTemplate, updateTemplate, deleteTemplate };
}

module.exports = { createQuotationsService };
