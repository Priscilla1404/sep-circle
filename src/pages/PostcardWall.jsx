import { useState, useMemo } from 'react';
import { useStore } from '../lib/useStore';

function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getWeeklySpotlight(postcards) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const recent = postcards.filter(p => new Date(p.date) >= oneWeekAgo);
  if (recent.length === 0) return postcards[0] || null;
  return recent[Math.floor(Math.random() * recent.length)];
}

function PostcardCard({ postcard, users, currentUser, onComment, isSpotlight }) {
  const [flipped, setFlipped] = useState(false);
  const [newComment, setNewComment] = useState('');
  const author = users.find(u => u.id === postcard.userId);

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

  return (
    <div className={`postcard ${flipped ? 'flipped' : ''} ${isSpotlight ? 'spotlight' : ''}`}>
      {isSpotlight && <div className="spotlight-badge">Postcard of the Week</div>}
      <div className="postcard-inner" onClick={() => setFlipped(!flipped)}>
        {/* Front */}
        <div className="postcard-front">
          <img src={postcard.imageUrl} alt="" className="postcard-image" />
          <div className="postcard-overlay">
            <p className="postcard-caption">{postcard.caption}</p>
            <div className="postcard-meta">
              <img src={author?.avatar} alt="" className="postcard-author-avatar" />
              <span className="postcard-author-name">{author?.name?.split(' ')[0]}</span>
              <span className="postcard-stamp">{postcard.city} — {new Date(postcard.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
          <div className="flip-hint">Tap to flip</div>
        </div>

        {/* Back */}
        <div className="postcard-back" onClick={e => e.stopPropagation()}>
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
    </div>
  );
}

export default function PostcardWall() {
  const { data, currentUser, store: s } = useStore();
  const [showNew, setShowNew] = useState(false);
  const [newCaption, setNewCaption] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');

  const spotlight = useMemo(() => getWeeklySpotlight(data.postcards), []);
  const shuffled = useMemo(() => {
    const rest = data.postcards.filter(p => p.id !== spotlight?.id);
    return shuffleArray(rest);
  }, [data.postcards.length]);

  const userPostsThisWeek = data.postcards.filter(p => {
    if (p.userId !== currentUser.id) return false;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return new Date(p.date) >= oneWeekAgo;
  }).length;

  const canPost = userPostsThisWeek < 3;

  const handleNewPostcard = (e) => {
    e.preventDefault();
    if (!newCaption.trim() || !newImageUrl.trim()) return;
    s.addPostcard({
      id: Date.now().toString(),
      userId: currentUser.id,
      imageUrl: newImageUrl.trim(),
      caption: newCaption.trim(),
      city: currentUser.city,
      country: currentUser.country,
      date: new Date().toISOString().split('T')[0],
      comments: [],
    });
    setNewCaption('');
    setNewImageUrl('');
    setShowNew(false);
  };

  return (
    <div className="postcard-wall-page">
      <div className="page-header">
        <div>
          <h1>The Postcard Wall</h1>
          <p className="page-subtitle">Moments from around the world, shared by your SEP Circle.</p>
        </div>
        <div className="postcard-actions">
          <span className="posts-remaining">{3 - userPostsThisWeek}/3 postcards this week</span>
          {canPost && (
            <button className="btn-primary" onClick={() => setShowNew(!showNew)}>
              {showNew ? 'Cancel' : 'Send a Postcard'}
            </button>
          )}
        </div>
      </div>

      {showNew && (
        <form className="new-postcard-form" onSubmit={handleNewPostcard}>
          <input
            type="url"
            placeholder="Image URL"
            value={newImageUrl}
            onChange={e => setNewImageUrl(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Write a caption (max 150 chars)"
            value={newCaption}
            onChange={e => setNewCaption(e.target.value)}
            maxLength={150}
            required
          />
          <p className="form-note">Stamped from: {currentUser.city}, {currentUser.country}</p>
          <button type="submit" className="btn-primary">Post Postcard</button>
        </form>
      )}

      <div className="postcard-mosaic">
        {spotlight && (
          <PostcardCard
            key={spotlight.id}
            postcard={spotlight}
            users={data.users}
            currentUser={currentUser}
            onComment={s.addPostcardComment}
            isSpotlight
          />
        )}
        {shuffled.map(postcard => (
          <PostcardCard
            key={postcard.id}
            postcard={postcard}
            users={data.users}
            currentUser={currentUser}
            onComment={s.addPostcardComment}
            isSpotlight={false}
          />
        ))}
      </div>
    </div>
  );
}
