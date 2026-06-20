const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const { dbClient } = require('./database/dbClient');
const { verifyToken, isAdmin } = require('./middleware/auth');

// Load environment variables
dotenv.config();

const app = express();

// Middlewares
app.use(cors({ origin: '*' })); // Permissive CORS for development
app.use(express.json());

// Import controllers
const authController = require('./controllers/authController');
const volunteerController = require('./controllers/volunteerController');
const eventController = require('./controllers/eventController');
const reportController = require('./controllers/reportController');

// --- ROUTES ---

// 1. Auth Routing
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/me', verifyToken, authController.getMe);

// 2. Volunteer Routing
app.get('/api/volunteers', verifyToken, isAdmin, volunteerController.getAllVolunteers);
app.put('/api/volunteers/profile', verifyToken, volunteerController.updateProfile);
app.put('/api/volunteers/:id/verify', verifyToken, isAdmin, volunteerController.toggleVerify);
app.put('/api/volunteers/:id/hours', verifyToken, isAdmin, volunteerController.updateHours);

// 3. Event and Shift Registration Routing
// Note: Specific subpaths first
app.get('/api/registrations/my', verifyToken, eventController.getMyRegistrations);
app.get('/api/registrations', verifyToken, isAdmin, eventController.getRegistrations);
app.put('/api/registrations/:id', verifyToken, isAdmin, eventController.updateRegistrationStatus);

// Event CRUD
app.get('/api/events', eventController.getEvents);
app.get('/api/events/:id', verifyToken, eventController.getEventById);
app.post('/api/events', verifyToken, isAdmin, eventController.createEvent);
app.put('/api/events/:id', verifyToken, isAdmin, eventController.updateEvent);
app.delete('/api/events/:id', verifyToken, isAdmin, eventController.deleteEvent);
app.post('/api/events/:id/apply', verifyToken, eventController.applyToEvent);

// 4. Report Routing
app.get('/api/reports/stats', verifyToken, isAdmin, reportController.getStats);
app.get('/api/reports/csv', verifyToken, isAdmin, reportController.exportVolunteersCSV);

// Health Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    database: global.isMockDatabase ? 'Local JSON Store' : 'MongoDB Connection'
  });
});

// Error handling fallback
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({ message: 'Internal Server Error.' });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to Database (auto configures mock fallback toggle)
  await connectDB();

  // Ensure Admin User is Seeded
  await dbClient.seedAdminIfNeeded();

  app.listen(PORT, () => {
    console.log('============================================================');
    console.log(`Volunteer System Backend Server running on port ${PORT}`);
    console.log(`Database Mode: ${global.isMockDatabase ? 'JSON LOCAL STORAGE FALLBACK' : 'MONGODB ONLINE'}`);
    console.log('============================================================');
  });
};

startServer();
