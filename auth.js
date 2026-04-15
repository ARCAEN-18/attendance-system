const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./User');
const Class = require('./Class');

const JWT_SECRET = process.env.JWT_SECRET || 'attendance_secret_key_2024';
const ADMIN_ID = process.env.ADMIN_ID || 'ADMIN001';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin@123';

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { collegeId, password, role } = req.body;

    if (role === 'admin') {
      if (collegeId !== ADMIN_ID) return res.status(404).json({ error: 'Admin not found' });
      if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Incorrect password' });
      const token = jwt.sign({ id: 'admin', name: 'Admin', role: 'admin', collegeId: ADMIN_ID }, JWT_SECRET, { expiresIn: '24h' });
      return res.json({ token, user: { name: 'Admin', role: 'admin', collegeId: ADMIN_ID } });
    }

    const user = await User.findOne({ collegeId, role });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Teacher registered but no password set yet
    if (!user.password) return res.status(401).json({ error: 'Please register first to set your password.' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Incorrect password' });

    const token = jwt.sign({ id: user._id, name: user.name, role: user.role, collegeId: user.collegeId }, JWT_SECRET, { expiresIn: '24h' });
    const { password: _, ...userInfo } = user.toObject();
    res.json({ token, user: userInfo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// REGISTER STUDENT - class must exist
router.post('/register', async (req, res) => {
  try {
    const { name, email, collegeId, password, role, className, rollNo, department } = req.body;

    if (role === 'admin') return res.status(403).json({ error: 'Cannot register as admin.' });

    // Teacher registration — college ID + email must match what admin entered
    if (role === 'teacher') {
      const teacher = await User.findOne({ collegeId, role: 'teacher' });
      if (!teacher) return res.status(404).json({ error: 'Teacher not found. Check your College ID.' });
      if (teacher.email.toLowerCase() !== email.toLowerCase()) return res.status(403).json({ error: 'Email does not match our records. Contact admin.' });
      if (teacher.password) return res.status(400).json({ error: 'Account already registered. Please login.' });
      teacher.password = await bcrypt.hash(password, 10);
      await teacher.save();
      return res.json({ message: 'Teacher account activated! Please login.' });
    }

    // Student registration — class must exist
    if (!className) return res.status(400).json({ error: 'Class is required' });
    const classExists = await Class.findOne({ name: className });
    if (!classExists) return res.status(400).json({ error: `Class "${className}" does not exist. Contact your administrator.` });

    const existing = await User.findOne({ collegeId });
    if (existing) return res.status(400).json({ error: 'College ID already registered' });

    const newUser = new User({
      name, email, collegeId,
      password: await bcrypt.hash(password, 10),
      role: 'student',
      department: department || '',
      class: className,
      rollNo
    });
    await newUser.save();
    res.json({ message: 'Account created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
