import { useState, useRef } from 'react';
import { useStore } from '../lib/useStore';
import { fileToDataUrl } from '../lib/imageUtils';

function BookCard({ book, users, currentUser, store: s }) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const author = users.find(u => u.id === book.userId);
  const wantsToRead = book.wantToRead.includes(currentUser.id);

  const handleComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    s.addBookComment(book.id, {
      id: Date.now().toString(),
      userId: currentUser.id,
      text: newComment.trim(),
      date: new Date().toISOString().split('T')[0],
    });
    setNewComment('');
  };

  return (
    <div className="book-card">
      <div className="book-cover-wrap">
        <img src={book.coverUrl} alt={book.title} className="book-cover" />
      </div>
      <div className="book-info">
        <h3 className="book-title">{book.title}</h3>
        <p className="book-author">by {book.author}</p>
        <div className="book-recommender">
          <img src={author?.avatar} alt="" className="book-recommender-avatar" />
          <span>Recommended by {author?.name?.split(' ')[0]}</span>
        </div>
        <p className="book-reason">"{book.reason}"</p>
        <div className="book-actions">
          <button
            className={`want-to-read-btn ${wantsToRead ? 'active' : ''}`}
            onClick={() => s.toggleWantToRead(book.id, currentUser.id)}
          >
            {wantsToRead ? '✓ On my list' : '+ Want to read'}
          </button>
          <span className="want-count">{book.wantToRead.length} interested</span>
          <button className="comments-toggle" onClick={() => setShowComments(!showComments)}>
            {book.comments.length} comment{book.comments.length !== 1 ? 's' : ''}
          </button>
        </div>
        {showComments && (
          <div className="book-comments">
            {book.comments.map(comment => {
              const commenter = users.find(u => u.id === comment.userId);
              return (
                <div key={comment.id} className="book-comment">
                  <img src={commenter?.avatar} alt="" className="comment-avatar" />
                  <div>
                    <span className="comment-author">{commenter?.name?.split(' ')[0]}</span>
                    <p className="comment-text">{comment.text}</p>
                  </div>
                </div>
              );
            })}
            <form className="comment-form" onSubmit={handleComment}>
              <input
                type="text"
                placeholder="Add a comment..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
              />
              <button type="submit">Send</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Books() {
  const { data, currentUser, store: s } = useStore();
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: '', author: '', coverUrl: '', reason: '' });
  const [coverPreview, setCoverPreview] = useState(null);
  const coverInputRef = useRef(null);

  const handleCoverFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setForm({ ...form, coverUrl: dataUrl });
    setCoverPreview(dataUrl);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    s.addBook({
      id: Date.now().toString(),
      userId: currentUser.id,
      ...form,
      date: new Date().toISOString().split('T')[0],
      wantToRead: [],
      comments: [],
    });
    setForm({ title: '', author: '', coverUrl: '', reason: '' });
    setCoverPreview(null);
    if (coverInputRef.current) coverInputRef.current.value = '';
    setShowNew(false);
  };

  return (
    <div className="books-page">
      <div className="page-header">
        <div>
          <h1>Book Shelf</h1>
          <p className="page-subtitle">What your SEP Circle is reading and recommending.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowNew(!showNew)}>
          {showNew ? 'Cancel' : 'Recommend a Book'}
        </button>
      </div>

      {showNew && (
        <form className="new-book-form" onSubmit={handleSubmit}>
          <input type="text" placeholder="Book title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          <input type="text" placeholder="Author" value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} required />
          <label className="file-upload-label">
            <input type="file" accept="image/*" onChange={handleCoverFile} ref={coverInputRef} className="file-input-hidden" />
            <span className="file-upload-btn">Upload book cover photo (optional)</span>
          </label>
          {coverPreview && <img src={coverPreview} alt="Cover preview" className="cover-preview" />}
          <textarea placeholder="Why do you recommend this book?" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} required maxLength={300} />
          <button type="submit" className="btn-primary">Share Recommendation</button>
        </form>
      )}

      <div className="books-grid">
        {data.books.map(book => (
          <BookCard key={book.id} book={book} users={data.users} currentUser={currentUser} store={s} />
        ))}
      </div>
    </div>
  );
}
