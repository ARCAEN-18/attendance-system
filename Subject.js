const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  teacherId: { type: String, required: true },
  class: { type: String, required: true }
}, { timestamps: true });

// ✅ GLOBAL unique code
SubjectSchema.index({ code: 1 }, { unique: true });

module.exports = mongoose.model('Subject', SubjectSchema);
