BEGIN;

-- Otomatis membuat profil aplikasi saat akun Supabase dibuat.
CREATE OR REPLACE FUNCTION ebook_app.create_author_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO ebook_app.profiles (
    id, role, revision, created_at, updated_at
  )
  VALUES (
    NEW.id, 'AUTHOR', 0, now(), now()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    role = 'AUTHOR',
    revision = ebook_app.profiles.revision + 1,
    updated_at = now();

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION ebook_app.create_author_profile()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS ebook_app_author_on_signup ON auth.users;

CREATE TRIGGER ebook_app_author_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION ebook_app.create_author_profile();

-- Lengkapi profil akun lama dan ubah READER menjadi AUTHOR.
INSERT INTO ebook_app.profiles (
  id, role, revision, created_at, updated_at
)
SELECT
  id, 'AUTHOR', 0, now(), now()
FROM auth.users
WHERE true
ON CONFLICT (id) DO UPDATE
SET
  role = 'AUTHOR',
  revision = ebook_app.profiles.revision + 1,
  updated_at = now()
WHERE ebook_app.profiles.role <> 'AUTHOR';

COMMIT;