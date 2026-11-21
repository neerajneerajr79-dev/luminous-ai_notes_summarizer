const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
const env = require('./config/env');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { apiLimiter, authLimiter, aiLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/authRoutes');
const documentRoutes = require('./routes/documentRoutes');
const summaryRoutes = require('./routes/summaryRoutes');
const flashcardRoutes = require('./routes/flashcardRoutes');
const quizRoutes = require('./routes/quizRoutes');
const aiRoutes = require('./routes/aiRoutes');
const taskRoutes = require('./routes/taskRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: [env.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// Health check (used by dev tooling).
app.get('/api/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));

app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/summaries', summaryRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);

// NOTE: the uploads directory is intentionally NOT served publicly.
// Files are accessed through authenticated endpoints if ever needed.
if (process.env.NODE_ENV === 'test') {
  app.get('/api/__test', (_req, res) => res.json({ success: true }));
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
