const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { port, nodeEnv } = require('./config/config');
const errorHandler = require('./middleware/errorMiddleware');
const notFound = require('./middleware/notFound');
const authRoutes = require('./routes/authRoutes');
const travelRoutes = require('./routes/travelRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const reimbursementRoutes = require('./routes/reimbursementRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const userRoutes = require('./routes/userRoutes');
const reportRoutes = require('./routes/reportRoutes');
const auditRoutes = require('./routes/auditRoutes');
const path = require('path');

const app = express();

// Middleware
// Configure CORS based on environment
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : ['http://localhost:5173', 'http://localhost:5174'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
}));
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Corporate Travel & Expense Management API is running',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/travel-requests', travelRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reimbursements', reimbursementRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit-logs', auditRoutes);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Connect to MongoDB
connectDB();

// Export app for Vercel serverless
module.exports = app;

// Start server only if not in Vercel environment
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running in ${nodeEnv} mode on port ${port}`);
  });
}
