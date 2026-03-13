import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useStore } from '../lib/useStore';

export default function NearMe() {
  const { data, currentUser, store: s } = useStore();
  const [searchCity, setSearchCity] = useState('');
  const [editingLocation, setEditingLocation] = useState(false);
  const [newCity, setNewCity] = useState(currentUser.city);
  const [newCountry, setNewCountry] = useState(currentUser.country);

  const otherUsers = data.users.filter(u => u.id !== currentUser.id);

  const sameCity = otherUsers.filter(u =>
    u.city.toLowerCase() === currentUser.city.toLowerCase()
  );

  const sameCountry = otherUsers.filter(u =>
    u.country.toLowerCase() === currentUser.country.toLowerCase() &&
    u.city.toLowerCase() !== currentUser.city.toLowerCase()
  );

  const searchResults = searchCity.trim()
    ? otherUsers.filter(u =>
        u.city.toLowerCase().includes(searchCity.toLowerCase()) ||
        u.country.toLowerCase().includes(searchCity.toLowerCase())
      )
    : [];

  const handleUpdateLocation = (e) => {
    e.preventDefault();
    s.updateUserCity(currentUser.id, newCity, newCountry);
    setEditingLocation(false);
  };

  // Group all users by city
  const byCity = {};
  data.users.forEach(u => {
    const key = `${u.city}, ${u.country}`;
    if (!byCity[key]) byCity[key] = [];
    byCity[key].push(u);
  });

  return (
    <div className="nearby-page">
      <div className="page-header">
        <div>
          <h1>People Near Me</h1>
          <p className="page-subtitle">Find your SEP Circle members around the world.</p>
        </div>
      </div>

      <div className="my-location-card">
        <div className="my-location-info">
          <span className="location-pin">📍</span>
          {editingLocation ? (
            <form className="edit-location-form" onSubmit={handleUpdateLocation}>
              <input type="text" value={newCity} onChange={e => setNewCity(e.target.value)} placeholder="City" required />
              <input type="text" value={newCountry} onChange={e => setNewCountry(e.target.value)} placeholder="Country" required />
              <button type="submit" className="btn-primary btn-sm">Update</button>
              <button type="button" className="btn-secondary btn-sm" onClick={() => setEditingLocation(false)}>Cancel</button>
            </form>
          ) : (
            <>
              <span className="my-location-text">You're in <strong>{currentUser.city}, {currentUser.country}</strong></span>
              <button className="btn-secondary btn-sm" onClick={() => setEditingLocation(true)}>Update location</button>
            </>
          )}
        </div>
        {!editingLocation && currentUser.city && (
          <p className="travel-nudge">Send a postcard from {currentUser.city}!</p>
        )}
      </div>

      <div className="search-location">
        <input
          type="text"
          placeholder="Search for a city or country..."
          value={searchCity}
          onChange={e => setSearchCity(e.target.value)}
          className="search-input"
        />
      </div>

      {searchCity.trim() && (
        <div className="nearby-section">
          <h2>Search Results</h2>
          {searchResults.length === 0 ? (
            <p className="empty-state">No one found in "{searchCity}"</p>
          ) : (
            <div className="people-grid">
              {searchResults.map(user => (
                <NavLink to={`/profile/${user.id}`} key={user.id} className="person-card">
                  <img src={user.avatar} alt="" className="person-avatar" />
                  <div className="person-info">
                    <span className="person-name">{user.name}</span>
                    <span className="person-location">{user.city}, {user.country}</span>
                    <span className="person-role">{user.title}</span>
                  </div>
                </NavLink>
              ))}
            </div>
          )}
        </div>
      )}

      {!searchCity.trim() && (
        <>
          {sameCity.length > 0 && (
            <div className="nearby-section">
              <h2>In {currentUser.city} with you</h2>
              <div className="people-grid">
                {sameCity.map(user => (
                  <NavLink to={`/profile/${user.id}`} key={user.id} className="person-card">
                    <img src={user.avatar} alt="" className="person-avatar" />
                    <div className="person-info">
                      <span className="person-name">{user.name}</span>
                      <span className="person-role">{user.title}, {user.company}</span>
                    </div>
                  </NavLink>
                ))}
              </div>
            </div>
          )}

          {sameCountry.length > 0 && (
            <div className="nearby-section">
              <h2>Also in {currentUser.country}</h2>
              <div className="people-grid">
                {sameCountry.map(user => (
                  <NavLink to={`/profile/${user.id}`} key={user.id} className="person-card">
                    <img src={user.avatar} alt="" className="person-avatar" />
                    <div className="person-info">
                      <span className="person-name">{user.name}</span>
                      <span className="person-location">{user.city}</span>
                      <span className="person-role">{user.title}, {user.company}</span>
                    </div>
                  </NavLink>
                ))}
              </div>
            </div>
          )}

          <div className="nearby-section">
            <h2>Everyone, by city</h2>
            <div className="city-groups">
              {Object.entries(byCity).sort((a, b) => b[1].length - a[1].length).map(([city, members]) => (
                <div key={city} className="city-group">
                  <h3 className="city-name">{city} <span className="city-count">({members.length})</span></h3>
                  <div className="city-members">
                    {members.map(user => (
                      <NavLink to={`/profile/${user.id}`} key={user.id} className="city-member">
                        <img src={user.avatar} alt="" className="city-member-avatar" />
                        <span>{user.name.split(' ')[0]}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
