import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import * as db from './supabaseStore';

export function useSupabaseStore() {
  const [currentUser, setCurrentUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [postcards, setPostcards] = useState([]);
  const [books, setBooks] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [albumPhotos, setAlbumPhotos] = useState({});
  const [loungeEvents, setLoungeEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // ===== AUTH =====
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId) => {
    const profile = await db.fetchProfile(userId);
    setCurrentUser(profile);
    setLoading(false);
    loadAllData(userId);
  };

  // ===== LOAD ALL DATA =====
  const loadAllData = async (userId) => {
    const [p, pc, b, d, le] = await Promise.all([
      db.fetchProfiles(),
      db.fetchPostcards(),
      db.fetchBooks(),
      db.fetchDiscussions(),
      db.fetchLoungeEvents(),
    ]);
    setProfiles(p);
    setPostcards(pc);
    setBooks(b);
    setDiscussions(d);
    setLoungeEvents(le);

    if (userId) {
      const convs = await db.fetchConversations(userId);
      setConversations(convs);
    }
  };

  const refresh = useCallback(() => {
    if (currentUser) loadAllData(currentUser.id);
  }, [currentUser]);

  // ===== REALTIME SUBSCRIPTIONS =====
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'postcards' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'postcard_comments' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'books' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'book_comments' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'book_want_to_read' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'discussions' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'discussion_replies' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'personal_album_photos' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lounge_events' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lounge_event_attendees' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => refresh())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, refresh]);

  // ===== NORMALIZED DATA (match old store shape) =====

  // Transform Supabase postcard data to match old format
  const normalizedPostcards = postcards.map(p => ({
    id: p.id,
    userId: p.user_id,
    imageUrl: p.image_url,
    caption: p.caption,
    city: p.city,
    country: p.country,
    date: p.created_at?.split('T')[0],
    comments: (p.postcard_comments || []).map(c => ({
      id: c.id,
      userId: c.user_id,
      text: c.text,
      date: c.created_at?.split('T')[0],
    })),
  }));

  const normalizedBooks = books.map(b => ({
    id: b.id,
    userId: b.user_id,
    title: b.title,
    author: b.author,
    coverUrl: b.cover_url,
    reason: b.reason,
    date: b.created_at?.split('T')[0],
    wantToRead: (b.book_want_to_read || []).map(w => w.user_id),
    comments: (b.book_comments || []).map(c => ({
      id: c.id,
      userId: c.user_id,
      text: c.text,
      date: c.created_at?.split('T')[0],
    })),
  }));

  const normalizedDiscussions = discussions.map(d => ({
    id: d.id,
    userId: d.user_id,
    title: d.title,
    category: d.category,
    date: d.created_at?.split('T')[0],
    replies: (d.discussion_replies || []).map(r => ({
      id: r.id,
      userId: r.user_id,
      text: r.text,
      date: r.created_at?.split('T')[0],
    })),
  }));

  const normalizedConversations = conversations.map(c => ({
    id: c.id,
    isGroup: c.is_group,
    groupName: c.group_name,
    participants: (c.conversation_participants || []).map(p => p.user_id),
    messages: (c.messages || []).map(m => ({
      id: m.id,
      senderId: m.sender_id,
      text: m.text,
      date: m.created_at,
    })),
  }));

  const normalizedUsers = profiles.map(p => ({
    id: p.id,
    name: p.name,
    email: p.email,
    country: p.country,
    city: p.city,
    title: p.title,
    company: p.company,
    bio: p.bio,
    avatar: p.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(p.name)}&backgroundColor=1e3a5f`,
    session: p.session,
  }));

  const normalizedLoungeEvents = loungeEvents.map(e => ({
    id: e.id,
    createdBy: e.created_by,
    title: e.title,
    description: e.description,
    date: e.event_date,
    time: e.event_time,
    meetLink: e.meet_link,
    attendees: (e.lounge_event_attendees || []).map(a => a.user_id),
  }));

  const normalizedCurrentUser = currentUser ? {
    id: currentUser.id,
    name: currentUser.name,
    email: currentUser.email,
    country: currentUser.country,
    city: currentUser.city,
    title: currentUser.title,
    company: currentUser.company,
    bio: currentUser.bio,
    avatar: currentUser.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(currentUser.name)}&backgroundColor=1e3a5f`,
    session: currentUser.session,
  } : null;

  // ===== STORE ACTIONS (match old store interface) =====
  const store = {
    loginWithEmail: async (email, password) => {
      const result = await db.loginWithEmail(email, password);
      return result;
    },

    logout: async () => {
      await db.signOut();
      setCurrentUser(null);
    },

    updateProfile: async (userId, updates) => {
      const dbUpdates = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.company !== undefined) dbUpdates.company = updates.company;
      if (updates.city !== undefined) dbUpdates.city = updates.city;
      if (updates.country !== undefined) dbUpdates.country = updates.country;
      if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
      if (updates.avatar !== undefined) dbUpdates.avatar_url = updates.avatar;
      await db.updateProfile(userId, dbUpdates);
      refresh();
    },

    updateUserCity: async (userId, city, country) => {
      await db.updateProfile(userId, { city, country });
      refresh();
    },

    // Postcards
    addPostcard: async (postcard) => {
      await db.addPostcard({
        user_id: postcard.userId,
        image_url: postcard.imageUrl,
        caption: postcard.caption,
        city: postcard.city,
        country: postcard.country,
      });
      refresh();
    },

    updatePostcard: async (postcardId, updates) => {
      const dbUpdates = {};
      if (updates.caption !== undefined) dbUpdates.caption = updates.caption;
      await db.updatePostcard(postcardId, dbUpdates);
      refresh();
    },

    deletePostcard: async (postcardId) => {
      await db.deletePostcard(postcardId);
      refresh();
    },

    addPostcardComment: async (postcardId, comment) => {
      await db.addPostcardComment({
        postcard_id: postcardId,
        user_id: comment.userId,
        text: comment.text,
      });
      refresh();
    },

    // Books
    addBook: async (book) => {
      await db.addBook({
        user_id: book.userId,
        title: book.title,
        author: book.author,
        cover_url: book.coverUrl,
        reason: book.reason,
      });
      refresh();
    },

    updateBook: async (bookId, updates) => {
      const dbUpdates = {};
      if (updates.reason !== undefined) dbUpdates.reason = updates.reason;
      await db.updateBook(bookId, dbUpdates);
      refresh();
    },

    deleteBook: async (bookId) => {
      await db.deleteBook(bookId);
      refresh();
    },

    toggleWantToRead: async (bookId, userId) => {
      await db.toggleWantToRead(bookId, userId);
      refresh();
    },

    addBookComment: async (bookId, comment) => {
      await db.addBookComment({
        book_id: bookId,
        user_id: comment.userId,
        text: comment.text,
      });
      refresh();
    },

    // Discussions
    addDiscussion: async (discussion) => {
      await db.addDiscussion({
        user_id: discussion.userId,
        title: discussion.title,
        category: discussion.category,
      });
      refresh();
    },

    updateDiscussion: async (discussionId, updates) => {
      const dbUpdates = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      await db.updateDiscussion(discussionId, dbUpdates);
      refresh();
    },

    deleteDiscussion: async (discussionId) => {
      await db.deleteDiscussion(discussionId);
      refresh();
    },

    addReply: async (discussionId, reply) => {
      await db.addReply({
        discussion_id: discussionId,
        user_id: reply.userId,
        text: reply.text,
      });
      refresh();
    },

    // Messages
    startConversation: async (participants, isGroup, groupName) => {
      const convId = await db.startConversation(participants, isGroup, groupName);
      refresh();
      return convId;
    },

    addMessage: async (conversationId, message) => {
      await db.sendMessage({
        conversation_id: conversationId,
        sender_id: message.senderId,
        text: message.text,
      });
      refresh();
    },

    // Album
    addAlbumPhoto: async (userId, photo) => {
      await db.addAlbumPhoto({
        user_id: userId,
        url: photo.url,
        caption: photo.caption,
      });
      refresh();
    },

    updateAlbumPhoto: async (userId, photoId, updates) => {
      await db.updateAlbumPhoto(photoId, updates);
      refresh();
    },

    deleteAlbumPhoto: async (userId, photoId) => {
      await db.deleteAlbumPhoto(photoId);
      refresh();
    },

    // Lounge
    addLoungeEvent: async (event) => {
      const e = await db.addLoungeEvent({
        created_by: event.createdBy,
        title: event.title,
        description: event.description,
        event_date: event.date,
        event_time: event.time,
        meet_link: event.meetLink,
      });
      // Auto-attend as creator
      await db.toggleEventAttendance(e.id, event.createdBy);
      refresh();
    },

    // For lounge attendance toggle
    update: (updater) => {
      // This is used by SchwabLounge for toggleAttendance
      // We intercept and use Supabase instead
    },

    toggleEventAttendance: async (eventId, userId) => {
      await db.toggleEventAttendance(eventId, userId);
      refresh();
    },
  };

  // Load album photos for a specific user
  const loadAlbumPhotos = async (userId) => {
    const photos = await db.fetchAlbumPhotos(userId);
    setAlbumPhotos(prev => ({
      ...prev,
      [userId]: photos.map(p => ({ id: p.id, url: p.url, caption: p.caption, date: p.created_at?.split('T')[0] })),
    }));
  };

  const data = {
    users: normalizedUsers,
    postcards: normalizedPostcards,
    books: normalizedBooks,
    discussions: normalizedDiscussions,
    messages: normalizedConversations,
    personalAlbums: albumPhotos,
    loungeEvents: normalizedLoungeEvents,
  };

  return { data, currentUser: normalizedCurrentUser, store, loading, refresh, loadAlbumPhotos };
}
