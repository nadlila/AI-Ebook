-- Additive migration: existing projects and sources are preserved.
ALTER TABLE ebook_app.projects ADD COLUMN IF NOT EXISTS research_payload text;
