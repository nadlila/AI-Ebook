ALTER TABLE ebook_app.projects ADD COLUMN target_levels varchar(64);
UPDATE ebook_app.projects SET target_levels = target_level WHERE target_levels IS NULL;
