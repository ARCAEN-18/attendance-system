require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./User');
const Attendance = require('./Attendance');
const Announcement = require('./Announcement');
const Subject = require('./Subject');
const Class = require('./Class');

const classes = [
  { name: 'CSE-A', department: 'Computer Science', year: '2nd Year' },
  { name: 'CSE-B', department: 'Computer Science', year: '2nd Year' },
  { name: 'CSE-C', department: 'Computer Science', year: '2nd Year' },
];

const users = [
  { name: "Dr. Priya Sharma",  email: "priya@college.edu",  password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", role: "teacher", collegeId: "TCH001", department: "Computer Science", classes: ["CSE-A", "CSE-B"] },
  { name: "Prof. Rahul Mehta", email: "rahul@college.edu",  password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", role: "teacher", collegeId: "TCH002", department: "Computer Science", classes: ["CSE-A", "CSE-C"] },
  { name: "Arun Kumar",   email: "arun@college.edu",   password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", role: "student", collegeId: "STU001", class: "CSE-A", rollNo: "101" },
  { name: "Sneha Patel",  email: "sneha@college.edu",  password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", role: "student", collegeId: "STU002", class: "CSE-A", rollNo: "102" },
  { name: "Vikram Singh", email: "vikram@college.edu", password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", role: "student", collegeId: "STU003", class: "CSE-B", rollNo: "201" },
  { name: "vismaya",  email: "vismayasunil214@gmail.com", password: "$2b$10$y2pQI84q/waWMzTUpMoLquUGkhRvRO.gtvgNwgKjEaBEFVIksT8zq", role: "student", collegeId: "STU007", class: "CSE-B", rollNo: "107" },
  { name: "rishitha", email: "rishitha0406@gmail.com",    password: "$2b$10$PJ9xj67oGPPwaVXrwW8WK.kxopM/Ws7e.PxyXGwUVeXh/a4yWzzS6", role: "student", collegeId: "STU008", class: "CSE-A", rollNo: "108" }
];

// ✅ FIX: Every code is globally unique. Same subject taught in different
//         classes gets a DIFFERENT code (e.g. CS301A vs CS301B).
const subjects = [
  // CSE-A
  { name: "Data Structures",   code: "CS301A", teacherId: "TCH001", class: "CSE-A" },
  { name: "DBMS",              code: "CS302A", teacherId: "TCH002", class: "CSE-A" },
  { name: "Operating Systems", code: "CS303A", teacherId: "TCH001", class: "CSE-A" },
  { name: "Computer Networks", code: "CS304A", teacherId: "TCH002", class: "CSE-A" },
  // CSE-B
  { name: "Data Structures",   code: "CS301B", teacherId: "TCH001", class: "CSE-B" },
  { name: "DBMS",              code: "CS302B", teacherId: "TCH002", class: "CSE-B" },
  // CSE-C
  { name: "DBMS",              code: "CS302C", teacherId: "TCH002", class: "CSE-C" },
  { name: "Computer Networks", code: "CS304C", teacherId: "TCH001", class: "CSE-C" },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    await User.deleteMany({});
    await Subject.deleteMany({});
    await Attendance.deleteMany({});
    await Announcement.deleteMany({});
    await Class.deleteMany({});

    await Class.insertMany(classes);
    await User.insertMany(users);
    await Subject.insertMany(subjects);

    console.log('✅ All data seeded to MongoDB successfully!');
    console.log('   Classes: ', classes.length);
    console.log('   Users:   ', users.length);
    console.log('   Subjects:', subjects.length);
    console.log('\nYou can now run: node server.js');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    if (err.code === 11000) {
      console.error('   Duplicate key details:', err.keyValue);
    }
    process.exit(1);
  }
}

seed();
