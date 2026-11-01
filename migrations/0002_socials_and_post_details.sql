-- Creators can list their socials, and a post can say more about itself.

ALTER TABLE users ADD COLUMN socials TEXT NOT NULL DEFAULT '{}'; -- JSON, see src/shared/socials.ts

ALTER TABLE collabs ADD COLUMN details TEXT NOT NULL DEFAULT '';
ALTER TABLE collabs ADD COLUMN requirements TEXT NOT NULL DEFAULT '';
ALTER TABLE collabs ADD COLUMN location TEXT NOT NULL DEFAULT '';
