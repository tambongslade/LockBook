const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/admin/userRoutes');
const departmentRoutes = require('./routes/admin/departmentRoutes');
const courseRoutes = require('./routes/admin/courseRoutes');
const courseOutlineModuleRoutes = require('./routes/admin/courseOutlineModuleRoutes');
const timetableEntryRoutes = require('./routes/admin/timetableEntryRoutes');
const scheduleRoutes = require('./routes/admin/scheduleRoutes');
const hallRoutes = require('./routes/admin/hallRoutes');
const adminRoutes = require('./routes/adminRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const delegateRoutes = require('./routes/delegateRoutes');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);

// --- Mount general admin routes FIRST ---
app.use('/api/admin', adminRoutes);

// --- Then mount specific admin sub-routes ---
app.use('/api/admin/users', userRoutes);
app.use('/api/admin/departments', departmentRoutes);
app.use('/api/admin/courses', courseRoutes);
app.use('/api/admin/modules', courseOutlineModuleRoutes);
app.use('/api/admin/timetable', timetableEntryRoutes);
app.use('/api/admin/schedule', scheduleRoutes);
app.use('/api/admin/halls', hallRoutes);

// --- Teacher and Delegate Routes ---
app.use('/api/teacher', teacherRoutes);
app.use('/api/delegate', delegateRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to LogBook API' });
});

// Connect to MongoDB
connectDB();

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 