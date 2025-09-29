const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const multer = require('multer');
const session = require('express-session');

const app = express();
const port = 3019;

// ------------------ MongoDB Connection ------------------
mongoose.connect('mongodb://127.0.0.1:27017/studentDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("MongoDB connected"))
.catch(err => console.log(err));

// ------------------ Student Schema ------------------
const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  usn: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePicture: { type: String, default: '' },
  phone: { type: String, default: '' },
  department: { type: String, default: '' },
  year: { type: String, default: '' },
  semester: { type: String, default: '' },
  totalPoints: { type: Number, default: 0 }
});

const Student = mongoose.model('Student', studentSchema);

// ------------------ AICTE Grade Schema ------------------
const aicteGradeSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  activityName: { type: String, required: true },
  points: { type: Number, required: true },
  proofDocument: { type: String, required: true },
  dateAdded: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
});

const AICTEGrade = mongoose.model('AICTEGrade', aicteGradeSchema);

// ------------------ Activity Schema ------------------
const activitySchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  activityName: { type: String, required: true },
  description: { type: String, required: true },
  points: { type: Number, required: true },
  dateTime: { type: Date, default: Date.now }
});

const Activity = mongoose.model('Activity', activitySchema);

// ------------------ Event Schema ------------------
const eventSchema = new mongoose.Schema({
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mentor', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  eventDate: { type: Date, required: true },
  location: { type: String, required: true },
  category: { type: String, enum: ['workshop', 'seminar', 'competition', 'meeting', 'other'], default: 'other' },
  isActive: { type: Boolean, default: true },
  // Target audience filters
  targetUSNRange: {
    startUSN: { type: String, default: '' }, // e.g., "1MS21CS001"
    endUSN: { type: String, default: '' }    // e.g., "1MS21CS100"
  },
  targetSemesters: [{ type: String }], // e.g., ["3", "4", "5"]
  targetDepartments: [{ type: String }], // e.g., ["CSE", "ISE", "ECE"]
  isOpenToAll: { type: Boolean, default: true }, // If true, ignore filters
  createdAt: { type: Date, default: Date.now }
});

const Event = mongoose.model('Event', eventSchema);

// ------------------ MongoDB Connection for Mentors ------------------
const mongooseMentor = mongoose.createConnection('mongodb://127.0.0.1:27017/mentorDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mongooseMentor.on('connected', () => console.log("MentorDB connected"));
mongooseMentor.on('error', (err) => console.log(err));

// ------------------ Mentor Schema ------------------
const mentorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  password: { type: String, required: true }
});

const Mentor = mongooseMentor.model('Mentor', mentorSchema);

// ------------------ Middleware ------------------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from public folder

// Session middleware
app.use(session({
  secret: 'aicte-grade-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

const upload = multer({ storage: storage });

// ------------------ Routes ------------------

// Home Page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Register Page
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'student_register.html'));
});

// Login Page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 's_login.html'));
});

// ------------------ Registration POST ------------------
app.post('/register', async (req, res) => {
  const { name, usn, email, password, confirmPassword } = req.body;

  // Password match check
  if (password !== confirmPassword) {
    return res.send("Passwords do not match");
  }

  try {
    // Check if email already exists
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.send("Email already registered");
    }

    // Save new student
    const newStudent = new Student({ name, usn, email, password });
    await newStudent.save();

    res.send("Registration successful!");
  } catch (err) {
    console.error(err);
    res.send("Error occurred while registering");
  }
});

// ------------------ Login POST ------------------
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const student = await Student.findOne({ email, password });
    if (student) {
      req.session.studentId = student._id;
      req.session.studentEmail = student.email;
      res.json({ success: true, message: "Login successful!" });
    } else {
      res.status(401).json({ success: false, message: "Invalid email or password" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error occurred while logging in" });
  }
});

// Mentor Register Page
app.get('/mentor-register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'mentor_register.html'));
});

// Mentor Registration POST
app.post('/mentor-register', async (req, res) => {
  const { name, email, department, password, confirmPassword } = req.body;

  // Password match check
  if (password !== confirmPassword) {
    return res.send("Passwords do not match");
  }

  try {
    // Check if email already exists
    const existingMentor = await Mentor.findOne({ email });
    if (existingMentor) {
      return res.send("Email already registered");
    }

    // Save new mentor
    const newMentor = new Mentor({ name, email, department, password });
    await newMentor.save();

    res.send("Mentor Registration successful!");
  } catch (err) {
    console.error(err);
    res.send("Error occurred while registering mentor");
  }
});

// Mentor Login Page
app.get('/mentor-login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'mentor_login.html'));
});

// Mentor Login POST
app.post('/mentor-login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const mentor = await Mentor.findOne({ email, password });
    if (mentor) {
      req.session.mentorId = mentor._id;
      req.session.mentorEmail = mentor.email;
      res.json({ success: true, message: "Mentor Login successful!" });
    } else {
      res.status(401).json({ success: false, message: "Invalid email or password" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error occurred while logging in" });
  }
});

// ------------------ Student Dashboard Routes ------------------

// Middleware to check if student is logged in
const requireAuth = (req, res, next) => {
  if (req.session.studentId) {
    next();
  } else {
    res.redirect('/login');
  }
};

// Student Dashboard
app.get('/dashboard', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'student_dashboard.html'));
});

