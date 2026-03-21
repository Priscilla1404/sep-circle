import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import * as db from './supabaseStore';

export function useSupabaseStore() {
  const [currentUser, setCurrentUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [postcards, setPostcards] = useState([]);
  const [postcardComments, setPostcardComments] = useState([]);
  const [books, setBooks] = useState([]);
  const [bookComments, setBookComments] = useState([]);
  const [bookWantToRead, setBookWantToRead] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [discussionReplies, setDiscussionReplies] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [albumPhotos, setAlbumPhotos] = useState({});
  const [loungeEvents, setLoungeEvents] = useState([]);
  const [travelPlans, setTravelPlans] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [albumCounts, setAlbumCounts] = useState({});
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
    let profile = await db.fetchProfile(userId);
    if (!profile) {
      // Profile missing — create it from auth user data
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const name = user.user_metadata?.name || user.email?.split('@')[0] || '';
        await db.upsertProfile({ id: user.id, name, email: user.email });
        profile = await db.fetchProfile(userId);
      }
    }
    if (profile) {
      await loadAllData(userId);
    }
    setCurrentUser(profile);
    setLoading(false);
  };

  // ===== LOAD ALL DATA =====
  const loadAllData = async (userId) => {
    try {
      const [p, pc, pcComments, b, bComments, bWtr, d, dReplies, le, tp, ac, sess] = await Promise.all([
        db.fetchProfiles(),
        db.fetchPostcards(),
        db.fetchPostcardComments(),
        db.fetchBooks(),
        db.fetchBookComments(),
        db.fetchBookWantToRead(),
        db.fetchDiscussions(),
        db.fetchDiscussionReplies(),
        db.fetchLoungeEvents(),
        db.fetchTravelPlans(),
        db.fetchAllAlbumCounts(),
        db.fetchSessions(),
      ]);
      setProfiles(p);
      setPostcards(pc);
      setPostcardComments(pcComments);
      setBooks(b);
      setBookComments(bComments);
      setBookWantToRead(bWtr);
      setDiscussions(d);
      setDiscussionReplies(dReplies);
      setLoungeEvents(le);
      setTravelPlans(tp);
      setAlbumCounts(ac);
      setSessions(sess);

      if (userId) {
        const convs = await db.fetchConversations(userId);
        setConversations(convs);
      }
    } catch (err) {
      console.error('Error loading data:', err);
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
      .on('postgres_changes', { event: '*', schema: 'public' }, () => refresh())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, refresh]);

  // ===== BUILD NORMALIZED DATA =====
  const normalizedPostcards = postcards.map(p => ({
    id: p.id,
    userId: p.user_id,
    imageUrl: p.image_url,
    caption: p.caption,
    city: p.city,
    country: p.country,
    date: p.created_at?.split('T')[0],
    comments: postcardComments
      .filter(c => c.postcard_id === p.id)
      .map(c => ({ id: c.id, userId: c.user_id, text: c.text, date: c.created_at?.split('T')[0] })),
  }));

  const normalizedBooks = books.map(b => ({
    id: b.id,
    userId: b.user_id,
    title: b.title,
    author: b.author,
    coverUrl: b.cover_url,
    reason: b.reason,
    date: b.created_at?.split('T')[0],
    wantToRead: bookWantToRead.filter(w => w.book_id === b.id).map(w => w.user_id),
    comments: bookComments
      .filter(c => c.book_id === b.id)
      .map(c => ({ id: c.id, userId: c.user_id, text: c.text, date: c.created_at?.split('T')[0] })),
  }));

  const normalizedDiscussions = discussions.map(d => ({
    id: d.id,
    userId: d.user_id,
    title: d.title,
    category: d.category,
    date: d.created_at?.split('T')[0],
    replies: discussionReplies
      .filter(r => r.discussion_id === d.id)
      .map(r => ({ id: r.id, userId: r.user_id, text: r.text, date: r.created_at?.split('T')[0] })),
  }));

  const normalizedConversations = conversations.map(c => ({
    id: c.id,
    isGroup: c.is_group,
    groupName: c.group_name,
    participants: (c.participants || []).map(p => p.user_id),
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
    attendees: (e.attendees || []).map(a => a.user_id),
  }));

  const normalizedSessions = sessions.map(s => ({
    id: s.id,
    createdBy: s.created_by,
    title: s.title,
    description: s.description,
    date: s.session_date,
    time: s.session_time,
    meetLink: s.meet_link,
  }));

  const normalizedTravelPlans = travelPlans.map(t => ({
    id: t.id,
    userId: t.user_id,
    city: t.city,
    country: t.country,
    dateFrom: t.date_from,
    dateTo: t.date_to,
    note: t.note,
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

  // ===== STORE ACTIONS =====
  const store = {
    loginWithEmail: async (email, password) => {
      return await db.loginWithEmail(email, password);
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
      if (updates.avatar !== undefined) {
        let avatarUrl = updates.avatar;
        if (avatarUrl && avatarUrl.startsWith('data:')) {
          avatarUrl = await db.uploadDataUrl(avatarUrl, 'avatars');
        }
        dbUpdates.avatar_url = avatarUrl;
      }
      await db.updateProfile(userId, dbUpdates);
      refresh();
    },

    updateUserCity: async (userId, city, country) => {
      await db.updateProfile(userId, { city, country });
      refresh();
    },

    addPostcard: async (postcard) => {
      let imageUrl = postcard.imageUrl;
      if (imageUrl && imageUrl.startsWith('data:')) {
        imageUrl = await db.uploadDataUrl(imageUrl, 'postcards');
      }
      await db.addPostcard({
        user_id: postcard.userId,
        image_url: imageUrl,
        caption: postcard.caption,
        city: postcard.city,
        country: postcard.country,
      });
      refresh();
    },

    updatePostcard: async (postcardId, updates) => {
      await db.updatePostcard(postcardId, { caption: updates.caption });
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
      await db.updateBook(bookId, { reason: updates.reason });
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

    addDiscussion: async (discussion) => {
      await db.addDiscussion({
        user_id: discussion.userId,
        title: discussion.title,
        category: discussion.category,
      });
      refresh();
    },

    updateDiscussion: async (discussionId, updates) => {
      await db.updateDiscussion(discussionId, { title: updates.title });
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

    addAlbumPhoto: async (userId, photo) => {
      let url = photo.url;
      if (url && url.startsWith('data:')) {
        url = await db.uploadDataUrl(url, 'albums');
      }
      await db.addAlbumPhoto({
        user_id: userId,
        url,
        caption: photo.caption,
      });
      if (loadAlbumPhotos) loadAlbumPhotos(userId);
    },

    updateAlbumPhoto: async (userId, photoId, updates) => {
      await db.updateAlbumPhoto(photoId, updates);
      if (loadAlbumPhotos) loadAlbumPhotos(userId);
    },

    deleteAlbumPhoto: async (userId, photoId) => {
      await db.deleteAlbumPhoto(photoId);
      if (loadAlbumPhotos) loadAlbumPhotos(userId);
    },

    addLoungeEvent: async (event) => {
      const e = await db.addLoungeEvent({
        created_by: event.createdBy,
        title: event.title,
        description: event.description,
        event_date: event.date,
        event_time: event.time,
        meet_link: event.meetLink,
      });
      await db.toggleEventAttendance(e.id, event.createdBy);
      refresh();
    },

    toggleEventAttendance: async (eventId, userId) => {
      await db.toggleEventAttendance(eventId, userId);
      refresh();
    },

    addSession: async (session) => {
      await db.addSession({
        created_by: session.createdBy,
        title: session.title,
        description: session.description,
        session_date: session.date,
        session_time: session.time,
        meet_link: session.meetLink,
      });
      refresh();
    },

    deleteSession: async (sessionId) => {
      await db.deleteSession(sessionId);
      refresh();
    },

    addTravelPlan: async (plan) => {
      await db.addTravelPlan({
        user_id: plan.userId,
        city: plan.city,
        country: plan.country,
        date_from: plan.dateFrom,
        date_to: plan.dateTo,
        note: plan.note,
      });
      refresh();
    },

    deleteTravelPlan: async (planId) => {
      await db.deleteTravelPlan(planId);
      refresh();
    },

    update: () => {}, // no-op for Supabase mode
  };

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
    sessions: normalizedSessions,
    travelPlans: normalizedTravelPlans,
    albumCounts,
  };

  return { data, currentUser: normalizedCurrentUser, store, loading, refresh, loadAlbumPhotos };
}
