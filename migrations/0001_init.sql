-- Schema only. Demo data is written by src/worker/demo/seed.ts so its dates stay relative to today.

CREATE TABLE cafes (
  id   TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  area TEXT NOT NULL
);

CREATE TABLE users (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('cafe_staff', 'creator')),
  cafe_id     TEXT REFERENCES cafes (id),
  handle      TEXT,
  avatar_seed TEXT NOT NULL,
  -- Staff always belong to a café, creators never do.
  CHECK ((role = 'cafe_staff') = (cafe_id IS NOT NULL))
);

CREATE TABLE collabs (
  id          TEXT PRIMARY KEY,
  cafe_id     TEXT NOT NULL REFERENCES cafes (id),
  title       TEXT NOT NULL,
  offer       TEXT NOT NULL,
  deliverable TEXT NOT NULL,
  spots       INTEGER NOT NULL CHECK (spots BETWEEN 1 AND 50),
  ends_on     TEXT NOT NULL, -- YYYY-MM-DD, inclusive, Asia/Bahrain
  created_by  TEXT NOT NULL REFERENCES users (id),
  created_at  TEXT NOT NULL
);

CREATE TABLE requests (
  id           TEXT PRIMARY KEY,
  collab_id    TEXT NOT NULL REFERENCES collabs (id),
  creator_id   TEXT NOT NULL REFERENCES users (id),
  pitch        TEXT NOT NULL CHECK (length(pitch) <= 140),
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'accepted', 'declined', 'submitted', 'done')),
  pass_code    TEXT,
  post_url     TEXT,
  created_at   TEXT NOT NULL,
  decided_at   TEXT,
  decided_by   TEXT REFERENCES users (id),
  submitted_at TEXT,
  completed_at TEXT,
  UNIQUE (collab_id, creator_id),
  -- Every status past accepted holds a spot, and a spot always comes with a pass.
  CHECK (status IN ('pending', 'declined') OR pass_code IS NOT NULL)
);

CREATE INDEX collabs_cafe ON collabs (cafe_id);
CREATE INDEX requests_collab_status ON requests (collab_id, status);
CREATE INDEX requests_creator ON requests (creator_id);

-- Holds the "last reset" note shown in the demo menu.
CREATE TABLE demo_meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
