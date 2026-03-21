import { useState, useRef } from 'react';
import { useAppStore } from '../App';
import { fileToDataUrl } from '../lib/imageUtils';

function Lightbox({ src, onClose }) {
  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose}>×</button>
      <img src={src} alt="" className="lightbox-image" onClick={e => e.stopPropagation()} />
    </div>
  );
}

function PostcardCard({ postcard, users, currentUser, onComment, onUpdate, onDelete, onOpenPhoto }) {
  const [flipped, setFlipped] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [editingCaption, setEditingCaption] = useState(false);
  const [editCaption, setEditCaption] = useState(postcard.caption);
  const author = users.find(u => u.id === postcard.userId);
  const isMine = postcard.userId === currentUser.id;

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onComment(postcard.id, {
      id: Date.now().toString(),
      userId: currentUser.id,
      text: newComment.trim(),
      date: new Date().toISOString().split('T')[0],
    });
    setNewComment('');
  };

  const handleSaveCaption = (e) => {
    e.stopPropagation();
    if (editCaption.trim()) {
      onUpdate(postcard.id, { caption: editCaption.trim() });
    }
    setEditingCaption(false);
  };

  return (
    <div className={`postcard ${flipped ? 'flipped' : ''}`}>
      {/* Front */}
      <div className="postcard-front">
        <div className="postcard-pin" />
        <img
          src={postcard.imageUrl}
          alt=""
          className="postcard-image"
          onClick={() => onOpenPhoto(postcard.imageUrl)}
          title="Click to enlarge"
        />
        <div className="postcard-info">
          {editingCaption ? (
            <div className="inline-edit">
              <input type="text" value={editCaption} onChange={e => setEditCaption(e.target.value)} maxLength={150} className="inline-edit-input" autoFocus />
              <button onClick={handleSaveCaption} className="inline-edit-save">Save</button>
              <button onClick={() => setEditingCaption(false)} className="inline-edit-cancel">Cancel</button>
            </div>
          ) : (
            postcard.caption && <p className="postcard-caption">{postcard.caption}</p>
          )}
          <div className="postcard-meta">
            <img src={author?.avatar} alt="" className="postcard-author-avatar" />
            <span className="postcard-author-name">{author?.name?.split(' ')[0]}</span>
            <span className="postcard-stamp">{postcard.city} — {new Date(postcard.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
          </div>
          <div className="postcard-buttons">
            <button className="postcard-btn" onClick={() => setFlipped(true)}>
              {postcard.comments.length > 0
                ? `${postcard.comments.length} comment${postcard.comments.length !== 1 ? 's' : ''}`
                : 'Comment'}
            </button>
            {isMine && !editingCaption && (
              <>
                <button className="postcard-btn" onClick={() => setEditingCaption(true)}>Edit</button>
                <button className="postcard-btn danger" onClick={() => { if (confirm('Delete this postcard?')) onDelete(postcard.id); }}>Delete</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Back */}
      <div className="postcard-back">
        <div className="postcard-back-header">
          <button className="flip-back-btn" onClick={() => setFlipped(false)}>← Back to photo</button>
          <span className="postcard-stamp-back">{postcard.city} — {new Date(postcard.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
        <div className="postcard-comments">
          {postcard.comments.length === 0 && (
            <p className="no-comments">No messages yet. Be the first to write on this postcard.</p>
          )}
          {postcard.comments.map(comment => {
            const commenter = users.find(u => u.id === comment.userId);
            return (
              <div key={comment.id} className="postcard-comment">
                <img src={commenter?.avatar} alt="" className="comment-avatar" />
                <div>
                  <span className="comment-author">{commenter?.name?.split(' ')[0]}</span>
                  <p className="comment-text">{comment.text}</p>
                </div>
              </div>
            );
          })}
        </div>
        <form className="comment-form" onSubmit={handleSubmitComment}>
          <input
            type="text"
            placeholder="Write on this postcard..."
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            maxLength={150}
          />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}

export default function PostcardWall() {
  const { data, currentUser, store: s } = useAppStore();
  const [showNew, setShowNew] = useState(false);
  const [newCaption, setNewCaption] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const fileInputRef = useRef(null);

  const sorted = [...data.postcards].sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setNewImageUrl(dataUrl);
    setImagePreview(dataUrl);
  };

  const handleNewPostcard = (e) => {
    e.preventDefault();
    if (!newCaption.trim() || !newImageUrl) return;
    s.addPostcard({
      id: Date.now().toString(),
      userId: currentUser.id,
      imageUrl: newImageUrl,
      caption: newCaption.trim(),
      city: currentUser.city,
      country: currentUser.country,
      date: new Date().toISOString().split('T')[0],
      comments: [],
    });
    setNewCaption('');
    setNewImageUrl('');
    setImagePreview(null);
    setShowNew(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="postcard-wall-page">
      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}

      <div className="page-header">
        <div>
          <h1>The Postcard Wall</h1>
          <p className="page-subtitle">Moments from around the world, shared by your SEP Circle.</p>
        </div>
        <div className="postcard-actions">
          <button className="btn-primary" onClick={() => setShowNew(!showNew)}>
            {showNew ? 'Cancel' : 'Send a Postcard'}
          </button>
        </div>
      </div>

      {showNew && (
        <form className="new-postcard-form" onSubmit={handleNewPostcard}>
          <label className="file-upload-label">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="file-input-hidden"
              required={!newImageUrl}
            />
            <span className="file-upload-btn">Choose a photo from your device</span>
          </label>
          {imagePreview && <img src={imagePreview} alt="Preview" className="upload-preview" />}
          <input
            type="text"
            placeholder="Write a caption (max 150 chars)"
            value={newCaption}
            onChange={e => setNewCaption(e.target.value)}
            maxLength={150}
            required
          />
          <p className="form-note">Stamped from: {currentUser.city}, {currentUser.country}</p>
          <button type="submit" className="btn-primary" disabled={!newImageUrl}>Post Postcard</button>
        </form>
      )}

      <div className="postcard-board">
        {sorted.map(postcard => (
          <PostcardCard
            key={postcard.id}
            postcard={postcard}
            users={data.users}
            currentUser={currentUser}
            onComment={s.addPostcardComment}
            onUpdate={s.updatePostcard}
            onDelete={s.deletePostcard}
            onOpenPhoto={setLightboxSrc}
          />
        ))}
      </div>

      {data.postcards.length === 0 && (
        <div className="empty-state">
          <p>The board is empty.</p>
          <p>Pin the first postcard from your travels!</p>
        </div>
      )}
    </div>
  );
}
