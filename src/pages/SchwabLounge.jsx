import { useState } from 'react';
import { useAppStore } from '../App';

export default function SchwabLounge() {
  const { data, currentUser, store: s } = useAppStore();
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    meetLink: '',
  });

  const now = new Date();

  const upcoming = data.loungeEvents
    .filter(e => new Date(`${e.date}T${e.time}`) >= now)
    .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

  const past = data.loungeEvents
    .filter(e => new Date(`${e.date}T${e.time}`) < now)
    .sort((a, b) => new Date(`${b.date}T${b.time}`) - new Date(`${a.date}T${a.time}`));

  const generateMeetLink = () => {
    const code = Math.random().toString(36).substring(2, 5) + '-' +
      Math.random().toString(36).substring(2, 6) + '-' +
      Math.random().toString(36).substring(2, 5);
    setForm({ ...form, meetLink: `https://meet.google.com/${code}` });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date || !form.time) return;
    s.addLoungeEvent({
      id: Date.now().toString(),
      createdBy: currentUser.id,
      title: form.title.trim(),
      description: form.description.trim(),
      date: form.date,
      time: form.time,
      meetLink: form.meetLink.trim(),
      attendees: [currentUser.id],
    });
    setForm({ title: '', description: '', date: '', time: '', meetLink: '' });
    setShowNew(false);
  };

  const toggleAttendance = (eventId) => {
    if (s.toggleEventAttendance) {
      s.toggleEventAttendance(eventId, currentUser.id);
    } else {
      // localStorage fallback
      s.update(d => ({
        ...d,
        loungeEvents: d.loungeEvents.map(e => {
          if (e.id !== eventId) return e;
          const attending = e.attendees.includes(currentUser.id);
          return {
            ...e,
            attendees: attending
              ? e.attendees.filter(id => id !== currentUser.id)
              : [...e.attendees, currentUser.id],
          };
        }),
      }));
    }
  };

  const formatDateTime = (date, time) => {
    const dt = new Date(`${date}T${time}`);
    return dt.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) + ' at ' + dt.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="lounge-page">
      <div className="lounge-hero">
        <div className="lounge-hero-content">
          <h1>Schwab Lounge</h1>
          <p className="lounge-tagline">When missing our late nights, endless chats, and best laughs...</p>
        </div>
      </div>

      <div className="lounge-content">
        <div className="page-header">
          <div>
            <h2>Upcoming Get-Togethers</h2>
            <p className="page-subtitle">Schedule a virtual coffee, a topic discussion, or just a hangout.</p>
          </div>
          <button className="btn-primary" onClick={() => setShowNew(!showNew)}>
            {showNew ? 'Cancel' : 'Host a Get-Together'}
          </button>
        </div>

        {showNew && (
          <form className="new-lounge-form" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="What's the occasion? (e.g., 'Friday Coffee Chat', 'AI Discussion')"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              required
            />
            <textarea
              placeholder="Description (optional) — what will you talk about?"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={2}
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
            <div className="meet-link-row">
              <input
                type="url"
                placeholder="Google Meet link"
                value={form.meetLink}
                onChange={e => setForm({ ...form, meetLink: e.target.value })}
              />
              <button type="button" className="btn-secondary btn-sm" onClick={generateMeetLink}>
                Generate Meet link
              </button>
            </div>
            <p className="form-hint">Tip: You can also paste a Zoom or Teams link if you prefer.</p>
            <button type="submit" className="btn-primary">Create Get-Together</button>
          </form>
        )}

        {upcoming.length === 0 && !showNew && (
          <div className="lounge-empty">
            <p>No upcoming get-togethers yet.</p>
            <p>Be the first to host one — it only takes a minute.</p>
          </div>
        )}

        <div className="lounge-events">
          {upcoming.map(event => {
            const host = data.users.find(u => u.id === event.createdBy);
            const attending = event.attendees.includes(currentUser.id);
            const attendeeUsers = event.attendees.map(id => data.users.find(u => u.id === id)).filter(Boolean);
            return (
              <div key={event.id} className="lounge-event-card">
                <div className="event-datetime">
                  <span className="event-date">
                    {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <span className="event-time">{event.time}</span>
                </div>
                <div className="event-info">
                  <h3 className="event-title">{event.title}</h3>
                  {event.description && <p className="event-description">{event.description}</p>}
                  <div className="event-host">
                    <img src={host?.avatar} alt="" className="event-host-avatar" />
                    <span>Hosted by {host?.name?.split(' ')[0]}</span>
                  </div>
                  <div className="event-attendees">
                    <div className="attendee-avatars">
                      {attendeeUsers.slice(0, 6).map(u => (
                        <img key={u.id} src={u.avatar} alt={u.name} className="attendee-avatar" title={u.name} />
                      ))}
                      {attendeeUsers.length > 6 && <span className="more-attendees">+{attendeeUsers.length - 6}</span>}
                    </div>
                    <span className="attendee-count">{event.attendees.length} going</span>
                  </div>
                </div>
                <div className="event-actions">
                  <button
                    className={`attend-btn ${attending ? 'attending' : ''}`}
                    onClick={() => toggleAttendance(event.id)}
                  >
                    {attending ? "I'm going" : 'Join'}
                  </button>
                  {event.meetLink && (
                    <a href={event.meetLink} target="_blank" rel="noopener noreferrer" className="join-call-btn">
                      Join call
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {past.length > 0 && (
          <div className="past-events">
            <h3>Past Get-Togethers</h3>
            {past.map(event => {
              const host = data.users.find(u => u.id === event.createdBy);
              return (
                <div key={event.id} className="lounge-event-card past">
                  <div className="event-datetime">
                    <span className="event-date">{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="event-info">
                    <h3 className="event-title">{event.title}</h3>
                    <span className="event-host-text">Hosted by {host?.name?.split(' ')[0]} — {event.attendees.length} attended</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
