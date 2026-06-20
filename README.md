# Volunteer Management System

## Overview
Volunteer Management System is a full-stack application built with Node.js, Express, MongoDB (with a local JSON fallback), and React + Vite. It enables volunteer registration, admin-managed event creation, volunteer verification, event applications, attendance tracking, and CSV export reporting.

The project is structured as a monorepo with separate `backend` and `frontend` directories, plus a root package file that orchestrates local development commands.

## Key Features
- User registration and login with JWT-based authentication
- Volunteer profile management and skill selection
- Admin dashboard for managing volunteers, events, and applications
- Event creation, editing, approval workflows, and attendance tracking
- Volunteer status verification and hours logging
- Dashboard stats and CSV export for volunteer reports
- MongoDB database support with automatic fallback to a local JSON store if no database connection is available

## Repository Structure
- `package.json` - root scripts and shared utilities
- `backend/` - Express API server and database client
  - `server.js` - Express app, routes, middleware, and server startup
  - `config/db.js` - database connection logic and fallback behavior
  - `database/dbClient.js` - data access layer for MongoDB or JSON fallback storage
  - `controllers/` - route handlers for auth, volunteers, events, registrations, and reports
  - `middleware/auth.js` - JWT verification and admin authorization
  - `models/Schemas.js` - (currently unused; schemas are defined in `dbClient.js`)
  - `.env` - environment configuration (not committed)
- `frontend/` - React frontend powered by Vite
  - `src/App.jsx` - app router and page rendering
  - `src/main.jsx` - React app bootstrap
  - `src/context/` - authentication and theme providers
  - `src/pages/` - core UI screens: `Home`, `Login`, `Register`, `VolunteerDashboard`, `AdminDashboard`
  - `index.html` and `vite.config.js` - Vite configuration for frontend development

## Backend Details
- `Express` server listens on `process.env.PORT || 5000`
- JWT authentication with `jsonwebtoken`
- Password hashing using `bcryptjs`
- Routes include:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
  - `GET /api/volunteers` (admin only)
  - `PUT /api/volunteers/profile`
  - `PUT /api/volunteers/:id/verify` (admin only)
  - `PUT /api/volunteers/:id/hours` (admin only)
  - `GET /api/events`
  - `GET /api/events/:id`
  - `POST /api/events` (admin only)
  - `PUT /api/events/:id` (admin only)
  - `DELETE /api/events/:id` (admin only)
  - `POST /api/events/:id/apply`
  - `GET /api/registrations/my`
  - `GET /api/registrations` (admin only)
  - `PUT /api/registrations/:id` (admin only)
  - `GET /api/reports/stats` (admin only)
  - `GET /api/reports/csv` (admin only)

### Database Handling
- Uses `mongoose` models when `MONGODB_URI` is configured and connection succeeds
- Otherwise, falls back to a local JSON file `backend/data/local_db.json`
- Admin seeding is supported for both MongoDB and the JSON fallback

## Frontend Details
- Built with React and Vite
- Theme persistence via `ThemeContext`
- Authentication persistence via `AuthContext` and `localStorage`
- Page-based navigation using local state in `App.jsx`
- Volunteer dashboard supports profile updates, skill management, event browsing, and application submission
- Admin dashboard supports volunteer approval, event management, registration review, attendance logging, and reporting

## Getting Started
### Prerequisites
- Node.js 18+ (recommended)
- npm
- Optional: MongoDB if you want real database storage instead of the JSON fallback

### Install dependencies
From the project root:
```bash
npm run install-all
```

### Run the backend only
```bash
npm run backend
```

Or run the backend in development mode with auto-reload:
```bash
npm run backend-dev
```

### Run the frontend only
```bash
npm run frontend
```

### Run both backend and frontend together
```bash
npm run dev
```

## Environment Variables
Create a `.env` file in `backend/` with values like:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/volunteer-management
JWT_SECRET=your_secret_key_here
```

If `MONGODB_URI` is missing or unreachable, the backend will use a local JSON database.

## Default Admin Credentials
- Email: `admin@volunteer.com`
- Password: `admin123`

> Note: These credentials are seeded automatically for local development. Change them before using the app in production.

## Usage
### Volunteer flow
1. Register as a volunteer
2. Complete your profile, add skills, and set availability
3. Wait for admin verification
4. Browse open events and apply
5. Track your registered shifts and approved hours

### Admin flow
1. Log in using admin credentials
2. Review and verify new volunteers
3. Create and manage volunteer events
4. Approve or reject registrations
5. Mark attendance and credit volunteer hours
6. Export volunteer reports as CSV

## Known Notes
- `backend/models/Schemas.js` is currently empty and not used in the existing execution flow
- The backend supports local JSON fallback storage, so the app can run without MongoDB
- Frontend navigation is implemented via page state rather than a router

## Future Improvements
- Add React Router for cleaner navigation
- Extract shared types and constants between frontend and backend
- Move Mongoose schemas into dedicated model files and remove fallback duplication
- Improve registration filtering and pagination
- Add unit/integration tests for backend API and frontend components
- Harden security for production (stronger JWT secrets, HTTPS, input sanitization)

## Author
Mohit Chauhan
"# Volunteer-Managenment-system" 
