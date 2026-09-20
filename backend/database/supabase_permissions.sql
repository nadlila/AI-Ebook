-- Jalankan setelah V001, melalui Supabase SQL Editor (database owner).
-- ebook_app harus tetap TIDAK masuk daftar Exposed schemas Supabase Data API.
REVOKE ALL ON SCHEMA ebook_app FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA ebook_app FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA ebook_app REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;
-- Akses tabel melalui backend memakai role DB server saja, bukan token user/anon key.
