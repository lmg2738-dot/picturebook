-- Storage buckets and policies for StorySeed AI

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('book-images', 'book-images', true, 10485760, array['image/png', 'image/jpeg', 'image/webp']),
  ('book-audio', 'book-audio', true, 5242880, array['audio/mpeg', 'audio/mp3']),
  ('book-pdfs', 'book-pdfs', true, 52428800, array['application/pdf'])
on conflict (id) do nothing;

-- Images: authenticated users upload to their folder
create policy "Users can upload book images"
  on storage.objects for insert
  with check (
    bucket_id = 'book-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Anyone can view book images"
  on storage.objects for select
  using (bucket_id = 'book-images');

create policy "Users can update own book images"
  on storage.objects for update
  using (
    bucket_id = 'book-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own book images"
  on storage.objects for delete
  using (
    bucket_id = 'book-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Audio
create policy "Users can upload book audio"
  on storage.objects for insert
  with check (
    bucket_id = 'book-audio'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Anyone can view book audio"
  on storage.objects for select
  using (bucket_id = 'book-audio');

create policy "Users can delete own book audio"
  on storage.objects for delete
  using (
    bucket_id = 'book-audio'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- PDFs
create policy "Users can upload book pdfs"
  on storage.objects for insert
  with check (
    bucket_id = 'book-pdfs'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Anyone can view book pdfs"
  on storage.objects for select
  using (bucket_id = 'book-pdfs');

create policy "Users can delete own book pdfs"
  on storage.objects for delete
  using (
    bucket_id = 'book-pdfs'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
