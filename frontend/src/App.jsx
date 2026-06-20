import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VolunteerDashboard from './pages/VolunteerDashboard';
import AdminDashboard from './pages/AdminDashboard';

function AppContent() {
  const { user, logout, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [page, setPage] = useState('home');

  const navigateTo = (targetPage) => {
    setPage(targetPage);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        height: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-primary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800 }}>🤝 UnityForce</h2>
          <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>Syncing volunteer sessions...</p>
        </div>
      </div>
    );
  }

  const getNavLinks = () => {
    if (!user) {
      return (
        <>
          <li><a href="#" onClick={(e) => { e.preventDefault(); navigateTo('home'); }} className={`nav-link ${page === 'home' ? 'active' : ''}`}>Home</a></li>
          <li><a href="#" onClick={(e) => { e.preventDefault(); navigateTo('login'); }} className={`nav-link ${page === 'login' ? 'active' : ''}`}>Sign In</a></li>
          <li><a href="#" onClick={(e) => { e.preventDefault(); navigateTo('register'); }} className={`nav-link ${page === 'register' ? 'active' : ''}`}>Join Now</a></li>
        </>
      );
    }
    
    if (user.role === 'admin') {
      return (
        <>
          <li><a href="#" onClick={(e) => { e.preventDefault(); navigateTo('home'); }} className={`nav-link ${page === 'home' ? 'active' : ''}`}>Home</a></li>
          <li><a href="#" onClick={(e) => { e.preventDefault(); navigateTo('admin-dashboard'); }} className={`nav-link ${page === 'admin-dashboard' ? 'active' : ''}`}>Admin Control Panel</a></li>
        </>
      );
    }

    return (
      <>
        <li><a href="#" onClick={(e) => { e.preventDefault(); navigateTo('home'); }} className={`nav-link ${page === 'home' ? 'active' : ''}`}>Home</a></li>
        <li><a href="#" onClick={(e) => { e.preventDefault(); navigateTo('dashboard'); }} className={`nav-link ${page === 'dashboard' ? 'active' : ''}`}>My Dashboard</a></li>
      </>
    );
  };

  return (
    <div className="app-container">
      {/* Premium Top Navigation bar */}
      <nav className="navbar">
        <div className="navbar-container">
          <div className="logo" onClick={() => navigateTo('home')} style={{ cursor: 'pointer' }}>
            🤝 UnityForce
          </div>
          <ul className="nav-links">
            {getNavLinks()}
          </ul>
          <div className="nav-actions">
            <button 
              onClick={toggleTheme} 
              className="theme-toggle-btn" 
              title="Toggle Light/Dark Theme"
              style={{ fontSize: '1.25rem' }}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            {user && (
              <button 
                onClick={() => {
                  logout();
                  navigateTo('home');
                }} 
                className="btn btn-outline btn-sm"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Dynamic Viewport */}
      <main className="main-content">
        {page === 'home' && <Home navigateTo={navigateTo} />}
        {page === 'login' && <Login navigateTo={navigateTo} />}
        {page === 'register' && <Register navigateTo={navigateTo} />}
        {page === 'dashboard' && <VolunteerDashboard />}
        {page === 'admin-dashboard' && <AdminDashboard />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
