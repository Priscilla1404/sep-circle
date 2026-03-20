import { useState } from 'react';
import { useAppStore } from '../App';

export default function TravelTracker() {
  const { data, currentUser, store: s } = useAppStore();
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    city: '',
    country: '',
    dateFrom: '',
    dateTo: '',
    note: '',
  });

  const trips = (data.travelPlans || []).sort((a, b) => new Date(a.dateFrom) - new Date(b.dateFrom));

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const upcoming = trips.filter(t => new Date(t.dateTo || t.dateFrom) >= now);
  const past = trips.filter(t => new Date(t.dateTo || t.dateFrom) < now);

  // Find overlaps: other people in the same city during overlapping dates
  const findOverlaps = (trip) => {
    return upcoming.filter(t => {
      if (t.userId === trip.userId && t.id === trip.id) return false;
      if (t.city.toLowerCase() !== trip.city.toLowerCase()) return false;
      const aStart = new Date(trip.dateFrom);
      const aEnd = new Date(trip.dateTo || trip.dateFrom);
      const bStart = new Date(t.dateFrom);
      const bEnd = new Date(t.dateTo || t.dateFrom);
      return aStart <= bEnd && bStart <= aEnd;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.city.trim() || !form.dateFrom) return;
    s.addTravelPlan({
      id: Date.now().toString(),
      userId: currentUser.id,
      city: form.city.trim(),
      country: form.country.trim(),
      dateFrom: form.dateFrom,
      dateTo: form.dateTo || form.dateFrom,
      note: form.note.trim(),
    });
    setForm({ city: '', country: '', dateFrom: '', dateTo: '', note: '' });
    setShowNew(false);
  };

  const handleDelete = (tripId) => {
    if (confirm('Remove this trip?')) {
      s.deleteTravelPlan(tripId);
    }
  };

  const formatDateRange = (from, to) => {
    const opts = { month: 'short', day: 'numeric' };
    const start = new Date(from + 'T00:00:00').toLocaleDateString('en-US', opts);
    if (!to || to === from) return start;
    const end = new Date(to + 'T00:00:00').toLocaleDateString('en-US', opts);
    return `${start} – ${end}`;
  };

  return (
    <div className="travel-tracker-page">
      <div className="page-header">
        <div>
          <h1>Travel Tracker</h1>
          <p className="page-subtitle">Share where you're headed — you might cross paths with someone from the Circle.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowNew(!showNew)}>
          {showNew ? 'Cancel' : 'Add a Trip'}
        </button>
      </div>

      {showNew && (
        <form className="new-travel-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label className="form-field">
              <span>City</span>
              <input
                type="text"
                placeholder="e.g. Tokyo"
                value={form.city}
                onChange={e => setForm({ ...form, city: e.target.value })}
                required
              />
            </label>
            <label className="form-field">
              <span>Country</span>
              <input
                type="text"
                placeholder="e.g. Japan"
                value={form.country}
                onChange={e => setForm({ ...form, country: e.target.value })}
              />
            </label>
          </div>
          <div className="form-row">
            <label className="form-field">
              <span>From</span>
              <input type="date" value={form.dateFrom} onChange={e => setForm({ ...form, dateFrom: e.target.value })} required />
            </label>
            <label className="form-field">
              <span>To</span>
              <input type="date" value={form.dateTo} onChange={e => setForm({ ...form, dateTo: e.target.value })} />
            </label>
          </div>
          <input
            type="text"
            placeholder="Note (optional) — e.g. 'Would love to grab coffee!'"
            value={form.note}
            onChange={e => setForm({ ...form, note: e.target.value })}
            maxLength={200}
          />
          <button type="submit" className="btn-primary">Add Trip</button>
        </form>
      )}

      {upcoming.length === 0 && !showNew && (
        <div className="empty-state">
          <p>No upcoming trips shared yet.</p>
          <p>Be the first to share where you're going!</p>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="travel-list">
          {upcoming.map(trip => {
            const user = data.users.find(u => u.id === trip.userId);
            const isMine = trip.userId === currentUser.id;
            const overlaps = findOverlaps(trip);
            return (
              <div key={trip.id} className="travel-card">
                <div className="travel-card-left">
                  <div className="travel-location">
                    <span className="travel-city">{trip.city}</span>
                    {trip.country && <span className="travel-country">{trip.country}</span>}
                  </div>
                  <div className="travel-dates">{formatDateRange(trip.dateFrom, trip.dateTo)}</div>
                </div>
                <div className="travel-card-center">
                  <div className="travel-person">
                    <img src={user?.avatar} alt="" className="travel-avatar" />
                    <span className="travel-name">{user?.name}</span>
                  </div>
                  {trip.note && <p className="travel-note">{trip.note}</p>}
                  {overlaps.length > 0 && (
                    <div className="travel-overlap">
                      <span className="overlap-label">Also there:</span>
                      {overlaps.map(o => {
                        const oUser = data.users.find(u => u.id === o.userId);
                        return (
                          <span key={o.id} className="overlap-person">
                            <img src={oUser?.avatar} alt="" className="overlap-avatar" />
                            {oUser?.name?.split(' ')[0]}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
                {isMine && (
                  <div className="travel-card-right">
                    <button className="owner-btn danger" onClick={() => handleDelete(trip.id)}>Remove</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {past.length > 0 && (
        <div className="past-trips">
          <h3>Past Trips</h3>
          <div className="travel-list past">
            {past.map(trip => {
              const user = data.users.find(u => u.id === trip.userId);
              return (
                <div key={trip.id} className="travel-card past">
                  <div className="travel-card-left">
                    <div className="travel-location">
                      <span className="travel-city">{trip.city}</span>
                      {trip.country && <span className="travel-country">{trip.country}</span>}
                    </div>
                    <div className="travel-dates">{formatDateRange(trip.dateFrom, trip.dateTo)}</div>
                  </div>
                  <div className="travel-card-center">
                    <div className="travel-person">
                      <img src={user?.avatar} alt="" className="travel-avatar" />
                      <span className="travel-name">{user?.name}</span>
                    </div>
                    {trip.note && <p className="travel-note">{trip.note}</p>}
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
