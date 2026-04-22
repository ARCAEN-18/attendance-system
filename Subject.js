const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  teacherId: { type: String, required: true },
  class: { type: String, required: true }
}, { timestamps: true });

// Ensure course code is unique per class
subjectSchema.index({ code: 1 }, { unique: true });

const Subject = mongoose.model('Subject', SubjectSchema);

// Automatically drop the globally unique index if it exists from previous code
mongoose.connection.on('connected', () => {
  Subject.collection.dropIndex('code_1').catch(() => {});
});

module.exports = Subject;
