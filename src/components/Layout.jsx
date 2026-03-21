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

export default function Layout() {
  const { currentUser, store: s } = useAppStore();

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
