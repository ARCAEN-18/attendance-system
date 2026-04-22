const express = require('express');
const router = express.Router();
const User = require('./User');
const Subject = require('./Subject');
const Class = require('./Class');
const authMiddleware = require('./authMiddleware');

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access only' });
  next();
};

// ── CLASSES ──
router.get('/classes', authMiddleware, adminOnly, async (req, res) => {
  try {
    res.json(await Class.find().sort({ name: 1 }));
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/classes', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, department, year } = req.body;
    if (!name) return res.status(400).json({ error: 'Class name required' });

    if (await Class.findOne({ name })) {
      return res.status(400).json({ error: `Class "${name}" already exists` });
    }

    const newClass = await new Class({ name, department, year }).save();
    res.json({ message: 'Class added', class: newClass });

  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/classes/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await Class.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── TEACHERS ──
router.get('/teachers', authMiddleware, adminOnly, async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' }).lean();
    res.json(teachers.map(t => {
      const { password, ...rest } = t;
      return { ...rest, isRegistered: !!password };
    }));
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/teachers', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, email, collegeId, department } = req.body;

    if (!name || !email || !collegeId) {
      return res.status(400).json({ error: 'Name, email and College ID required' });
    }

    if (await User.findOne({ collegeId })) {
      return res.status(400).json({ error: 'College ID already exists' });
    }

    const teacher = await new User({
      name,
      email,
      collegeId,
      password: '',
      role: 'teacher',
      department: department || '',
      classes: []
    }).save();

    res.json({ message: 'Teacher added', teacher });

  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/teachers/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, email, department, classes } = req.body;

    if (classes && classes.length > 0) {
      const existingClasses = await Class.find({ name: { $in: classes } });
      const existingNames = existingClasses.map(c => c.name);

      const invalid = classes.filter(c => !existingNames.includes(c));
      if (invalid.length > 0) {
        return res.status(400).json({
          error: `These classes don't exist: ${invalid.join(', ')}`
        });
      }
    }

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, department, classes },
      { returnDocument: 'after' }
    ).select('-password');

    res.json({ message: 'Teacher updated', teacher: updated });

  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/teachers/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── SUBJECTS ──
router.get('/subjects', authMiddleware, adminOnly, async (req, res) => {
  try {
    res.json(await Subject.find().sort({ code: 1 }));
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/subjects', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, code, teacherId, class: cls } = req.body;

    if (!name || !code || !teacherId || !cls) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const upperCode = code.trim().toUpperCase();

    // check class
    if (!await Class.findOne({ name: cls })) {
      return res.status(400).json({ error: `Class "${cls}" does not exist` });
    }

    // check teacher
    const teacher = await User.findOne({ collegeId: teacherId, role: 'teacher' });
    if (!teacher) {
      return res.status(400).json({ error: `Teacher "${teacherId}" not found` });
    }

    // GLOBAL uniqueness
    const existing = await Subject.findOne({ code: upperCode });
    if (existing) {
      return res.status(400).json({ error: `Course code "${upperCode}" already exists` });
    }

    const subject = await new Subject({
      name,
      code: upperCode,
      teacherId,
      class: cls
    }).save();

    await User.findByIdAndUpdate(teacher._id, {
      $addToSet: { classes: cls }
    });

    res.json({ message: 'Subject assigned', subject });

  } catch (e) {
    console.error(e);

    if (e.code === 11000) {
      return res.status(400).json({ error: 'Course code already exists' });
    }

    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/subjects/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { teacherId } = req.body;

    const teacher = await User.findOne({ collegeId: teacherId, role: 'teacher' });
    if (!teacher) {
      return res.status(400).json({ error: `Teacher "${teacherId}" not found` });
    }

    const updated = await Subject.findByIdAndUpdate(
      req.params.id,
      { teacherId },
      { returnDocument: 'after' }
    );

    res.json({ message: 'Subject updated', subject: updated });

  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/subjects/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await Subject.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── STUDENTS ──
router.get('/students', authMiddleware, adminOnly, async (req, res) => {
  try {
    res.json(await User.find({ role: 'student' }).select('-password'));
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/students/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── STATS ──
router.get('/stats', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [teachers, students, subjects, classes] = await Promise.all([
      User.countDocuments({ role: 'teacher' }),
      User.countDocuments({ role: 'student' }),
      Subject.countDocuments(),
      Class.countDocuments()
    ]);

    res.json({ teachers, students, subjects, classes });

  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
