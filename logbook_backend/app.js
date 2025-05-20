const logbookRoutes = require('./routes/logbook');
const teacherRoutes = require('./routes/teacher');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/logbook', logbookRoutes);
app.use('/api/teacher', teacherRoutes); 