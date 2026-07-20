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
const teamRoutes = require('./routes/team');
const accessRequestRoutes = require('./routes/accessRequests');
const pinyinRecordingRoutes = require('./routes/pinyinRecordings');

require('dotenv').config();

const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const lessonRoutes = require('./routes/lessons');
const subscriptionRoutes = require('./routes/subscriptions');
const userRoutes = require('./routes/users');
const slideRoutes = require('./routes/slides');

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
app.use('/api/team', teamRoutes);
app.use('/api/access-requests', accessRequestRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/slides', slideRoutes);
app.use('/api/pinyin-recordings', pinyinRecordingRoutes);


const TeamMember = require('./models/TeamMember');

const seedTeam = async () => {
  try {
    const count = await TeamMember.countDocuments();
    if (count === 0) {
      await TeamMember.insertMany([
        {
          key: 'founder',
          name: 'Anil Kafle',
          role: 'Founder & Teacher',
          bio: 'Anil Kafle is the founder and head instructor of BhashaHub. He brings years of language teaching experience, helping hundreds of students achieve success in their Chinese exams.',
        },
        {
          key: 'developer',
          name: 'Name Here',
          role: 'Developer',
          bio: 'Our developer builds the interactive features, quizzes, and backend engines that power BhashaHub, making sure everything runs smoothly and securely.',
        },
        {
          key: 'pm',
          name: 'Name Here',
          role: 'Project Manager',
          bio: 'Our project manager keeps everything on track, coordinating content, design, and development so the learning experience stays seamless.',
        }
      ]);
      console.log('🌱 Seeded default team members');
    }
  } catch (err) {
    console.error('Error seeding team members:', err);
  }
};

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/language-lms')
  .then(() => {
    console.log('✅ MongoDB connected');
    seedTeam();
  })
  .catch(err => console.error('❌ MongoDB error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);

app.get('/api/health', (req, res) => {
  res.json({ message: 'Language LMS API is running!' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));