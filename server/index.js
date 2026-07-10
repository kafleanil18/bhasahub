const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const uploadRoutes = require('./routes/upload');
const path = require('path');
const enrollmentRoutes = require('./routes/enrollments');
const progressRoutes = require('./routes/progress');
const feedbackRoutes = require('./routes/feedback');
const testRoutes = require('./routes/tests');
const blogRoutes = require('./routes/blogs');
const testimonialRoutes = require('./routes/testimonials');

require('dotenv').config();

const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const lessonRoutes = require('./routes/lessons');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/upload', uploadRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/testimonials', testimonialRoutes);

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/language-lms')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);

app.get('/api/health', (req, res) => {
  res.json({ message: 'Language LMS API is running!' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));