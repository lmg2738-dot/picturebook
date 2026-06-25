-- StorySeed 통합 Storage 버킷 (책 JSON + 삽화 + PDF)
-- Supabase Dashboard → SQL Editor 에서 실행하거나 supabase db push

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'storyseed',
  'storyseed',
  true,
  52428800,
  array[
    'application/json',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/svg+xml',
    'audio/mpeg',
    'application/pdf'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 공개 읽기 (삽화·PDF URL 접근)
create policy "Public read storyseed objects"
  on storage.objects for select
  using (bucket_id = 'storyseed');

-- service_role 키는 RLS를 우회하므로 서버 업로드/삭제는 별도 정책 없이 동작합니다.
