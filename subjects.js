const express = require('express');
const router = express.Router();
const auth = require('./authMiddleware');
const Subject = require('./Subject');
const User = require('./User');
const multer = require('multer');
const xlsx = require('xlsx');
const bcrypt = require('bcryptjs');
const upload = multer({ dest: 'uploads/' });

// ─────────────────────────────────────────────────────────────
// IMPORTANT: specific routes MUST come before param routes
// ─────────────────────────────────────────────────────────────

// GET - Teacher's own subjects
router.get('/teacher/mine', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Forbidden' });
    const subjects = await Subject.find({ teacherId: req.user.collegeId });
    res.json(subjects);
  } catch (err) {
    console.error('teacher/mine error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET - Subjects by class (student uses this)
// FIX: returns full subject docs with _id so student.html can use subject._id
router.get('/class/:className', auth, async (req, res) => {
  try {
    const subjects = await Subject.find({ class: req.params.className });
    res.json(subjects); // _id is included by default in Mongoose
  } catch (err) {
    console.error('class subjects error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST - Upload students via Excel/CSV (teacher)
router.post('/upload-students', auth, upload.single('file'), async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Forbidden' });
    const className = req.body.className;
    if (!className) return res.status(400).json({ error: 'Class name required' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    let added = 0, skipped = 0;
    const defaultPassword = await bcrypt.hash('password', 10);

    for (const row of rows) {
      if (!row[0] || !row[1]) continue;
      const rollNo = String(row[0]).trim();
      const name   = String(row[1]).trim();
      if (!rollNo || !name || rollNo.toLowerCase() === 'roll' || rollNo.toLowerCase() === 'roll no') continue;

      const collegeId = `${className}-${rollNo}`;
      const exists = await User.findOne({ collegeId });
      if (exists) { skipped++; continue; }

      await new User({
        name,
        email: `${collegeId.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.college.edu`,
        password: defaultPassword,
        role: 'student',
        collegeId,
        class: className,
        rollNo,
        department: ''
      }).save();
      added++;
    }

    res.json({ message: `Upload complete: ${added} added, ${skipped} skipped (already exist). Default password: "password"` });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed: ' + err.message });
  }
});

// POST - Add single student manually (teacher)
router.post('/add-student-manual', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Forbidden' });
    const { name, rollNo, className } = req.body;
    
    if (!name || !rollNo || !className) {
      return res.status(400).json({ error: 'Name, Roll No, and Class are required' });
    }

    const collegeId = `${className}-${rollNo}`;
    const exists = await User.findOne({ collegeId });
    if (exists) {
      return res.status(400).json({ error: `Student with Roll No "${rollNo}" already exists in class "${className}"` });
    }

    const defaultPassword = await bcrypt.hash('password', 10);

    await new User({
      name: name.trim(),
      email: `${collegeId.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.college.edu`,
      password: defaultPassword,
      role: 'student',
      collegeId,
      class: className,
      rollNo,
      department: ''
    }).save();

    res.json({ message: `Student "${name}" added successfully to ${className}. Default password: "password"` });
  } catch (err) {
    console.error('Manual student add error:', err);
    res.status(500).json({ error: 'Failed to add student: ' + err.message });
  }
});

// GET - All subjects (admin)
router.get('/', auth, async (req, res) => {
  try {
    const subjects = await Subject.find();
    res.json(subjects);
  } catch (err) {
    console.error('all subjects error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
