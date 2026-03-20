import { supabase } from './supabase';

// Upload image to Supabase Storage, return public URL
export async function uploadImage(file, folder = 'general') {
  const ext = file.name.split('.').pop();
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from('photos').upload(fileName, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from('photos').getPublicUrl(fileName);
  return data.publicUrl;
}

// Upload base64 data URL to Storage
export async function uploadDataUrl(dataUrl, folder = 'general') {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const ext = blob.type.split('/')[1] || 'jpg';
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from('photos').upload(fileName, blob, {
    cacheControl: '3600',
    contentType: blob.type,
  });

  if (error) throw error;

  const { data } = supabase.storage.from('photos').getPublicUrl(fileName);
  return data.publicUrl;
}

// ===== AUTH =====
export async function loginWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { success: false, error: error.message };
  return { success: true, user: data.user };
}

export async function signOut() {
  await supabase.auth.signOut();
}

// ===== PROFILES =====
export async function fetchProfiles() {
  const { data, error } = await supabase.from('profiles').select('*').order('name');
  if (error) { console.error('fetchProfiles:', error); return []; }
  return data || [];
}

export async function fetchProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) { console.error('fetchProfile:', error); return null; }
  return data;
}

export async function updateProfile(userId, updates) {
  const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
  if (error) throw error;
}

// ===== POSTCARDS =====
export async function fetchPostcards() {
  const { data, error } = await supabase.from('postcards').select('*').order('created_at', { ascending: false });
  if (error) { console.error('fetchPostcards:', error); return []; }
  return data || [];
}

export async function fetchPostcardComments() {
  const { data, error } = await supabase.from('postcard_comments').select('*').order('created_at');
  if (error) { console.error('fetchPostcardComments:', error); return []; }
  return data || [];
}

export async function addPostcard(postcard) {
  const { data, error } = await supabase.from('postcards').insert(postcard).select().single();
  if (error) throw error;
  return data;
}

