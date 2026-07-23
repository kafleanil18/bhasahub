const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    action: { type: String, required: true }, // create | update | delete | approve | deny | grant | revoke | role-change
    resourceType: { type: String, required: true }, // course | lesson | test | user | subscription | access-request | team-member | testimonial | pinyin-table
    resourceId: { type: String, default: '' },
    label: { type: String, default: '' }, // human-readable summary, e.g. the course title
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
