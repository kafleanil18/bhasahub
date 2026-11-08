require('dotenv').config();
const { setEmailSettingsLoader } = require('./utils/emailTransport');
setEmailSettingsLoader(require('./utils/emailApiSettings').loadSavedEmailDelivery);
const express = require('express');
const mongoose = require('mongoose');
const { startWhenReady, databaseHealth, requireDatabase } = require('./utils/serverReadiness');
const cors = require('cors');
const uploadRoutes = require('./routes/upload');
const path = require('path');
const fs = require('fs');
const enrollmentRoutes = require('./routes/enrollments');
const progressRoutes = require('./routes/progress');
const feedbackRoutes = require('./routes/feedback');
const testRoutes = require('./routes/tests');
const testimonialRoutes = require('./routes/testimonials');
const teamRoutes = require('./routes/team');
const accessRequestRoutes = require('./routes/accessRequests');
const pinyinRecordingRoutes = require('./routes/pinyinRecordings');
const pinyinTableRoutes = require('./routes/pinyinTable');
const adminStatsRoutes = require('./routes/adminStats');
const auditLogRoutes = require('./routes/auditLog');
const settingsRoutes = require('./routes/settings');
const srsRoutes = require('./routes/srs');
const attemptRoutes = require('./routes/attempts');
const analyticsRoutes = require('./routes/analytics');
const { router: hanziTraceRoutes, ensureSeeded: ensureHanziTraceSeeded } = require('./routes/hanziTrace');

const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const lessonRoutes = require('./routes/lessons');
const subscriptionRoutes = require('./routes/subscriptions');
const userRoutes = require('./routes/users');
const slideRoutes = require('./routes/slides');
const conversationPracticeRoutes = require('./routes/conversationPractice');
const helmet = require('helmet');

const aiToneRoutes = require('./routes/aiTone');

const app = express();
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors());
app.use(express.json());
app.get('/api/health', databaseHealth(mongoose.connection));
app.use('/api', requireDatabase(mongoose.connection));
app.use('/api/upload', uploadRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/hsk1', require('./routes/hsk1'));
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/access-requests', accessRequestRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/sentences', require('./routes/sentences'));
app.use('/api/users', userRoutes);
app.use('/api/slides', slideRoutes);
app.use('/api/pinyin-recordings', pinyinRecordingRoutes);
app.use('/api/pinyin-table', pinyinTableRoutes);
app.use('/api/admin-stats', adminStatsRoutes);
app.use('/api/audit-log', auditLogRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/settings/email', require('./routes/emailSettings'));
app.use('/api/settings/email-api', require('./routes/emailApiSettings'));
app.use('/api/practice-reminders', require('./routes/practiceReminders'));
app.use('/api/srs', srsRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/hanzi-trace', hanziTraceRoutes);
app.use('/api/ai', aiToneRoutes);


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

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/conversation-practice', conversationPracticeRoutes);

// In production the client is built into client/dist and served by this
// same process, so the app is reachable at a single origin with no CORS
// or cross-port setup needed.
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^\/(?!api|uploads)/, (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

async function start() {
  const port = process.env.PORT || 5001;
  const server = await startWhenReady({
    connect: () => mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/language-lms', {
      serverSelectionTimeoutMS: 10000,
    }),
    initialize: async () => {
      console.log('✅ MongoDB connected');
      await Promise.all([seedTeam(), ensureHanziTraceSeeded(), require('./models/PracticeReminder').init(), require('./models/EmailApiSettings').init()]);
    },
    listen: () => new Promise((resolve, reject) => {
      const server = app.listen(port);
      server.once('error', reject);
      server.once('listening', () => {
        server.removeListener('error', reject);
        console.log(`🚀 Server running on http://localhost:${port}`);
        resolve(server);
      });
    }),
    disconnect: () => mongoose.disconnect(),
  });
  const reminders = require('./utils/practiceReminderWorker').startPracticeReminderWorker();
  server.once('close', () => reminders.stop());
  return server;
}

if (require.main === module) {
  start().catch(() => {
    console.error('Server startup failed. Check database connectivity and server configuration.');
    process.exitCode = 1;
  });
}

module.exports = { app, start };
