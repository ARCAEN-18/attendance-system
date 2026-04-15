const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },

  password: { 
    type: String, 
    required: false 
  },

  role: { 
    type: String, 
    enum: ['teacher', 'student'], 
    required: true 
  },

  collegeId: { 
    type: String, 
    required: true, 
    unique: true 
  },

  department: { type: String, default: '' },

  isVerified: { 
    type: Boolean, 
    default: false 
  },

  // teacher fields
  classes: [String],

  // student fields
  class: { type: String },
  rollNo: { type: String }

}, { timestamps: true });
module.exports = mongoose.model('User', UserSchema);
