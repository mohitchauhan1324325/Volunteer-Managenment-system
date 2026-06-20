import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { token } = useAuth();
  
  // Tabs: overview | volunteers | events | applications | reports
  const [activeTab, setActiveTab] = useState('overview');
  
  // Global dashboard metrics and stats
  const [stats, setStats] = useState(null);
  
  // Volunteers state
  const [volunteers, setVolunteers] = useState([]);
  const [searchVol, setSearchVol] = useState('');
  const [filterSkill, setFilterSkill] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // Events state
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    maxVolunteers: 10,
    requiredSkills: ''
  });
  
  // Registrations state
  const [registrations, setRegistrations] = useState([]);
  
  // Modals state
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showEditHours, setShowEditHours] = useState(null); // stores user object when editing hours
  const [customHours, setCustomHours] = useState(0);
  const [awardHoursTarget, setAwardHoursTarget] = useState(null); // stores registration id when marking attendance
  const [awardHours, setAwardHours] = useState(4);
  
  // Status alerts
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      loadDashboardData();
    }
  }, [token, activeTab]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch stats
      const statsRes = await fetch('/api/reports/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (activeTab === 'volunteers' || activeTab === 'overview') {
        const volRes = await fetch('/api/volunteers', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (volRes.ok) {
          const volData = await volRes.json();
          setVolunteers(volData);
        }
      }

      if (activeTab === 'events' || activeTab === 'overview') {
        const eventRes = await fetch('/api/events');
        if (eventRes.ok) {
          const eventData = await eventRes.json();
          setEvents(eventData);
        }
      }

      if (activeTab === 'applications' || activeTab === 'overview') {
        const regRes = await fetch('/api/registrations', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (regRes.ok) {
          const regData = await regRes.json();
          setRegistrations(regData);
        }
      }
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  // 1. Volunteer Actions
  const handleToggleVerify = async (id, currentStatus) => {
    try {
      const res = await fetch(`/api/volunteers/${id}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isVerified: !currentStatus })
      });
      if (res.ok) {
        setAlert({ type: 'success', message: 'Volunteer verification status updated successfully.' });
        loadDashboardData();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: 'Failed to update verification status.' });
    }
  };

  const handleUpdateHours = async (e) => {
    e.preventDefault();
    if (!showEditHours) return;
    try {
      const res = await fetch(`/api/volunteers/${showEditHours._id}/hours`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ hours: customHours })
      });
      if (res.ok) {
        setAlert({ type: 'success', message: `Hours updated successfully for ${showEditHours.name}.` });
        setShowEditHours(null);
        loadDashboardData();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: 'Failed to update hours.' });
    }
  };

  // 2. Event Actions
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const skillsArray = newEvent.requiredSkills
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newEvent,
          requiredSkills: skillsArray
        })
      });

      if (res.ok) {
        setAlert({ type: 'success', message: 'New event posted successfully.' });
        setShowCreateEvent(false);
        setNewEvent({ title: '', description: '', date: '', location: '', maxVolunteers: 10, requiredSkills: '' });
        loadDashboardData();
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error posting event');
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.message });
    }
  };

  const handleToggleEventStatus = async (eventId, currentStatus) => {
    const nextStatus = currentStatus === 'open' ? 'completed' : 'open';
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        setAlert({ type: 'success', message: `Event status marked as ${nextStatus}.` });
        loadDashboardData();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: 'Failed to toggle event status.' });
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event? This will also remove volunteer registration records for this event.')) return;
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setAlert({ type: 'success', message: 'Event successfully deleted.' });
        loadDashboardData();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: 'Failed to delete event.' });
    }
  };

  // 3. Applications Actions
  const handleReviewApplication = async (regId, nextStatus) => {
    try {
      const res = await fetch(`/api/registrations/${regId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        setAlert({ type: 'success', message: `Registration application marked as ${nextStatus}.` });
        loadDashboardData();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: 'Failed to update application status.' });
    }
  };

  const handleMarkAttended = async (e) => {
    e.preventDefault();
    if (!awardHoursTarget) return;
    try {
      const res = await fetch(`/api/registrations/${awardHoursTarget}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'attended',
          hoursCredited: awardHours
        })
      });
      if (res.ok) {
        setAlert({ type: 'success', message: 'Volunteer marked as attended. Hours successfully credited.' });
        setAwardHoursTarget(null);
        loadDashboardData();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: 'Failed to log attendance hours.' });
    }
  };

  // 4. Download CSV Report
  const handleDownloadCSV = async () => {
    try {
      const res = await fetch('/api/reports/csv', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to generate report.');
      const text = await res.text();
      
      const blob = new Blob([text], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `unityforce-volunteers-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      setAlert({ type: 'danger', message: 'Failed to download report. Ensure backend is running.' });
    }
  };

  // Volunteers Filtering Logic
  const getFilteredVolunteers = () => {
    return volunteers.filter(vol => {
      const q = searchVol.toLowerCase();
      const matchSearch = vol.name.toLowerCase().includes(q) || vol.email.toLowerCase().includes(q);
      const matchSkill = filterSkill === '' || vol.skills.some(s => s.toLowerCase().includes(filterSkill.toLowerCase()));
      const matchStatus = filterStatus === '' || (filterStatus === 'verified' ? vol.isVerified : !vol.isVerified);
      return matchSearch && matchSkill && matchStatus;
    });
  };

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-title">System Admin Control Center</h2>
          <p className="dashboard-welcome">Configure opportunities, approve applications, and review platform engagement metrics</p>
        </div>
      </div>

      {alert.message && (
        <div className={`alert alert-${alert.type}`} style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{alert.type === 'success' ? '✅' : '⚠️'} {alert.message}</span>
          <button onClick={() => setAlert({ type: '', message: '' })} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 'bold' }}>&times;</button>
        </div>
      )}

      {/* Metrics Bar */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div>
            <div className="stat-label">Total Volunteers</div>
            <div className="stat-number">{stats?.metrics?.totalVolunteers || 0}</div>
          </div>
        </div>
        <div className="stat-card secondary">
          <div className="stat-icon">⏳</div>
          <div>
            <div className="stat-label">Pending Verifications</div>
            <div className="stat-number">{stats?.metrics?.pendingVolunteers || 0}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div>
            <div className="stat-label">Active Events</div>
            <div className="stat-number">{stats?.metrics?.activeEvents || 0}</div>
          </div>
        </div>
        <div className="stat-card secondary">
          <div className="stat-icon">🕒</div>
          <div>
            <div className="stat-label">Total Hours Logged</div>
            <div className="stat-number" style={{ color: 'var(--secondary-color)' }}>{stats?.metrics?.totalHours || 0} hrs</div>
          </div>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="tabs-container">
        <div className="tab-buttons">
          <button onClick={() => setActiveTab('overview')} className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}>📊 Platform Overview</button>
          <button onClick={() => setActiveTab('volunteers')} className={`tab-btn ${activeTab === 'volunteers' ? 'active' : ''}`}>👥 Volunteers Directory</button>
          <button onClick={() => setActiveTab('events')} className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}>📅 Events Setup</button>
          <button onClick={() => setActiveTab('applications')} className={`tab-btn ${activeTab === 'applications' ? 'active' : ''}`}>🔔 Application Queue ({registrations.filter(r => r.status === 'pending').length})</button>
          <button onClick={() => setActiveTab('reports')} className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}>📈 Reports & Statistics</button>
        </div>

        {loading && activeTab !== 'reports' ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Syncing records...</div>
        ) : (
          <div>
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Active Shift Workforces</h3>
                  <div className="table-wrapper">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Event Name</th>
                          <th>Date</th>
                          <th>Staffing Status</th>
                          <th>Activity Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {events.slice(0, 5).map(e => (
                          <tr key={e._id}>
                            <td style={{ fontWeight: 'bold' }}>{e.title}</td>
                            <td>{e.date}</td>
                            <td>👥 {e.currentVolunteers || 0} / {e.maxVolunteers} Joined</td>
                            <td>
                              <span className={`event-badge ${e.status === 'open' ? 'badge-open' : 'badge-closed'}`}>
                                {e.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="glass-card">
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Admin Shortcuts</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <button onClick={() => setShowCreateEvent(true)} className="btn btn-primary" style={{ width: '100%' }}>
                      ➕ Create New Shift Event
                    </button>
                    <button onClick={handleDownloadCSV} className="btn btn-secondary" style={{ width: '100%' }}>
                      📥 Download Complete Volunteer CSV
                    </button>
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                      <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>SYSTEM CONFIG</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <strong>Active Database:</strong> {stats?.metrics ? 'Operational' : 'Unavailable'}<br />
                        <strong>File Fallback Active:</strong> {stats?.metrics?.totalVolunteers !== undefined ? 'Yes (Local Database Enabled)' : 'Checking...'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VOLUNTEERS TAB */}
            {activeTab === 'volunteers' && (
              <div>
                <div className="search-bar-container">
                  <div className="search-input-wrapper">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Search by name or email..."
                      value={searchVol}
                      onChange={(e) => setSearchVol(e.target.value)}
                    />
                  </div>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Filter by skill..."
                    style={{ maxWidth: '200px' }}
                    value={filterSkill}
                    onChange={(e) => setFilterSkill(e.target.value)}
                  />
                  <select
                    className="filter-select"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="">All Verification Statuses</option>
                    <option value="verified">Verified Only</option>
                    <option value="pending">Pending Only</option>
                  </select>
                </div>

                <div className="table-wrapper">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Volunteer</th>
                        <th>Skills</th>
                        <th>Availability</th>
                        <th>Hours Logged</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredVolunteers().length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                            No volunteers match the filters.
                          </td>
                        </tr>
                      ) : (
                        getFilteredVolunteers().map(vol => (
                          <tr key={vol._id}>
                            <td>
                              <div className="volunteer-cell">
                                <div className="avatar-initials">
                                  {vol.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="volunteer-name">{vol.name}</div>
                                  <div className="volunteer-email">{vol.email}</div>
                                  {vol.phone && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📞 {vol.phone}</div>}
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="skills-list" style={{ maxWidth: '280px' }}>
                                {vol.skills && vol.skills.length > 0 ? (
                                  vol.skills.map((s, i) => <span key={i} className="skill-tag">{s}</span>)
                                ) : (
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>None entered</span>
                                )}
                              </div>
                            </td>
                            <td>{vol.availability}</td>
                            <td style={{ fontWeight: 'bold' }}>{vol.hoursVolunteered || 0} hrs</td>
                            <td>
                              <span className={`event-badge ${vol.isVerified ? 'badge-approved' : 'badge-pending'}`}>
                                {vol.isVerified ? 'Verified' : 'Pending'}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                  onClick={() => handleToggleVerify(vol._id, vol.isVerified)}
                                  className={`btn btn-outline btn-sm`}
                                  style={{
                                    borderColor: vol.isVerified ? 'var(--warning-color)' : 'var(--success-color)',
                                    color: vol.isVerified ? 'var(--warning-color)' : 'var(--success-color)'
                                  }}
                                >
                                  {vol.isVerified ? 'Revoke Verify' : 'Verify User'}
                                </button>
                                <button
                                  onClick={() => {
                                    setShowEditHours(vol);
                                    setCustomHours(vol.hoursVolunteered || 0);
                                  }}
                                  className="btn btn-outline btn-sm"
                                >
                                  ✏️ Edit Hours
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* EVENTS TAB */}
            {activeTab === 'events' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                  <button onClick={() => setShowCreateEvent(true)} className="btn btn-primary">
                    ➕ Create & Post New Event
                  </button>
                </div>

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
                      
                      <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <span className="event-capacity">👥 {event.currentVolunteers || 0} / {event.maxVolunteers} Staffed</span>
                          <span className={`event-badge ${event.status === 'open' ? 'badge-open' : 'badge-closed'}`}>{event.status}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleToggleEventStatus(event._id, event.status)}
                            className="btn btn-outline btn-sm"
                          >
                            ⚙️ Mark {event.status === 'open' ? 'Completed' : 'Open'}
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(event._id)}
                            className="btn btn-outline btn-sm"
                            style={{ color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }}
                          >
                            🗑️ Delete Event
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* APPLICATIONS QUEUE TAB */}
            {activeTab === 'applications' && (
              <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Pending Applications Queue</h3>
                <div className="table-wrapper" style={{ marginBottom: '3rem' }}>
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Volunteer</th>
                        <th>Event Title</th>
                        <th>Event Date</th>
                        <th>Application Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrations.filter(r => r.status === 'pending').length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                            All caught up! No pending registrations.
                          </td>
                        </tr>
                      ) : (
                        registrations.filter(r => r.status === 'pending').map(reg => (
                          <tr key={reg._id}>
                            <td>
                              <div style={{ fontWeight: 'bold' }}>{reg.volunteer.name}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{reg.volunteer.email}</div>
                            </td>
                            <td style={{ fontWeight: '600' }}>{reg.event.title}</td>
                            <td>📅 {reg.event.date}</td>
                            <td>{new Date(reg.registrationDate).toLocaleDateString()}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                  onClick={() => handleReviewApplication(reg._id, 'approved')}
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '0.35rem 0.75rem' }}
                                >
                                  ✓ Approve
                                </button>
                                <button
                                  onClick={() => handleReviewApplication(reg._id, 'rejected')}
                                  className="btn btn-outline btn-sm"
                                  style={{ color: 'var(--danger-color)', borderColor: 'var(--danger-color)', padding: '0.35rem 0.75rem' }}
                                >
                                  &times; Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Approved Staff Shifts & Attendance</h3>
                <div className="table-wrapper">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Volunteer</th>
                        <th>Event Title</th>
                        <th>Shift Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrations.filter(r => r.status !== 'pending').length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                            No approved or finalized registrations records.
                          </td>
                        </tr>
                      ) : (
                        registrations.filter(r => r.status !== 'pending').map(reg => (
                          <tr key={reg._id}>
                            <td>
                              <div style={{ fontWeight: 'bold' }}>{reg.volunteer.name}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{reg.volunteer.email}</div>
                            </td>
                            <td>{reg.event.title}</td>
                            <td>{reg.event.date}</td>
                            <td>
                              <span className={`event-badge ${reg.status === 'approved' ? 'badge-approved' : reg.status === 'rejected' ? 'badge-rejected' : 'badge-attended'}`}>
                                {reg.status}
                              </span>
                            </td>
                            <td>
                              {reg.status === 'approved' ? (
                                <button
                                  onClick={() => {
                                    setAwardHoursTarget(reg._id);
                                    setAwardHours(4); // default credit
                                  }}
                                  className="btn btn-primary btn-sm"
                                >
                                  ✓ Record Attendance
                                </button>
                              ) : reg.status === 'attended' ? (
                                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--success-color)' }}>
                                  ⭐ Completed ({reg.hoursCredited} hrs awarded)
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Finalized</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* REPORTS & STATISTICS TAB */}
            {activeTab === 'reports' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <h3 style={{ fontSize: '1.25rem' }}>Metrics Analysis Reports</h3>
                  <button onClick={handleDownloadCSV} className="btn btn-secondary">
                    📥 Export Volunteers to CSV
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  {/* Skill Distribution chart using CSS bar chart styles */}
                  <div className="glass-card">
                    <h4 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Volunteers Skill Pool Distribution</h4>
                    {stats?.skillDistribution && Object.keys(stats.skillDistribution).length > 0 ? (
                      <div className="chart-container">
                        {Object.entries(stats.skillDistribution)
                          .sort((a, b) => b[1] - a[1])
                          .map(([skill, count]) => {
                            // Calculate simple percentage width max is 10 count
                            const maxVal = Math.max(...Object.values(stats.skillDistribution), 1);
                            const widthPercent = (count / maxVal) * 100;
                            return (
                              <div key={skill} className="chart-bar-row">
                                <span className="chart-bar-label" title={skill}>{skill}</span>
                                <div className="chart-bar-track">
                                  <div className="chart-bar-fill" style={{ width: `${widthPercent}%` }} />
                                </div>
                                <span className="chart-bar-value">{count}</span>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                        No volunteer skills registered to display.
                      </p>
                    )}
                  </div>

                  {/* Summary Breakdown Text */}
                  <div className="glass-card">
                    <h4 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Account Verification Matrix</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                        <span>Total Registered Volunteers</span>
                        <span style={{ fontWeight: 'bold' }}>{stats?.metrics?.totalVolunteers || 0}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                        <span>Verified Account Base</span>
                        <span style={{ fontWeight: 'bold', color: 'var(--success-color)' }}>{stats?.metrics?.verifiedVolunteers || 0}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                        <span>Pending Verification Reviews</span>
                        <span style={{ fontWeight: 'bold', color: 'var(--warning-color)' }}>{stats?.metrics?.pendingVolunteers || 0}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                        <span>Total Scheduled Projects</span>
                        <span style={{ fontWeight: 'bold' }}>{stats?.metrics?.totalEvents || 0}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem' }}>
                        <span>Total Hours Logged Across App</span>
                        <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{stats?.metrics?.totalHours || 0} hrs</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CREATE EVENT MODAL DIALOG */}
      {showCreateEvent && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem' }}>Create Volunteer Shift / Event</h3>
              <button onClick={() => setShowCreateEvent(false)} className="close-btn">&times;</button>
            </div>
            <form onSubmit={handleCreateEvent}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Event Title</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="e.g. Food Drive Coordination"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    style={{ resize: 'vertical', minHeight: '80px' }}
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Summarize key goals and responsibilities..."
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Shift Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Volunteers</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newEvent.maxVolunteers}
                      onChange={(e) => setNewEvent({ ...newEvent, maxVolunteers: Number(e.target.value) })}
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    placeholder="e.g. Downtown Central Center"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Required Skills (Comma separated list)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newEvent.requiredSkills}
                    onChange={(e) => setNewEvent({ ...newEvent, requiredSkills: e.target.value })}
                    placeholder="e.g. Logistics, Heavy Lifting, Tutoring"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowCreateEvent(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-primary">Publish Shift</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANUAL HOURS ADJUSTMENT DIALOG */}
      {showEditHours && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem' }}>Edit Volunteer Hours</h3>
              <button onClick={() => setShowEditHours(null)} className="close-btn">&times;</button>
            </div>
            <form onSubmit={handleUpdateHours}>
              <div className="modal-body">
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  Adjust the total volunteer hours record for <strong>{showEditHours.name}</strong>.
                </p>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Total Credited Hours</label>
                  <input
                    type="number"
                    className="form-input"
                    value={customHours}
                    onChange={(e) => setCustomHours(Number(e.target.value))}
                    min="0"
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowEditHours(null)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-primary">Update Hours</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD ATTENDANCE DIALOG (AWARD HOURS ON SHIFT ATTENDED) */}
      {awardHoursTarget && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem' }}>Award Volunteer Hours</h3>
              <button onClick={() => setAwardHoursTarget(null)} className="close-btn">&times;</button>
            </div>
            <form onSubmit={handleMarkAttended}>
              <div className="modal-body">
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  Set the hours credited to this volunteer for completing this shift.
                </p>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Hours to Credit</label>
                  <input
                    type="number"
                    className="form-input"
                    value={awardHours}
                    onChange={(e) => setAwardHours(Number(e.target.value))}
                    min="1"
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setAwardHoursTarget(null)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-secondary">Record & Credit Hours</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