// Get student data
app.get('/api/student-data', requireAuth, async (req, res) => {
  try {
    const student = await Student.findById(req.session.studentId);
    const aicteGrades = await AICTEGrade.find({ studentId: req.session.studentId }).sort({ dateAdded: -1 });
    const activities = await Activity.find({ studentId: req.session.studentId }).sort({ dateTime: -1 });
    
    // Calculate total points from approved AICTE grades and activities
    const approvedAICTEPoints = aicteGrades
      .filter(grade => grade.status === 'approved')
      .reduce((total, grade) => total + grade.points, 0);
    
    const activityPoints = activities
      .reduce((total, activity) => total + activity.points, 0);
    
    const totalPoints = approvedAICTEPoints + activityPoints;
    
    // Update student's total points in database for consistency
    if (student.totalPoints !== totalPoints) {
      await Student.findByIdAndUpdate(req.session.studentId, { totalPoints });
      student.totalPoints = totalPoints;
    }
    
    res.json({
      student: {
        name: student.name,
        usn: student.usn,
        email: student.email,
        profilePicture: student.profilePicture,
        phone: student.phone,
        department: student.department,
        year: student.year,
        semester: student.semester,
        totalPoints: totalPoints
      },
      aicteGrades,
      activities
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching student data' });
  }
});

// Update student profile
app.post('/api/update-profile', requireAuth, upload.single('profilePicture'), async (req, res) => {
  try {
    const { name, phone, department, year, semester } = req.body;
    const updateData = { name, phone, department, year, semester };
    
    if (req.file) {
      updateData.profilePicture = '/uploads/' + req.file.filename;
    }
    
    await Student.findByIdAndUpdate(req.session.studentId, updateData);
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error updating profile' });
  }
});

// Add AICTE grade
app.post('/api/add-aicte-grade', requireAuth, upload.single('proofDocument'), async (req, res) => {
  try {
    const { activityName, points } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Proof document is required' });
    }
    
    const aicteGrade = new AICTEGrade({
      studentId: req.session.studentId,
      activityName,
      points: parseInt(points),
      proofDocument: '/uploads/' + req.file.filename,
      status: 'pending' // Grade starts as pending, points not added yet
    });
    
    await aicteGrade.save();
    
    // DO NOT update student's total points here - only when mentor approves
    
    res.json({ success: true, message: 'AICTE grade submitted for approval' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error adding AICTE grade' });
  }
});

// Add activity
app.post('/api/add-activity', requireAuth, async (req, res) => {
  try {
    const { activityName, description, points } = req.body;
    
    const activity = new Activity({
      studentId: req.session.studentId,
      activityName,
      description,
      points: parseInt(points)
    });
    
    await activity.save();
    
    // Update student's total points
    await Student.findByIdAndUpdate(req.session.studentId, {
      $inc: { totalPoints: parseInt(points) }
    });
    
    res.json({ success: true, message: 'Activity added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error adding activity' });
  }
});

// Logout
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Could not log out' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// ------------------ Mentor Dashboard Routes ------------------

// Middleware to check if mentor is logged in
const requireMentorAuth = (req, res, next) => {
  if (req.session.mentorId) {
    next();
  } else {
    res.redirect('/mentor-login');
  }
};

// Mentor Dashboard
app.get('/mentor-dashboard', requireMentorAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'mentor_dashboard.html'));
});

// Get mentor data
app.get('/api/mentor-data', requireMentorAuth, async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.session.mentorId);
    const events = await Event.find({ mentorId: req.session.mentorId }).sort({ eventDate: 1 });
    
    res.json({
      mentor: {
        name: mentor.name,
        email: mentor.email,
        department: mentor.department
      },
      events
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching mentor data' });
  }
});

