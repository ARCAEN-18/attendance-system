const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g. CSE-A
  department: { type: String, default: '' },
  year: { type: String, default: '' } // e.g. 2nd Year
}, { timestamps: true });

module.exports = mongoose.model('Class', ClassSchema);
