const express = require('express');
const router = express.Router();
const auth = require('./authMiddleware');
const Announcement = require('./Announcement');
const User = require('./User');

// POST - Create announcement (teacher only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Only teachers can post announcements' });

    const { title, message, targetClass, isPublic, priority } = req.body;

    let classes = [targetClass];
    if (isPublic) {
      const teacher = await User.findById(req.user.id);
      classes = teacher.classes;
    }

    const announcement = new Announcement({
      title,
      message,
      targetClass: classes,
      isPublic: !!isPublic,
      priority: priority || 'normal',
      teacherId: req.user.id,
      teacherName: req.user.name
    });

    await announcement.save();
    res.json({ message: 'Announcement posted', announcement });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET - Teacher's own announcements
// ⚠️ This must come BEFORE /:className to avoid conflict
router.get('/teacher/mine', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Forbidden' });
    const announcements = await Announcement.find({ teacherId: req.user.id }).sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET - Announcements for a class (student view)
router.get('/:className', auth, async (req, res) => {
  try {
    const announcements = await Announcement.find({
      targetClass: req.params.className
    }).sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE - Delete announcement by ID
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Forbidden' });
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted ✅' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