// Search student by USN
app.post('/api/search-student', requireMentorAuth, async (req, res) => {
  try {
    const { usn } = req.body;
    const student = await Student.findOne({ usn });
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const aicteGrades = await AICTEGrade.find({ studentId: student._id }).sort({ dateAdded: -1 });
    const activities = await Activity.find({ studentId: student._id }).sort({ dateTime: -1 });
    
    res.json({
      student: {
        _id: student._id,
        name: student.name,
        usn: student.usn,
        email: student.email,
        profilePicture: student.profilePicture,
        phone: student.phone,
        department: student.department,
        year: student.year,
        totalPoints: student.totalPoints
      },
      aicteGrades,
      activities
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error searching student' });
  }
});

// Update AICTE grade status
app.post('/api/update-grade-status', requireMentorAuth, async (req, res) => {
  try {
    const { gradeId, status } = req.body;
    
    const grade = await AICTEGrade.findById(gradeId);
    if (!grade) {
      return res.status(404).json({ error: 'Grade not found' });
    }
    
    const oldStatus = grade.status;
    grade.status = status;
    await grade.save();
    
    // If status changed from approved to rejected or vice versa, update student points
    if (oldStatus !== status) {
      const pointChange = status === 'approved' ? grade.points : (oldStatus === 'approved' ? -grade.points : 0);
      if (pointChange !== 0) {
        await Student.findByIdAndUpdate(grade.studentId, {
          $inc: { totalPoints: pointChange }
        });
      }
    }
    
    res.json({ success: true, message: 'Grade status updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error updating grade status' });
  }
});

// Add event
app.post('/api/add-event', requireMentorAuth, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      eventDate, 
      location, 
      category, 
      isOpenToAll,
      startUSN,
      endUSN,
      targetSemesters,
      targetDepartments
    } = req.body;
    
    const event = new Event({
      mentorId: req.session.mentorId,
      title,
      description,
      eventDate: new Date(eventDate),
      location,
      category,
      isOpenToAll: isOpenToAll === 'true' || isOpenToAll === true,
      targetUSNRange: {
        startUSN: startUSN || '',
        endUSN: endUSN || ''
      },
      targetSemesters: targetSemesters ? (Array.isArray(targetSemesters) ? targetSemesters : targetSemesters.split(',').map(s => s.trim())) : [],
      targetDepartments: targetDepartments ? (Array.isArray(targetDepartments) ? targetDepartments : targetDepartments.split(',').map(s => s.trim())) : []
    });
    
    await event.save();
    res.json({ success: true, message: 'Event added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error adding event' });
  }
});

// Update event
app.post('/api/update-event', requireMentorAuth, async (req, res) => {
  try {
    const { 
      eventId, 
      title, 
      description, 
      eventDate, 
      location, 
      category, 
      isActive,
      isOpenToAll,
      startUSN,
      endUSN,
      targetSemesters,
      targetDepartments
    } = req.body;
    
    await Event.findByIdAndUpdate(eventId, {
      title,
      description,
      eventDate: new Date(eventDate),
      location,
      category,
      isActive,
      isOpenToAll: isOpenToAll === 'true' || isOpenToAll === true,
      targetUSNRange: {
        startUSN: startUSN || '',
        endUSN: endUSN || ''
      },
      targetSemesters: targetSemesters ? (Array.isArray(targetSemesters) ? targetSemesters : targetSemesters.split(',').map(s => s.trim())) : [],
      targetDepartments: targetDepartments ? (Array.isArray(targetDepartments) ? targetDepartments : targetDepartments.split(',').map(s => s.trim())) : []
    });
    
    res.json({ success: true, message: 'Event updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error updating event' });
  }
});

// Delete event
app.post('/api/delete-event', requireMentorAuth, async (req, res) => {
  try {
    const { eventId } = req.body;
    await Event.findByIdAndDelete(eventId);
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error deleting event' });
  }
});

// Get filtered events for logged-in student
app.get('/api/events', requireAuth, async (req, res) => {
  try {
    const student = await Student.findById(req.session.studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Helper function to check if USN is in range
    const isUSNInRange = (usn, startUSN, endUSN) => {
      if (!startUSN || !endUSN) return true;
      
      // Extract numeric part from USN for comparison
      const extractNumber = (usnStr) => {
        const match = usnStr.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      };
      
      const usnNum = extractNumber(usn);
      const startNum = extractNumber(startUSN);
      const endNum = extractNumber(endUSN);
      
      return usnNum >= startNum && usnNum <= endNum;
    };

    // Get all active upcoming events
    const allEvents = await Event.find({ 
      isActive: true, 
      eventDate: { $gte: new Date() } 
    })
    .populate('mentorId', 'name department')
    .sort({ eventDate: 1 });

    // Filter events based on student profile
    const filteredEvents = allEvents.filter(event => {
      // If event is open to all, include it
      if (event.isOpenToAll) {
        return true;
      }

      let matches = true;

      // Check USN range
      if (event.targetUSNRange.startUSN && event.targetUSNRange.endUSN) {
        matches = matches && isUSNInRange(student.usn, event.targetUSNRange.startUSN, event.targetUSNRange.endUSN);
      }

      // Check semester
      if (event.targetSemesters.length > 0 && student.semester) {
        matches = matches && event.targetSemesters.includes(student.semester);
      }

      // Check department
      if (event.targetDepartments.length > 0 && student.department) {
        matches = matches && event.targetDepartments.includes(student.department);
      }

      return matches;
    });

    res.json(filteredEvents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching events' });
  }
});

// Get all events (for mentors to view)
app.get('/api/all-events', requireMentorAuth, async (req, res) => {
  try {
    const events = await Event.find({ mentorId: req.session.mentorId })
      .populate('mentorId', 'name department')
      .sort({ eventDate: -1 });
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching events' });
  }
});

// ------------------ Start Server ------------------
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
