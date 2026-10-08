-- Preserve existing URLs while allowing small, normalized cover images.
ALTER TABLE ebook_app.projects ALTER COLUMN cover_image TYPE text;
ALTER TABLE ebook_app.publications ALTER COLUMN cover_image TYPE text;
