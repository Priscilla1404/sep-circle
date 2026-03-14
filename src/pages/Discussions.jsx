import { useState } from 'react';
import { useStore } from '../lib/useStore';

const CATEGORIES = ['General', 'Business', 'Travel', 'Life'];

function DiscussionThread({ discussion, users, currentUser, store: s }) {
  const [expanded, setExpanded] = useState(false);
  const [newReply, setNewReply] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(discussion.title);
  const author = users.find(u => u.id === discussion.userId);
  const isMine = discussion.userId === currentUser.id;

  const handleSaveTitle = () => {
    if (editTitle.trim()) {
      s.updateDiscussion(discussion.id, { title: editTitle.trim() });
    }
    setEditingTitle(false);
  };

  const handleReply = (e) => {
    e.preventDefault();
    if (!newReply.trim()) return;
    s.addReply(discussion.id, {
      id: Date.now().toString(),
      userId: currentUser.id,
      text: newReply.trim(),
      date: new Date().toISOString().split('T')[0],
    });
    setNewReply('');
  };

  return (
    <div className="discussion-card">
      <div className="discussion-header" onClick={() => !editingTitle && setExpanded(!expanded)}>
        <span className={`category-tag ${discussion.category.toLowerCase()}`}>{discussion.category}</span>
        {editingTitle ? (
          <div className="inline-edit" onClick={e => e.stopPropagation()}>
            <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="inline-edit-input" autoFocus />
            <button onClick={handleSaveTitle} className="inline-edit-save">Save</button>
            <button onClick={() => setEditingTitle(false)} className="inline-edit-cancel">Cancel</button>
          </div>
        ) : (
          <h3 className="discussion-title">{discussion.title}</h3>
        )}
        <div className="discussion-meta">
          <img src={author?.avatar} alt="" className="discussion-author-avatar" />
          <span>{author?.name?.split(' ')[0]}</span>
          <span className="discussion-date">{new Date(discussion.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          <span className="reply-count">{discussion.replies.length} replies</span>
          {isMine && !editingTitle && (
            <>
              <button className="owner-btn-inline" onClick={e => { e.stopPropagation(); setEditingTitle(true); }}>Edit</button>
              <button className="owner-btn-inline danger" onClick={e => { e.stopPropagation(); if (confirm('Delete this thread?')) s.deleteDiscussion(discussion.id); }}>Delete</button>
            </>
          )}
        </div>
      </div>
      {expanded && (
        <div className="discussion-body">
          <div className="replies-list">
            {discussion.replies.map(reply => {
              const replier = users.find(u => u.id === reply.userId);
              return (
                <div key={reply.id} className="reply">
                  <img src={replier?.avatar} alt="" className="reply-avatar" />
                  <div className="reply-content">
                    <div className="reply-header">
                      <span className="reply-author">{replier?.name?.split(' ')[0]}</span>
                      <span className="reply-date">{new Date(reply.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <p className="reply-text">{reply.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <form className="reply-form" onSubmit={handleReply}>
            <input
              type="text"
              placeholder="Add to the conversation..."
              value={newReply}
              onChange={e => setNewReply(e.target.value)}
            />
            <button type="submit">Reply</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function Discussions() {
  const { data, currentUser, store: s } = useStore();
  const [filter, setFilter] = useState('All');
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'General' });

  const filtered = filter === 'All'
    ? data.discussions
    : data.discussions.filter(d => d.category === filter);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    s.addDiscussion({
      id: Date.now().toString(),
      userId: currentUser.id,
      title: form.title.trim(),
      category: form.category,
      date: new Date().toISOString().split('T')[0],
      replies: [],
    });
    setForm({ title: '', category: 'General' });
    setShowNew(false);
  };

  return (
    <div className="discussions-page">
      <div className="page-header">
        <div>
          <h1>Discussions</h1>
          <p className="page-subtitle">Conversations that matter, at your own pace.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowNew(!showNew)}>
          {showNew ? 'Cancel' : 'Start a Thread'}
        </button>
      </div>

      <div className="category-filters">
        {['All', ...CATEGORIES].map(cat => (
          <button
            key={cat}
            className={`category-filter ${filter === cat ? 'active' : ''}`}
            onClick={() => setFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {showNew && (
        <form className="new-discussion-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="What's on your mind?"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            required
          />
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <button type="submit" className="btn-primary">Post Thread</button>
        </form>
      )}

      <div className="discussions-list">
        {filtered.map(disc => (
          <DiscussionThread key={disc.id} discussion={disc} users={data.users} currentUser={currentUser} store={s} />
        ))}
        {filtered.length === 0 && <p className="empty-state">No discussions in this category yet. Be the first!</p>}
      </div>
    </div>
  );
}
