require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected!'))
  .catch(err => { console.error('❌ MongoDB connection failed:', err.message); process.exit(1); });

app.use('/api/auth',          require('./auth'));
app.use('/api/attendance',    require('./attendanceRoutes'));
app.use('/api/announcements', require('./announcements'));
app.use('/api/subjects',      require('./subjects'));   // includes /upload-students
app.use('/api/admin',         require('./admin'));

// Catch-all: serve frontend
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n✅ Attendance Tracker running on http://localhost:${PORT}`);
  console.log('  Admin   → ADMIN001 / admin@123');
  console.log('  Teacher → TCH001 / password');
  console.log('  Student → STU001 / password\n');
});
