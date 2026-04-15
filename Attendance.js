const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  subjectId: { type: String, required: true },
  studentId: { type: String, required: true },
  date: { type: String, required: true },
  status: { type: String, enum: ['present', 'absent'], required: true },
  markedBy: { type: String, required: true }
}, { timestamps: true });

// Prevent duplicate attendance records for the same student/subject/date
AttendanceSchema.index({ subjectId: 1, studentId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
