-- SEP Circle Database Schema for Supabase

-- Profiles (extends Supabase auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null,
  country text default '',
  city text default '',
  title text default '',
  company text default '',
  bio text default '',
  avatar_url text default '',
  session text default 'SEP Flex 2025-2026',
  created_at timestamptz default now()
);

-- Postcards
create table postcards (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  image_url text not null,
  caption text default '',
  city text default '',
  country text default '',
  created_at timestamptz default now()
);

-- Postcard Comments
create table postcard_comments (
  id uuid default gen_random_uuid() primary key,
  postcard_id uuid references postcards(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  text text not null,
  created_at timestamptz default now()
);

-- Books
create table books (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  author text not null,
  cover_url text default '',
  reason text default '',
  created_at timestamptz default now()
);

-- Book Comments
create table book_comments (
  id uuid default gen_random_uuid() primary key,
  book_id uuid references books(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  text text not null,
  created_at timestamptz default now()
);

-- Book Want to Read
create table book_want_to_read (
  book_id uuid references books(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  primary key (book_id, user_id)
);

-- Discussions
create table discussions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  category text default 'General',
  created_at timestamptz default now()
);

-- Discussion Replies
create table discussion_replies (
  id uuid default gen_random_uuid() primary key,
  discussion_id uuid references discussions(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  text text not null,
  created_at timestamptz default now()
);

-- Conversations
create table conversations (
  id uuid default gen_random_uuid() primary key,
  is_group boolean default false,
  group_name text default '',
  created_at timestamptz default now()
);

-- Conversation Participants
create table conversation_participants (
  conversation_id uuid references conversations(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  primary key (conversation_id, user_id)
);

-- Messages
create table messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references conversations(id) on delete cascade not null,
  sender_id uuid references profiles(id) on delete cascade not null,
  text text not null,
  created_at timestamptz default now()
);

-- Personal Album Photos
create table personal_album_photos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  url text not null,
  caption text default '',
  created_at timestamptz default now()
);

-- Travel Plans
create table travel_plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  city text not null,
  country text default '',
  date_from date not null,
  date_to date,
  note text default '',
  created_at timestamptz default now()
);

-- Lounge Events
create table lounge_events (
  id uuid default gen_random_uuid() primary key,
  created_by uuid references profiles(id) on delete cascade not null,
  title text not null,
  description text default '',
  event_date date not null,
  event_time time not null,
  meet_link text default '',
  created_at timestamptz default now()
);

-- Lounge Event Attendees
create table lounge_event_attendees (
  event_id uuid references lounge_events(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  primary key (event_id, user_id)
);

-- ========================================
-- Row Level Security Policies
-- ========================================

alter table profiles enable row level security;
alter table postcards enable row level security;
alter table postcard_comments enable row level security;
alter table books enable row level security;
alter table book_comments enable row level security;
alter table book_want_to_read enable row level security;
alter table discussions enable row level security;
alter table discussion_replies enable row level security;
alter table conversations enable row level security;
alter table conversation_participants enable row level security;
alter table messages enable row level security;
alter table personal_album_photos enable row level security;
alter table travel_plans enable row level security;
alter table lounge_events enable row level security;
alter table lounge_event_attendees enable row level security;

-- Profiles: all authenticated can read, own user can update
create policy "Profiles are viewable by authenticated users" on profiles for select to authenticated using (true);
create policy "Users can update own profile" on profiles for update to authenticated using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert to authenticated with check (auth.uid() = id);

-- Postcards: all can read, owner can insert/update/delete
create policy "Postcards viewable by all" on postcards for select to authenticated using (true);
create policy "Users can create postcards" on postcards for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own postcards" on postcards for update to authenticated using (auth.uid() = user_id);
create policy "Users can delete own postcards" on postcards for delete to authenticated using (auth.uid() = user_id);

-- Postcard Comments
create policy "Postcard comments viewable by all" on postcard_comments for select to authenticated using (true);
create policy "Users can create comments" on postcard_comments for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can delete own comments" on postcard_comments for delete to authenticated using (auth.uid() = user_id);

-- Books
create policy "Books viewable by all" on books for select to authenticated using (true);
create policy "Users can create books" on books for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own books" on books for update to authenticated using (auth.uid() = user_id);
create policy "Users can delete own books" on books for delete to authenticated using (auth.uid() = user_id);

-- Book Comments
create policy "Book comments viewable by all" on book_comments for select to authenticated using (true);
create policy "Users can create book comments" on book_comments for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can delete own book comments" on book_comments for delete to authenticated using (auth.uid() = user_id);

-- Book Want to Read
create policy "Want to read viewable by all" on book_want_to_read for select to authenticated using (true);
create policy "Users can mark want to read" on book_want_to_read for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can unmark want to read" on book_want_to_read for delete to authenticated using (auth.uid() = user_id);

-- Discussions
create policy "Discussions viewable by all" on discussions for select to authenticated using (true);
create policy "Users can create discussions" on discussions for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own discussions" on discussions for update to authenticated using (auth.uid() = user_id);
create policy "Users can delete own discussions" on discussions for delete to authenticated using (auth.uid() = user_id);

-- Discussion Replies
create policy "Replies viewable by all" on discussion_replies for select to authenticated using (true);
create policy "Users can create replies" on discussion_replies for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can delete own replies" on discussion_replies for delete to authenticated using (auth.uid() = user_id);

-- Conversations: participants can read
create policy "Conversations viewable by participants" on conversations for select to authenticated using (
  id in (select conversation_id from conversation_participants where user_id = auth.uid())
);
create policy "Users can create conversations" on conversations for insert to authenticated with check (true);

-- Conversation Participants
create policy "Participants viewable by participants" on conversation_participants for select to authenticated using (
  conversation_id in (select conversation_id from conversation_participants cp where cp.user_id = auth.uid())
);
create policy "Users can add participants" on conversation_participants for insert to authenticated with check (true);

-- Messages: viewable by conversation participants
create policy "Messages viewable by participants" on messages for select to authenticated using (
  conversation_id in (select conversation_id from conversation_participants where user_id = auth.uid())
);
create policy "Users can send messages" on messages for insert to authenticated with check (auth.uid() = sender_id);

-- Personal Album Photos
create policy "Album photos viewable by all" on personal_album_photos for select to authenticated using (true);
create policy "Users can add own photos" on personal_album_photos for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own photos" on personal_album_photos for update to authenticated using (auth.uid() = user_id);
create policy "Users can delete own photos" on personal_album_photos for delete to authenticated using (auth.uid() = user_id);

-- Travel Plans
create policy "Travel plans viewable by all" on travel_plans for select to authenticated using (true);
create policy "Users can create travel plans" on travel_plans for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can delete own travel plans" on travel_plans for delete to authenticated using (auth.uid() = user_id);

-- Lounge Events
create policy "Lounge events viewable by all" on lounge_events for select to authenticated using (true);
create policy "Users can create events" on lounge_events for insert to authenticated with check (auth.uid() = created_by);
create policy "Users can update own events" on lounge_events for update to authenticated using (auth.uid() = created_by);
create policy "Users can delete own events" on lounge_events for delete to authenticated using (auth.uid() = created_by);

-- Lounge Event Attendees
create policy "Attendees viewable by all" on lounge_event_attendees for select to authenticated using (true);
create policy "Users can attend events" on lounge_event_attendees for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can unattend events" on lounge_event_attendees for delete to authenticated using (auth.uid() = user_id);

-- ========================================
-- Enable Realtime
-- ========================================
alter publication supabase_realtime add table postcards;
alter publication supabase_realtime add table postcard_comments;
alter publication supabase_realtime add table books;
alter publication supabase_realtime add table book_comments;
alter publication supabase_realtime add table book_want_to_read;
alter publication supabase_realtime add table discussions;
alter publication supabase_realtime add table discussion_replies;
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table personal_album_photos;
alter publication supabase_realtime add table travel_plans;
alter publication supabase_realtime add table lounge_events;
alter publication supabase_realtime add table lounge_event_attendees;
alter publication supabase_realtime add table profiles;

-- ========================================
-- Storage bucket for photos
-- ========================================
insert into storage.buckets (id, name, public) values ('photos', 'photos', true);

create policy "Authenticated users can upload photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'photos');

create policy "Anyone can view photos"
  on storage.objects for select to authenticated
  using (bucket_id = 'photos');

create policy "Users can delete own photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]);

-- ========================================
-- Auto-create profile on signup
-- ========================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
