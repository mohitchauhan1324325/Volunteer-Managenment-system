import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const PRESET_SKILLS = ['Tutoring', 'First Aid', 'Cooking', 'Logistics', 'Gardening', 'Social Media', 'Translation', 'Heavy Lifting', 'Coordination', 'IT Support'];

export default function VolunteerDashboard() {
  const { user, token, updateProfile, refreshUser } = useAuth();
  
  // Profile form state
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [availability, setAvailability] = useState(user?.availability || 'Flexible');
  const [skills, setSkills] = useState(user?.skills || []);
  const [customSkill, setCustomSkill] = useState('');
  
  // Dashboard lists state
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('opportunities'); // or 'my-shifts'
  
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      setDataLoading(true);
      // Fetch user registrations
      const regRes = await fetch('/api/registrations/my', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const regData = await regRes.json();
      if (regRes.ok) {
        setMyRegistrations(regData);
      }

      // Fetch all open events
      const eventRes = await fetch('/api/events');
      const eventData = await eventRes.json();
      if (eventRes.ok) {
        setAllEvents(eventData);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setDataLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setProfileLoading(true);
      setAlert({ type: '', message: '' });
      await updateProfile({ name, phone, bio, skills, availability });
      setAlert({ type: 'success', message: 'Profile updated successfully!' });
      refreshUser(); // Keep context in sync
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to update profile.' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleApply = async (eventId) => {
    try {
      setAlert({ type: '', message: '' });
      const res = await fetch(`/api/events/${eventId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to apply.');
      }
      setAlert({ type: 'success', message: 'Application submitted successfully!' });
      fetchDashboardData();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleToggleSkill = (skillName) => {
    if (skills.includes(skillName)) {
      setSkills(skills.filter(s => s !== skillName));
    } else {
      setSkills([...skills, skillName]);
    }
  };

  const handleAddCustomSkill = (e) => {
    e.preventDefault();
    const cleanSkill = customSkill.trim();
    if (cleanSkill && !skills.includes(cleanSkill)) {
      setSkills([...skills, cleanSkill]);
    }
    setCustomSkill('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  // Helper check if already applied to event
  const isApplied = (eventId) => {
    return myRegistrations.some(r => r.event.id === eventId);
  };

  const getApplicationStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <span className="event-badge badge-pending">Pending Review</span>;
      case 'approved': return <span className="event-badge badge-approved">Approved</span>;
      case 'rejected': return <span className="event-badge badge-rejected">Rejected</span>;
      case 'attended': return <span className="event-badge badge-attended">Attended</span>;
      default: return null;
    }
  };

  return (
    <div>
      {/* Verification Warning Alert */}
      {!user?.isVerified && (
        <div className="verify-banner">
          <div>
            ⏳ <strong>Account Status: Pending Verification</strong>
            <div style={{ fontSize: '0.85rem', fontWeight: 400, marginTop: '2px' }}>
              An Administrator needs to verify your profile before you can apply to active events. Complete your profile details to speed up verification.
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-title">Welcome back, {user?.name}!</h2>
          <p className="dashboard-welcome">Volunteer Dashboard &bull; Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '2026'}</p>
        </div>
      </div>

      {alert.message && (
        <div className={`alert alert-${alert.type}`}>
          {alert.type === 'success' ? '✅' : '⚠️'} {alert.message}
        </div>
      )}

      {/* Stats Summary Panel */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🕒</div>
          <div>
            <div className="stat-label">Hours Credited</div>
            <div className="stat-number" style={{ color: 'var(--primary-color)' }}>{user?.hoursVolunteered || 0} hrs</div>
          </div>
        </div>
        <div className="stat-card secondary">
          <div className="stat-icon">🗓️</div>
          <div>
            <div className="stat-label">Total Shifts Applied</div>
            <div className="stat-number">{myRegistrations.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div>
            <div className="stat-label">Attended Shifts</div>
            <div className="stat-number">
              {myRegistrations.filter(r => r.status === 'attended').length}
            </div>
          </div>
        </div>
      </div>

      <div className="split-layout">
        {/* Profile Editing Panel (Left Column) */}
        <div className="glass-card" style={{ height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            Volunteer Profile Settings
          </h3>
          <form onSubmit={handleSaveProfile}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555-0199"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Short Bio</label>
              <textarea
                className="form-input"
                style={{ resize: 'vertical', minHeight: '80px' }}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell organizers about your motivation, background, or special needs..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Availability Schedule</label>
              <select
                className="filter-select"
                style={{ width: '100%', padding: '0.75rem 1rem' }}
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
              >
                <option value="Flexible">Flexible / Anytime</option>
                <option value="Weekdays">Weekdays Only</option>
                <option value="Weekends">Weekends Only</option>
                <option value="Evenings">Evenings Only</option>
              </select>
            </div>

            {/* Skills Segment */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Your Skills</label>
              
              {/* Selected skills list */}
              <div className="skills-list" style={{ marginBottom: '0.75rem' }}>
                {skills.length === 0 ? (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No skills selected. Click presets below to add them.</span>
                ) : (
                  skills.map((s, idx) => (
                    <span key={idx} className="skill-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      {s}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(s)}
                        style={{ border: 'none', background: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        &times;
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Preset checklist toggles */}
              <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Preset Skills Toggles:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem' }}>
                {PRESET_SKILLS.map((preset, idx) => {
                  const active = skills.includes(preset);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleToggleSkill(preset)}
                      className="btn btn-outline btn-sm"
                      style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        background: active ? 'rgba(99, 102, 241, 0.15)' : '',
                        borderColor: active ? 'var(--primary-color)' : '',
                        color: active ? 'var(--primary-color)' : ''
                      }}
                    >
                      {active ? '✓ ' : '+ '}{preset}
                    </button>
                  );
                })}
              </div>

              {/* Custom skill adder */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                  placeholder="Or write custom skill..."
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                />
                <button
                  onClick={handleAddCustomSkill}
                  className="btn btn-outline btn-sm"
                  type="button"
                >
                  Add
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={profileLoading}
            >
              {profileLoading ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Dynamic Lists Tab View (Right Column) */}
        <div>
          <div className="tab-buttons">
            <button
              onClick={() => setActiveTab('opportunities')}
              className={`tab-btn ${activeTab === 'opportunities' ? 'active' : ''}`}
            >
              🔥 Available Openings
            </button>
            <button
              onClick={() => setActiveTab('my-shifts')}
              className={`tab-btn ${activeTab === 'my-shifts' ? 'active' : ''}`}
            >
              📋 My Registered Shifts ({myRegistrations.length})
            </button>
          </div>

          {dataLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              Loading data lists...
            </div>
          ) : activeTab === 'opportunities' ? (
            /* Opportunities Tab Content */
            <div className="events-grid" style={{ gridTemplateColumns: '1fr' }}>
              {allEvents.filter(e => e.status === 'open').length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
                  <p style={{ color: 'var(--text-secondary)' }}>No active volunteer shifts are open for application right now.</p>
                </div>
              ) : (
                allEvents.filter(e => e.status === 'open').map(event => {
                  const applied = isApplied(event._id);
                  const isFull = (event.currentVolunteers || 0) >= event.maxVolunteers;
                  return (
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
                        
                        {applied ? (
                          <button className="btn btn-outline btn-sm" disabled>
                            ✓ Already Applied
                          </button>
                        ) : isFull ? (
                          <button className="btn btn-outline btn-sm" disabled>
                            🚫 Shift Full
                          </button>
                        ) : (
                          <button
                            onClick={() => handleApply(event._id)}
                            className="btn btn-secondary btn-sm"
                            disabled={!user?.isVerified}
                            title={!user?.isVerified ? 'Your account must be verified by an admin' : ''}
                          >
                            {!user?.isVerified ? 'Verification Required' : 'Apply to Shift'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* My Shifts Tab Content */
            <div className="events-grid" style={{ gridTemplateColumns: '1fr' }}>
              {myRegistrations.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
                  <p style={{ color: 'var(--text-secondary)' }}>You haven't applied to any shifts yet.</p>
                </div>
              ) : (
                myRegistrations.map(reg => (
                  <div key={reg._id} className="glass-card event-card">
                    <div className="event-meta">
                      <span>📍 {reg.event.location}</span>
                      <span>📅 {reg.event.date}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 className="event-title">{reg.event.title}</h3>
                      {getApplicationStatusBadge(reg.status)}
                    </div>
                    <p className="event-description">{reg.event.description}</p>
                    
                    <div className="event-footer" style={{ marginTop: 'auto' }}>
                      <span className="event-capacity" style={{ fontWeight: 'bold' }}>
                        ⭐ Credited Hours: {reg.status === 'attended' ? `${reg.hoursCredited} hrs` : '0 hrs (Pending Attendance)'}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Registered on {new Date(reg.registrationDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
