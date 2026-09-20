-- Ganti UUID dengan ID user yang sudah dibuat di Supabase Authentication > Users.
-- Jalankan hanya sebagai database owner. Tidak ada endpoint self-promotion menjadi author.
INSERT INTO ebook_app.profiles (id, role, revision, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', 'AUTHOR', 0, now(), now())
ON CONFLICT (id) DO UPDATE SET role = 'AUTHOR', revision = ebook_app.profiles.revision + 1, updated_at = now();
