const express = require('express');
const router = express.Router();
const auth = require('./authMiddleware');
const Attendance = require('./Attendance');
const User = require('./User');

// ─────────────────────────────────────────────────────────────
// Specific routes MUST come before /:param routes
// ─────────────────────────────────────────────────────────────

// GET - Attendance for a specific student in a specific subject
router.get('/student-subject/:studentId/:subjectId', auth, async (req, res) => {
  try {
    const records = await Attendance.find({
      studentId: req.params.studentId,
      subjectId: req.params.subjectId
    });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET - Students by class (teacher uses this to load student list)
router.get('/students/:className', auth, async (req, res) => {
  try {
    const students = await User.find({ role: 'student', class: req.params.className }).sort({ rollNo: 1 });
    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST - Mark single student attendance
router.post('/mark', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Only teachers can mark attendance' });
    const { subjectId, studentId, date, status } = req.body;
    if (!subjectId || !studentId || !date || !status) {
      return res.status(400).json({ error: 'subjectId, studentId, date and status are required' });
    }
    await Attendance.findOneAndUpdate(
      { subjectId, studentId, date },
      { $set: { status, markedBy: req.user.id } },
      { upsert: true, new: true }
    );
    res.json({ message: 'Attendance saved ✅' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET - Attendance for logged in student
router.get('/my', auth, async (req, res) => {
  try {
    const records = await Attendance.find({ studentId: req.user.id.toString() });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET - Attendance for a specific student
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    const records = await Attendance.find({ studentId: req.params.studentId });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET - All attendance for a subject (optionally filtered by date)
router.get('/subject/:subjectId', auth, async (req, res) => {
  try {
    const { date } = req.query;
    const filter = { subjectId: req.params.subjectId };
    if (date) filter.date = date;
    const records = await Attendance.find(filter);
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT - Edit attendance record
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Only teachers can edit attendance' });
    const { status } = req.body;
    const updated = await Attendance.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!updated) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Attendance updated ✅', record: updated });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE - Delete attendance record
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Only teachers can delete attendance' });
    await Attendance.findByIdAndDelete(req.params.id);
    res.json({ message: 'Attendance deleted ✅' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