export async function updatePostcard(id, updates) {
  const { error } = await supabase.from('postcards').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deletePostcard(id) {
  const { error } = await supabase.from('postcards').delete().eq('id', id);
  if (error) throw error;
}

export async function addPostcardComment(comment) {
  const { error } = await supabase.from('postcard_comments').insert(comment);
  if (error) throw error;
}

// ===== BOOKS =====
export async function fetchBooks() {
  const { data, error } = await supabase.from('books').select('*').order('created_at', { ascending: false });
  if (error) { console.error('fetchBooks:', error); return []; }
  return data || [];
}

export async function fetchBookComments() {
  const { data, error } = await supabase.from('book_comments').select('*').order('created_at');
  if (error) { console.error('fetchBookComments:', error); return []; }
  return data || [];
}

export async function fetchBookWantToRead() {
  const { data, error } = await supabase.from('book_want_to_read').select('*');
  if (error) { console.error('fetchBookWantToRead:', error); return []; }
  return data || [];
}

export async function addBook(book) {
  const { data, error } = await supabase.from('books').insert(book).select().single();
  if (error) throw error;
  return data;
}

export async function updateBook(id, updates) {
  const { error } = await supabase.from('books').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteBook(id) {
  const { error } = await supabase.from('books').delete().eq('id', id);
  if (error) throw error;
}

export async function addBookComment(comment) {
  const { error } = await supabase.from('book_comments').insert(comment);
  if (error) throw error;
}

export async function toggleWantToRead(bookId, userId) {
  const { data } = await supabase
    .from('book_want_to_read')
    .select('*')
    .eq('book_id', bookId)
    .eq('user_id', userId);

  if (data && data.length > 0) {
    await supabase.from('book_want_to_read').delete().eq('book_id', bookId).eq('user_id', userId);
  } else {
    await supabase.from('book_want_to_read').insert({ book_id: bookId, user_id: userId });
  }
}

// ===== DISCUSSIONS =====
export async function fetchDiscussions() {
  const { data, error } = await supabase.from('discussions').select('*').order('created_at', { ascending: false });
  if (error) { console.error('fetchDiscussions:', error); return []; }
  return data || [];
}

export async function fetchDiscussionReplies() {
  const { data, error } = await supabase.from('discussion_replies').select('*').order('created_at');
  if (error) { console.error('fetchDiscussionReplies:', error); return []; }
  return data || [];
}

export async function addDiscussion(discussion) {
  const { data, error } = await supabase.from('discussions').insert(discussion).select().single();
  if (error) throw error;
  return data;
}

export async function updateDiscussion(id, updates) {
  const { error } = await supabase.from('discussions').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteDiscussion(id) {
  const { error } = await supabase.from('discussions').delete().eq('id', id);
  if (error) throw error;
}

export async function addReply(reply) {
  const { error } = await supabase.from('discussion_replies').insert(reply);
  if (error) throw error;
}

// ===== MESSAGES =====
export async function fetchConversationParticipants(userId) {
  const { data, error } = await supabase.from('conversation_participants').select('*').eq('user_id', userId);
  if (error) { console.error('fetchConvParts:', error); return []; }
  return data || [];
}

export async function fetchConversations(userId) {
  // Get conversation IDs for this user
  const myParts = await fetchConversationParticipants(userId);
  if (myParts.length === 0) return [];

  const convIds = myParts.map(p => p.conversation_id);

  const { data: convs } = await supabase.from('conversations').select('*').in('id', convIds);
  const { data: allParts } = await supabase.from('conversation_participants').select('*').in('conversation_id', convIds);
  const { data: msgs } = await supabase.from('messages').select('*').in('conversation_id', convIds).order('created_at');

  return (convs || []).map(c => ({
    ...c,
    participants: (allParts || []).filter(p => p.conversation_id === c.id),
    messages: (msgs || []).filter(m => m.conversation_id === c.id),
  }));
}

export async function startConversation(participants, isGroup, groupName) {
  const { data: conv, error } = await supabase
    .from('conversations')
    .insert({ is_group: isGroup, group_name: groupName })
    .select()
    .single();

  if (error) throw error;

  const participantRows = participants.map(uid => ({
    conversation_id: conv.id,
    user_id: uid,
  }));

  await supabase.from('conversation_participants').insert(participantRows);
  return conv.id;
}

export async function sendMessage(message) {
  const { error } = await supabase.from('messages').insert(message);
  if (error) throw error;
}

// ===== PERSONAL ALBUMS =====
export async function fetchAllAlbumCounts() {
  const { data, error } = await supabase
    .from('personal_album_photos')
    .select('user_id');
  if (error) { console.error('fetchAllAlbumCounts:', error); return {}; }
  const counts = {};
  (data || []).forEach(row => {
    counts[row.user_id] = (counts[row.user_id] || 0) + 1;
  });
  return counts;
}

export async function fetchAlbumPhotos(userId) {
  const { data, error } = await supabase
    .from('personal_album_photos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('fetchAlbumPhotos:', error); return []; }
  return data || [];
}

export async function addAlbumPhoto(photo) {
  const { error } = await supabase.from('personal_album_photos').insert(photo);
  if (error) throw error;
}

export async function updateAlbumPhoto(id, updates) {
  const { error } = await supabase.from('personal_album_photos').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteAlbumPhoto(id) {
  const { error } = await supabase.from('personal_album_photos').delete().eq('id', id);
  if (error) throw error;
}

// ===== TRAVEL PLANS =====
export async function fetchTravelPlans() {
  const { data, error } = await supabase.from('travel_plans').select('*').order('date_from');
  if (error) { console.error('fetchTravelPlans:', error); return []; }
  return data || [];
}

export async function addTravelPlan(plan) {
  const { data, error } = await supabase.from('travel_plans').insert(plan).select().single();
  if (error) throw error;
  return data;
}

export async function deleteTravelPlan(id) {
  const { error } = await supabase.from('travel_plans').delete().eq('id', id);
  if (error) throw error;
}

// ===== LOUNGE EVENTS =====
export async function fetchLoungeEvents() {
  const { data: events, error } = await supabase.from('lounge_events').select('*').order('event_date');
  if (error) { console.error('fetchLoungeEvents:', error); return []; }

  const { data: attendees } = await supabase.from('lounge_event_attendees').select('*');

  return (events || []).map(e => ({
    ...e,
    attendees: (attendees || []).filter(a => a.event_id === e.id),
  }));
}

export async function addLoungeEvent(event) {
  const { data, error } = await supabase.from('lounge_events').insert(event).select().single();
  if (error) throw error;
  return data;
}

export async function toggleEventAttendance(eventId, userId) {
  const { data } = await supabase
    .from('lounge_event_attendees')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_id', userId);

  if (data && data.length > 0) {
    await supabase.from('lounge_event_attendees').delete().eq('event_id', eventId).eq('user_id', userId);
  } else {
    await supabase.from('lounge_event_attendees').insert({ event_id: eventId, user_id: userId });
  }
}
