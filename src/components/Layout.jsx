import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAppStore } from '../App';

const navItems = [
  { to: '/', label: 'Postcards', icon: '✉' },
  { to: '/books', label: 'Books', icon: '📖' },
  { to: '/discussions', label: 'Discuss', icon: '💬' },
  { to: '/sessions', label: 'Sessions', icon: '🎓' },
  { to: '/lounge', label: 'Schwab Lounge', icon: '🛋' },
  { to: '/nearby', label: 'Near Me', icon: '📍' },
  { to: '/travel', label: 'Travel', icon: '✈' },
  { to: '/members', label: 'Members', icon: '👥' },
  { to: '/messages', label: 'DMs', icon: '✏' },
];

function getLastSeen() {
  try {
    return localStorage.getItem('sep_last_seen') || new Date(0).toISOString();
  } catch { return new Date(0).toISOString(); }
}

function setLastSeen() {
  localStorage.setItem('sep_last_seen', new Date().toISOString());
}

function useNotifications(data, currentUser) {
  const [unseen, setUnseen] = useState([]);
  const [showPanel, setShowPanel] = useState(false);
  const lastSeen = useRef(getLastSeen());

  useEffect(() => {
    if (!currentUser) return;
    const since = new Date(lastSeen.current);
    const items = [];

    (data.postcards || []).forEach(p => {
      if (p.userId !== currentUser.id && new Date(p.date) > since) {
        const user = data.users.find(u => u.id === p.userId);
        items.push({ type: 'postcard', text: `${user?.name?.split(' ')[0] || 'Someone'} posted a new postcard`, date: p.date, link: '/' });
      }
    });

    (data.books || []).forEach(b => {
      if (b.userId !== currentUser.id && new Date(b.date) > since) {
        const user = data.users.find(u => u.id === b.userId);
        items.push({ type: 'book', text: `${user?.name?.split(' ')[0] || 'Someone'} recommended a book: ${b.title}`, date: b.date, link: '/books' });
      }
    });

    (data.discussions || []).forEach(d => {
      if (d.userId !== currentUser.id && new Date(d.date) > since) {
        const user = data.users.find(u => u.id === d.userId);
        items.push({ type: 'discussion', text: `${user?.name?.split(' ')[0] || 'Someone'} started a discussion: ${d.title}`, date: d.date, link: '/discussions' });
      }
    });

    (data.sessions || []).forEach(s => {
      if (s.createdBy !== currentUser.id) {
        const user = data.users.find(u => u.id === s.createdBy);
        items.push({ type: 'session', text: `New session added: ${s.title}`, date: s.date, link: '/sessions' });
      }
    });

    items.sort((a, b) => new Date(b.date) - new Date(a.date));
    setUnseen(items.slice(0, 20));
  }, [data, currentUser]);

  const markSeen = () => {
    setLastSeen();
    lastSeen.current = new Date().toISOString();
    setUnseen([]);
    setShowPanel(false);
  };

  return { unseen, showPanel, setShowPanel, markSeen };
}

export default function Layout() {
  const { data, currentUser, store: s } = useAppStore();
  const { unseen, showPanel, setShowPanel, markSeen } = useNotifications(data, currentUser);
  const panelRef = useRef(null);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowPanel(false);
      }
    };
    if (showPanel) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showPanel]);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <NavLink to="/" className="logo">
            <span className="logo-mark">SC</span>
            <span className="logo-text">SEP Circle</span>
          </NavLink>
          <nav className="main-nav">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="header-right">
            <div className="notif-wrap" ref={panelRef}>
              <button className="notif-bell" onClick={() => setShowPanel(!showPanel)}>
                <span className="bell-icon">🔔</span>
                {unseen.length > 0 && <span className="notif-badge">{unseen.length}</span>}
              </button>
              {showPanel && (
                <div className="notif-panel">
                  <div className="notif-panel-header">
                    <span>Notifications</span>
                    {unseen.length > 0 && (
                      <button className="notif-clear" onClick={markSeen}>Mark all read</button>
                    )}
                  </div>
                  {unseen.length === 0 ? (
                    <p className="notif-empty">You're all caught up!</p>
                  ) : (
                    <div className="notif-list">
                      {unseen.map((item, i) => (
                        <NavLink key={i} to={item.link} className="notif-item" onClick={() => setShowPanel(false)}>
                          <span className="notif-text">{item.text}</span>
                          <span className="notif-date">{item.date}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <NavLink to={`/profile/${currentUser?.id}`} className="user-pill" title="My profile & album">
              <img src={currentUser?.avatar} alt="" className="user-pill-avatar" />
              <span className="user-pill-name">{currentUser?.name?.split(' ')[0]}</span>
            </NavLink>
            <button className="logout-btn" onClick={() => s.logout()}>Sign out</button>
          </div>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
