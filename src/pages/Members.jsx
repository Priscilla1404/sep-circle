import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAppStore } from '../App';
import { supabase, supabaseEnabled } from '../lib/supabase';

export default function Members() {
  const { data, currentUser } = useAppStore();
  const [onlineIds, setOnlineIds] = useState(new Set());
  const [search, setSearch] = useState('');

  // Supabase Presence for online status
  useEffect(() => {
    if (!supabaseEnabled || !currentUser) return;

    const channel = supabase.channel('online-members', {
      config: { presence: { key: currentUser.id } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOnlineIds(new Set(Object.keys(state)));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: currentUser.id });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);

  const filtered = data.users.filter(u => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) ||
      u.city?.toLowerCase().includes(q) ||
      u.country?.toLowerCase().includes(q) ||
      u.company?.toLowerCase().includes(q);
  });

  // Sort: online first, then alphabetical
  const sorted = [...filtered].sort((a, b) => {
    const aOnline = onlineIds.has(a.id) ? 0 : 1;
    const bOnline = onlineIds.has(b.id) ? 0 : 1;
    if (aOnline !== bOnline) return aOnline - bOnline;
    return a.name.localeCompare(b.name);
  });

  const onlineCount = data.users.filter(u => onlineIds.has(u.id)).length;

  return (
    <div className="members-page">
      <div className="page-header">
        <div>
          <h1>Members</h1>
          <p className="page-subtitle">
            {onlineCount > 0
              ? `${onlineCount} member${onlineCount !== 1 ? 's' : ''} online now`
              : 'Your SEP Circle community'}
          </p>
        </div>
      </div>

      <div className="members-search">
        <input
          type="text"
          placeholder="Search by name, city, country, or company..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="members-grid">
        {sorted.map(user => {
          const isOnline = onlineIds.has(user.id);
          const albumCount = (data.personalAlbums[user.id] || []).length || (data.albumCounts || {})[user.id] || 0;
          return (
            <NavLink to={`/profile/${user.id}`} key={user.id} className="member-card">
              <div className="member-avatar-wrap">
                <img src={user.avatar} alt="" className="member-avatar" />
                {isOnline && <span className="online-dot" />}
              </div>
              <div className="member-info">
                <span className="member-name">{user.name}</span>
                {user.title && (
                  <span className="member-title">
                    {user.title}{user.company ? ` at ${user.company}` : ''}
                  </span>
                )}
                <span className="member-location">{user.city}{user.city && user.country ? ', ' : ''}{user.country}</span>
              </div>
              {albumCount > 0 && (
                <span className="member-album-badge">{albumCount} photo{albumCount !== 1 ? 's' : ''}</span>
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
