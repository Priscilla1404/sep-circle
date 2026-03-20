import { seedUsers } from '../data/seedUsers';
import { seedPostcards, seedBooks, seedDiscussions, seedMessages, seedLoungeEvents } from '../data/seedData';

const STORAGE_KEY = 'sep_circle_data';
const RESET_KEY = 'sep_circle_v4'; // bump this to force data reset

function loadData() {
  try {
    const version = localStorage.getItem('sep_circle_version');
    if (version !== RESET_KEY) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem('sep_circle_version', RESET_KEY);
      return null;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    // ignore
  }
  return null;
}

function saveData(newData) {
  try {
    const serialized = JSON.stringify(newData);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (e) {
    // Storage is actually full — revert to last known good state
    console.warn('Storage full:', e);
    alert('Storage is full. Try removing some photos before adding new ones.');
    // Reload last saved data
    try {
      const fallback = localStorage.getItem(STORAGE_KEY);
      if (fallback) data = JSON.parse(fallback);
    } catch (_) {}
    return false;
  }
  return true;
}

function getInitialData() {
  const stored = loadData();
  if (stored) return stored;
  const initial = {
    users: seedUsers,
    postcards: seedPostcards,
    books: seedBooks,
    discussions: seedDiscussions,
    messages: seedMessages,
    personalAlbums: {},
    loungeEvents: seedLoungeEvents,
    travelPlans: [],
  };
  saveData(initial);
  return initial;
}

let data = getInitialData();
let listeners = [];

export const store = {
  getData: () => data,

  subscribe: (fn) => {
    listeners.push(fn);
    return () => { listeners = listeners.filter(l => l !== fn); };
  },

  update: (updater) => {
    data = updater(data);
    saveData(data);
    listeners.forEach(fn => fn(data));
  },

  // Auth — email + password
  getCurrentUser: () => {
    const id = localStorage.getItem('sep_current_user');
    return data.users.find(u => u.id === id) || null;
  },

  loginWithEmail: (email, password) => {
    const user = data.users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (user) {
      localStorage.setItem('sep_current_user', user.id);
      listeners.forEach(fn => fn(data));
      return { success: true };
    }
    return { success: false, error: 'Invalid email or password. Access is limited to SEP Flex 2025-2026 participants.' };
  },

  logout: () => {
    localStorage.removeItem('sep_current_user');
    listeners.forEach(fn => fn(data));
  },

  // Profile editing
  updateProfile: (userId, updates) => {
    store.update(d => ({
      ...d,
      users: d.users.map(u =>
        u.id === userId ? { ...u, ...updates } : u
      ),
    }));
  },

  // Postcards
  updatePostcard: (postcardId, updates) => {
    store.update(d => ({
      ...d,
      postcards: d.postcards.map(p => p.id === postcardId ? { ...p, ...updates } : p),
    }));
  },

  deletePostcard: (postcardId) => {
    store.update(d => ({
      ...d,
      postcards: d.postcards.filter(p => p.id !== postcardId),
    }));
  },

  addPostcard: (postcard) => {
    store.update(d => ({
      ...d,
      postcards: [postcard, ...d.postcards],
    }));
  },

  addPostcardComment: (postcardId, comment) => {
    store.update(d => ({
      ...d,
      postcards: d.postcards.map(p =>
        p.id === postcardId
          ? { ...p, comments: [...p.comments, comment] }
          : p
      ),
    }));
  },

  // Books
  updateBook: (bookId, updates) => {
    store.update(d => ({
      ...d,
      books: d.books.map(b => b.id === bookId ? { ...b, ...updates } : b),
    }));
  },

  deleteBook: (bookId) => {
    store.update(d => ({
      ...d,
      books: d.books.filter(b => b.id !== bookId),
    }));
  },

  addBook: (book) => {
    store.update(d => ({
      ...d,
      books: [book, ...d.books],
    }));
  },

  toggleWantToRead: (bookId, userId) => {
    store.update(d => ({
      ...d,
      books: d.books.map(b => {
        if (b.id !== bookId) return b;
        const has = b.wantToRead.includes(userId);
        return {
          ...b,
          wantToRead: has
            ? b.wantToRead.filter(id => id !== userId)
            : [...b.wantToRead, userId],
        };
      }),
    }));
  },

  addBookComment: (bookId, comment) => {
    store.update(d => ({
      ...d,
      books: d.books.map(b =>
        b.id === bookId
          ? { ...b, comments: [...b.comments, comment] }
          : b
      ),
    }));
  },

  // Discussions
  updateDiscussion: (discussionId, updates) => {
    store.update(d => ({
      ...d,
      discussions: d.discussions.map(disc => disc.id === discussionId ? { ...disc, ...updates } : disc),
    }));
  },

  deleteDiscussion: (discussionId) => {
    store.update(d => ({
      ...d,
      discussions: d.discussions.filter(disc => disc.id !== discussionId),
    }));
  },

  addDiscussion: (discussion) => {
    store.update(d => ({
      ...d,
      discussions: [discussion, ...d.discussions],
    }));
  },

  addReply: (discussionId, reply) => {
    store.update(d => ({
      ...d,
      discussions: d.discussions.map(disc =>
        disc.id === discussionId
          ? { ...disc, replies: [...disc.replies, reply] }
          : disc
      ),
    }));
  },

  // Messages
  startConversation: (participants, isGroup, groupName) => {
    const conv = {
      id: Date.now().toString(),
      participants,
      isGroup: isGroup || false,
      groupName: groupName || '',
      messages: [],
    };
    store.update(d => ({
      ...d,
      messages: [...d.messages, conv],
    }));
    return conv.id;
  },

  addMessage: (conversationId, message) => {
    store.update(d => ({
      ...d,
      messages: d.messages.map(conv =>
        conv.id === conversationId
          ? { ...conv, messages: [...conv.messages, message] }
          : conv
      ),
    }));
  },

  // Personal Albums
  updateAlbumPhoto: (userId, photoId, updates) => {
    store.update(d => ({
      ...d,
      personalAlbums: {
        ...d.personalAlbums,
        [userId]: (d.personalAlbums[userId] || []).map(p => p.id === photoId ? { ...p, ...updates } : p),
      },
    }));
  },

  deleteAlbumPhoto: (userId, photoId) => {
    store.update(d => ({
      ...d,
      personalAlbums: {
        ...d.personalAlbums,
        [userId]: (d.personalAlbums[userId] || []).filter(p => p.id !== photoId),
      },
    }));
  },

  addAlbumPhoto: (userId, photo) => {
    store.update(d => ({
      ...d,
      personalAlbums: {
        ...d.personalAlbums,
        [userId]: [...(d.personalAlbums[userId] || []), photo],
      },
    }));
  },

  // User location update
  updateUserCity: (userId, city, country) => {
    store.update(d => ({
      ...d,
      users: d.users.map(u =>
        u.id === userId ? { ...u, city, country } : u
      ),
    }));
  },

  // Schwab Lounge
  addLoungeEvent: (event) => {
    store.update(d => ({
      ...d,
      loungeEvents: [...d.loungeEvents, event],
    }));
  },

  // Travel Plans
  addTravelPlan: (plan) => {
    store.update(d => ({
      ...d,
      travelPlans: [...d.travelPlans, plan],
    }));
  },

  deleteTravelPlan: (planId) => {
    store.update(d => ({
      ...d,
      travelPlans: d.travelPlans.filter(t => t.id !== planId),
    }));
  },

  deleteLoungeEvent: (eventId) => {
    store.update(d => ({
      ...d,
      loungeEvents: d.loungeEvents.filter(e => e.id !== eventId),
    }));
  },
};
