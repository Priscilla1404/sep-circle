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

// Upload base64 data URL to Storage (for avatar etc)
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

export async function getCurrentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// ===== PROFILES =====
export async function fetchProfiles() {
  const { data } = await supabase.from('profiles').select('*').order('name');
  return data || [];
}

export async function fetchProfile(userId) {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
  return data;
}

export async function updateProfile(userId, updates) {
  const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
  if (error) throw error;
}

// ===== POSTCARDS =====
export async function fetchPostcards() {
  const { data } = await supabase
    .from('postcards')
    .select('*, postcard_comments(*, profiles(id, name, avatar_url)), profiles(id, name, avatar_url)')
    .order('created_at', { ascending: false });
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
  const { data } = await supabase
    .from('books')
    .select('*, book_comments(*, profiles(id, name, avatar_url)), book_want_to_read(user_id), profiles(id, name, avatar_url)')
    .order('created_at', { ascending: false });
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
  const { data } = await supabase
    .from('discussions')
    .select('*, discussion_replies(*, profiles(id, name, avatar_url)), profiles(id, name, avatar_url)')
    .order('created_at', { ascending: false });
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
export async function fetchConversations(userId) {
  // Get conversation IDs for this user
  const { data: participations } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', userId);

  if (!participations || participations.length === 0) return [];

  const convIds = participations.map(p => p.conversation_id);
  const { data } = await supabase
    .from('conversations')
    .select('*, conversation_participants(user_id, profiles(id, name, avatar_url)), messages(*, profiles:sender_id(id, name, avatar_url))')
    .in('id', convIds)
    .order('created_at', { ascending: false });

  return data || [];
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
export async function fetchAlbumPhotos(userId) {
  const { data } = await supabase
    .from('personal_album_photos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
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

// ===== LOUNGE EVENTS =====
export async function fetchLoungeEvents() {
  const { data } = await supabase
    .from('lounge_events')
    .select('*, lounge_event_attendees(user_id), profiles:created_by(id, name, avatar_url)')
    .order('event_date', { ascending: true });
  return data || [];
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
