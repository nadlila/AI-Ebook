-- Run once against a new database/schema before starting the app.
CREATE SCHEMA IF NOT EXISTS ebook_app;
CREATE TABLE ebook_app.profiles (
 id uuid primary key, role varchar(16) not null check (role in ('AUTHOR','READER')),
 revision bigint not null default 0, created_at timestamp with time zone not null, updated_at timestamp with time zone not null
);

CREATE TABLE ebook_app.projects (
 id uuid primary key, owner_id uuid not null references ebook_app.profiles(id),
 type varchar(16) not null check (type in ('MODULE','EBOOK')),
 status varchar(32) not null check (status in ('DRAFT','RESEARCH_READY','OUTLINE_REVIEW','GENERATING','NEEDS_REVIEW','APPROVED','PUBLISHED','UNPUBLISHED')),
 title varchar(200) not null, description text, learning_goal text, audience varchar(500), target_level varchar(32),
 language varchar(64), writing_style varchar(100), content_length varchar(16), cover_image varchar(2048),
 approved_outline_id uuid, current_version_id uuid, approved_version_id uuid,
 revision bigint not null default 0, created_at timestamp with time zone not null, updated_at timestamp with time zone not null
);

CREATE TABLE ebook_app.sources (
 id uuid primary key, project_id uuid not null references ebook_app.projects(id), title varchar(200) not null,
 publisher varchar(200) not null, url varchar(2048) not null, excerpt text not null,
 selected boolean not null, locked boolean not null, access_date timestamp with time zone not null,
 check (not locked or selected),
 revision bigint not null default 0, created_at timestamp with time zone not null, updated_at timestamp with time zone not null
);

CREATE TABLE ebook_app.outlines (
 id uuid primary key, project_id uuid not null references ebook_app.projects(id), payload text not null, approved_at timestamp with time zone,
 revision bigint not null default 0, created_at timestamp with time zone not null, updated_at timestamp with time zone not null
);

CREATE TABLE ebook_app.content_versions (
 id uuid primary key, project_id uuid not null references ebook_app.projects(id), outline_id uuid not null references ebook_app.outlines(id), payload text not null, created_by uuid not null references ebook_app.profiles(id),
 revision bigint not null default 0, created_at timestamp with time zone not null, updated_at timestamp with time zone not null
);

CREATE TABLE ebook_app.quality_reports (
 id uuid primary key, project_id uuid not null references ebook_app.projects(id), content_version_id uuid not null references ebook_app.content_versions(id), payload text not null, passed boolean not null,
 revision bigint not null default 0, created_at timestamp with time zone not null, updated_at timestamp with time zone not null
);

CREATE TABLE ebook_app.publications (
 id uuid primary key, project_id uuid not null unique references ebook_app.projects(id),
 content_version_id uuid not null references ebook_app.content_versions(id), slug varchar(240) not null unique,
 title varchar(200) not null, description text, cover_image varchar(2048), published boolean not null, published_at timestamp with time zone not null,
 revision bigint not null default 0, created_at timestamp with time zone not null, updated_at timestamp with time zone not null
);

CREATE TABLE ebook_app.reader_progress (
 id uuid primary key, user_id uuid not null, publication_id uuid not null references ebook_app.publications(id),
 content_version_id uuid not null references ebook_app.content_versions(id), chapter_index integer not null check (chapter_index >= 0),
 completion integer not null check (completion between 0 and 100), unique(user_id, publication_id),
 revision bigint not null default 0, created_at timestamp with time zone not null, updated_at timestamp with time zone not null
);

CREATE TABLE ebook_app.issues (
 id uuid primary key, publication_id uuid not null references ebook_app.publications(id), reported_by uuid not null, block_id varchar(100), message varchar(2000) not null,
 revision bigint not null default 0, created_at timestamp with time zone not null, updated_at timestamp with time zone not null
);

CREATE TABLE ebook_app.audit_events (
 id uuid primary key, actor_id uuid not null, project_id uuid not null references ebook_app.projects(id), action varchar(80) not null, reference_id uuid,
 revision bigint not null default 0, created_at timestamp with time zone not null, updated_at timestamp with time zone not null
);

ALTER TABLE ebook_app.projects ADD CONSTRAINT fk_project_outline FOREIGN KEY (approved_outline_id) REFERENCES ebook_app.outlines(id);
ALTER TABLE ebook_app.projects ADD CONSTRAINT fk_project_current FOREIGN KEY (current_version_id) REFERENCES ebook_app.content_versions(id);
ALTER TABLE ebook_app.projects ADD CONSTRAINT fk_project_approved FOREIGN KEY (approved_version_id) REFERENCES ebook_app.content_versions(id);
CREATE INDEX ix_projects_owner ON ebook_app.projects(owner_id, updated_at);
CREATE INDEX ix_sources_project ON ebook_app.sources(project_id);
CREATE INDEX ix_outlines_project ON ebook_app.outlines(project_id, created_at);
CREATE INDEX ix_versions_project ON ebook_app.content_versions(project_id, created_at);
CREATE INDEX ix_quality_version ON ebook_app.quality_reports(content_version_id, created_at);
CREATE INDEX ix_publication_visible ON ebook_app.publications(published, published_at);
CREATE INDEX ix_audit_project ON ebook_app.audit_events(project_id, created_at);
