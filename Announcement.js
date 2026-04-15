const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  targetClass: [String],
  isPublic: { type: Boolean, default: false },
  priority: { type: String, default: 'normal' },
  teacherId: { type: String, required: true },
  teacherName: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Announcement', AnnouncementSchema);