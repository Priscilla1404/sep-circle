import { useState } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { useStore } from '../lib/useStore';

export default function Profile() {
  const { userId } = useParams();
  const { data, currentUser, store: s } = useStore();
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoCaption, setNewPhotoCaption] = useState('');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  const user = data.users.find(u => u.id === userId);
  if (!user) return <div className="page-center"><p>User not found.</p></div>;

  const isMe = currentUser.id === userId;
  const userPostcards = data.postcards.filter(p => p.userId === userId);
  const userBooks = data.books.filter(b => b.userId === userId);
  const albumPhotos = data.personalAlbums[userId] || [];

  const startEditing = () => {
    setEditForm({
      name: user.name,
      title: user.title,
      company: user.company,
      city: user.city,
      country: user.country,
      bio: user.bio,
    });
    setEditing(true);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    s.updateProfile(userId, editForm);
    setEditing(false);
  };

  const handleAddPhoto = (e) => {
    e.preventDefault();
    if (!newPhotoUrl.trim()) return;
    s.addAlbumPhoto(userId, {
      id: Date.now().toString(),
      url: newPhotoUrl.trim(),
      caption: newPhotoCaption.trim(),
      date: new Date().toISOString().split('T')[0],
    });
    setNewPhotoUrl('');
    setNewPhotoCaption('');
  };

  return (
    <div className="profile-page">
      {/* Profile Header */}
      <div className="profile-header">
        <img src={user.avatar} alt="" className="profile-avatar" />
        {editing ? (
          <form className="profile-edit-form" onSubmit={handleSaveProfile}>
            <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder="Full name" className="edit-input" />
            <input type="text" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} placeholder="Title / Role" className="edit-input" />
            <input type="text" value={editForm.company} onChange={e => setEditForm({ ...editForm, company: e.target.value })} placeholder="Company (optional)" className="edit-input" />
            <div className="edit-row">
              <input type="text" value={editForm.city} onChange={e => setEditForm({ ...editForm, city: e.target.value })} placeholder="City" className="edit-input" />
              <input type="text" value={editForm.country} onChange={e => setEditForm({ ...editForm, country: e.target.value })} placeholder="Country" className="edit-input" />
            </div>
            <textarea value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })} placeholder="Short bio — tell your circle about yourself" className="edit-textarea" rows={3} />
            <div className="edit-actions">
              <button type="submit" className="btn-primary btn-sm">Save</button>
              <button type="button" className="btn-secondary btn-sm" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <div className="profile-info">
            <div className="profile-name-row">
              <h1 className="profile-name">{user.name}</h1>
              {isMe && <button className="edit-profile-btn" onClick={startEditing}>Edit profile</button>}
            </div>
            <p className="profile-title">{user.title}{user.title && user.company ? ' at ' : ''}{user.company}</p>
            <p className="profile-location">📍 {user.city}, {user.country}</p>
            <p className="profile-session">{user.session}</p>
            {user.bio && <p className="profile-bio">{user.bio}</p>}
            {isMe && !user.bio && <p className="profile-bio-hint">Tap "Edit profile" to add a bio and let others know about you.</p>}
          </div>
        )}
      </div>

      {/* Personal Album */}
      <section className="profile-section">
        <div className="section-header">
          <h2>Personal Album</h2>
          <span className="album-count">{albumPhotos.length} photo{albumPhotos.length !== 1 ? 's' : ''}</span>
        </div>

        {isMe && (
          <form className="add-photo-form" onSubmit={handleAddPhoto}>
            <input type="url" placeholder="Photo URL" value={newPhotoUrl} onChange={e => setNewPhotoUrl(e.target.value)} required />
            <input type="text" placeholder="Caption (optional)" value={newPhotoCaption} onChange={e => setNewPhotoCaption(e.target.value)} />
            <button type="submit" className="btn-primary btn-sm">Add Photo</button>
          </form>
        )}

        {albumPhotos.length > 0 ? (
          <div className="album-grid">
            {albumPhotos.map(photo => (
              <div key={photo.id} className="album-photo">
                <img src={photo.url} alt={photo.caption} />
                {photo.caption && <p className="album-caption">{photo.caption}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">
            {isMe
              ? 'Share photos of your life, family, and travels with your SEP Circle.'
              : `${user.name.split(' ')[0]} hasn't added photos yet.`}
          </p>
        )}
      </section>

      {/* Postcards by this user */}
      {userPostcards.length > 0 && (
        <section className="profile-section">
          <h2>Postcards</h2>
          <div className="profile-postcards">
            {userPostcards.map(p => (
              <div key={p.id} className="mini-postcard">
                <img src={p.imageUrl} alt="" />
                <p>{p.caption}</p>
                <span className="mini-stamp">{p.city} — {new Date(p.date).toLocaleDateString('en-US', { month: 'short' })}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Books recommended by this user */}
      {userBooks.length > 0 && (
        <section className="profile-section">
          <h2>Book Recommendations</h2>
          <div className="profile-books">
            {userBooks.map(b => (
              <NavLink to="/books" key={b.id} className="mini-book">
                <img src={b.coverUrl} alt={b.title} className="mini-book-cover" />
                <div>
                  <span className="mini-book-title">{b.title}</span>
                  <span className="mini-book-author">{b.author}</span>
                </div>
              </NavLink>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
