import { useState } from 'react';
import { useAppStore } from '../App';

export default function Sessions() {
  const { data, currentUser, store: s } = useAppStore();
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    meetLink: '',
  });

  const sessions = (data.sessions || []);
  const now = new Date();

  const upcoming = sessions
    .filter(e => new Date(`${e.date}T${e.time || '00:00'}`) >= now)
    .sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`) - new Date(`${b.date}T${b.time || '00:00'}`));

  const past = sessions
    .filter(e => new Date(`${e.date}T${e.time || '00:00'}`) < now)
    .sort((a, b) => new Date(`${b.date}T${b.time || '00:00'}`) - new Date(`${a.date}T${a.time || '00:00'}`));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date || !form.time) return;
    s.addSession({
      id: Date.now().toString(),
      createdBy: currentUser.id,
      title: form.title.trim(),
      description: form.description.trim(),
      date: form.date,
      time: form.time,
      meetLink: form.meetLink.trim(),
    });
    setForm({ title: '', description: '', date: '', time: '', meetLink: '' });
    setShowNew(false);
  };

  const formatDate = (date) => {
    return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (time) => {
    const [h, m] = time.split(':');
    const dt = new Date();
    dt.setHours(parseInt(h), parseInt(m));
    return dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const handleDelete = (sessionId) => {
    if (confirm('Remove this session?')) {
      s.deleteSession(sessionId);
    }
  };

  return (
    <div className="sessions-page">
      <div className="page-header">
        <div>
          <h1>Circle Sessions</h1>
          <p className="page-subtitle">Our SEP program meetings and learning sessions.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowNew(!showNew)}>
          {showNew ? 'Cancel' : 'Add Session'}
        </button>
      </div>

      {showNew && (
        <form className="new-session-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Session title (e.g. 'Module 3: Leadership & Innovation')"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            required
          />
          <textarea
            placeholder="Description (optional) — topic, speakers, what to prepare..."
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            rows={3}
          />
          <div className="form-row">
            <label className="form-field">
              <span>Date</span>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
            </label>
            <label className="form-field">
              <span>Time</span>
              <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} required />
            </label>
          </div>
          <input
            type="url"
            placeholder="Google Meet link (optional)"
            value={form.meetLink}
            onChange={e => setForm({ ...form, meetLink: e.target.value })}
          />
          <button type="submit" className="btn-primary">Add Session</button>
        </form>
      )}

      {upcoming.length === 0 && !showNew && (
        <div className="empty-state">
          <p>No upcoming sessions scheduled.</p>
          <p>Add the next one so the Circle stays in sync.</p>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="sessions-list">
          {upcoming.map(session => {
            const creator = data.users.find(u => u.id === session.createdBy);
            const isMine = session.createdBy === currentUser.id;
            return (
              <div key={session.id} className="session-card">
                <div className="session-date-block">
                  <span className="session-month">{new Date(session.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}</span>
                  <span className="session-day">{new Date(session.date + 'T00:00:00').getDate()}</span>
                  <span className="session-weekday">{new Date(session.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}</span>
                </div>
                <div className="session-details">
                  <h3 className="session-title">{session.title}</h3>
                  <p className="session-time">{formatDate(session.date)} at {formatTime(session.time)}</p>
                  {session.description && <p className="session-description">{session.description}</p>}
                  <div className="session-footer">
                    <span className="session-added-by">
                      <img src={creator?.avatar} alt="" className="session-creator-avatar" />
                      Added by {creator?.name?.split(' ')[0]}
                    </span>
                    <div className="session-actions">
                      {session.meetLink && (
                        <a href={session.meetLink} target="_blank" rel="noopener noreferrer" className="session-join-btn">
                          Join Meeting
                        </a>
                      )}
                      {isMine && (
                        <button className="postcard-btn danger" onClick={() => handleDelete(session.id)}>Remove</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {past.length > 0 && (
        <div className="past-sessions">
          <h3>Past Sessions</h3>
          <div className="sessions-list past">
            {past.map(session => {
              const creator = data.users.find(u => u.id === session.createdBy);
              return (
                <div key={session.id} className="session-card past">
                  <div className="session-date-block">
                    <span className="session-month">{new Date(session.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}</span>
                    <span className="session-day">{new Date(session.date + 'T00:00:00').getDate()}</span>
                  </div>
                  <div className="session-details">
                    <h3 className="session-title">{session.title}</h3>
                    <p className="session-time">{formatDate(session.date)} at {formatTime(session.time)}</p>
                    {session.description && <p className="session-description">{session.description}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
