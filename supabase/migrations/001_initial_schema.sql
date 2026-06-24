-- StorySeed AI initial schema
-- Run via Supabase CLI: supabase db push

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users profile (extends auth.users)
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

-- Books
create table public.books (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users (id) on delete cascade,
  title text,
  child_name text not null,
  child_age int not null check (child_age between 1 and 12),
  favorite text not null,
  lesson text not null,
  status text not null default 'pending'
    check (status in ('pending', 'generating_story', 'generating_images', 'generating_audio', 'completed', 'failed')),
  progress int not null default 0 check (progress between 0 and 100),
  error_message text,
  pdf_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Book pages
create table public.book_pages (
  id uuid primary key default uuid_generate_v4(),
  book_id uuid not null references public.books (id) on delete cascade,
  page_no int not null check (page_no between 1 and 20),
  story text not null,
  image_prompt text,
  image_url text,
  audio_url text,
  created_at timestamptz not null default now(),
  unique (book_id, page_no)
);

-- Indexes
create index books_user_id_idx on public.books (user_id);
create index books_status_idx on public.books (status);
create index book_pages_book_id_idx on public.book_pages (book_id);

-- Updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger books_updated_at
  before update on public.books
  for each row execute function public.handle_updated_at();

-- Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security
alter table public.users enable row level security;
alter table public.books enable row level security;
alter table public.book_pages enable row level security;

-- Users policies
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- Books policies
create policy "Users can view own books"
  on public.books for select
  using (auth.uid() = user_id);

create policy "Users can insert own books"
  on public.books for insert
  with check (auth.uid() = user_id);

create policy "Users can update own books"
  on public.books for update
  using (auth.uid() = user_id);

create policy "Users can delete own books"
  on public.books for delete
  using (auth.uid() = user_id);

-- Book pages policies (via book ownership)
create policy "Users can view own book pages"
  on public.book_pages for select
  using (
    exists (
      select 1 from public.books
      where books.id = book_pages.book_id
        and books.user_id = auth.uid()
    )
  );

create policy "Users can insert own book pages"
  on public.book_pages for insert
  with check (
    exists (
      select 1 from public.books
      where books.id = book_pages.book_id
        and books.user_id = auth.uid()
    )
  );

create policy "Users can update own book pages"
  on public.book_pages for update
  using (
    exists (
      select 1 from public.books
      where books.id = book_pages.book_id
        and books.user_id = auth.uid()
    )
  );

create policy "Users can delete own book pages"
  on public.book_pages for delete
  using (
    exists (
      select 1 from public.books
      where books.id = book_pages.book_id
        and books.user_id = auth.uid()
    )
  );

-- Storage buckets (run in Supabase dashboard or via API)
-- insert into storage.buckets (id, name, public) values ('book-images', 'book-images', true);
-- insert into storage.buckets (id, name, public) values ('book-audio', 'book-audio', true);
-- insert into storage.buckets (id, name, public) values ('book-pdfs', 'book-pdfs', true);
