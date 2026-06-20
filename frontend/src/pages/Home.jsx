import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Home({ navigateTo }) {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.filter(e => e.status === 'open'));
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        <div>
          <h1 className="hero-title">Make a Real Difference in Your Community</h1>
          <p className="hero-subtitle">
            UnityForce connects passionate individuals with meaningful volunteer opportunities. 
            Build new skills, meet amazing peers, and elevate your community impact today.
          </p>
          <div className="hero-buttons">
            {user ? (
              <button 
                onClick={() => navigateTo('dashboard')} 
                className="btn btn-primary"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <button 
                  onClick={() => navigateTo('register')} 
                  className="btn btn-primary"
                >
                  Join as Volunteer
                </button>
                <button 
                  onClick={() => navigateTo('login')} 
                  className="btn btn-outline"
                >
                  Admin Portal
                </button>
              </>
            )}
          </div>
        </div>
        <div className="hero-visual">
          <svg className="hero-blob" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="var(--primary-color)" d="M43.1,-58.5C55.9,-48.6,66.3,-35.8,70.5,-21.2C74.6,-6.6,72.4,9.8,66,24.1C59.6,38.3,49,50.3,35.6,58C22.2,65.8,6,69.2,-9.3,67C-24.6,64.8,-39,56.9,-49.9,45.4C-60.8,33.9,-68.2,18.8,-70.6,2.9C-73.1,-13.1,-70.6,-29.9,-61.8,-41C-53.1,-52.1,-38.1,-57.6,-24,-61.2C-9.8,-64.8,3.6,-66.6,17.2,-64.4C30.9,-62.3,30.3,-68.4,43.1,-58.5Z" transform="translate(100 100)" style={{ opacity: 0.85 }} />
          </svg>
        </div>
      </section>

      {/* Featured Openings */}
      <section style={{ marginTop: '3rem' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          Active Volunteer Openings
        </h2>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            Loading volunteer roles...
          </div>
        ) : events.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-secondary)' }}>
              No active volunteer slots are open right now. Check back soon!
            </p>
          </div>
        ) : (
          <div className="events-grid">
            {events.map(event => (
              <div key={event._id} className="glass-card event-card">
                <div className="event-meta">
                  <span>📍 {event.location}</span>
                  <span>📅 {event.date}</span>
                </div>
                <h3 className="event-title">{event.title}</h3>
                <p className="event-description">{event.description}</p>
                
                {event.requiredSkills && event.requiredSkills.length > 0 && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>REQUIRED SKILLS:</div>
                    <div className="skills-list">
                      {event.requiredSkills.map((s, idx) => (
                        <span key={idx} className="skill-tag">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="event-footer">
                  <span className="event-capacity">
                    👥 {event.currentVolunteers || 0} / {event.maxVolunteers} Joined
                  </span>
                  {user ? (
                    <button 
                      onClick={() => navigateTo('dashboard')} 
                      className="btn btn-secondary btn-sm"
                    >
                      Apply Now
                    </button>
                  ) : (
                    <button 
                      onClick={() => navigateTo('login')} 
                      className="btn btn-outline btn-sm"
                    >
                      Sign In to Apply
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Why Join Section */}
      <section style={{ marginTop: '5rem', padding: '4rem 2rem', background: 'rgba(99, 102, 241, 0.03)', borderRadius: 'var(--border-radius-md)' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '3rem', textAlign: 'center' }}>
          Why Volunteer with UnityForce?
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          <div className="glass-card" style={{ background: 'var(--bg-surface-solid)' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}>🌟 Personal Growth</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Acquire leadership, communication, and hands-on skills while helping charity projects succeed.
            </p>
          </div>
          <div className="glass-card" style={{ background: 'var(--bg-surface-solid)' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--secondary-color)' }}>🤝 Community Network</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Build links with like-minded changemakers, local organizers, and professionals who share your values.
            </p>
          </div>
          <div className="glass-card" style={{ background: 'var(--bg-surface-solid)' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--info-color)' }}>📈 Verified Record</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Maintain an official dashboard of your verified volunteering logs, hours, and project feedback.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
