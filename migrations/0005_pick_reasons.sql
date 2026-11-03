-- AI reasons for "Picked for you", saved per creator, collab and day, so each costs one AI call a day.
CREATE TABLE pick_reasons (
  creator_id TEXT NOT NULL REFERENCES users (id),
  collab_id  TEXT NOT NULL REFERENCES collabs (id),
  day        TEXT NOT NULL, -- YYYY-MM-DD, Asia/Bahrain
  reason     TEXT,          -- null when the AI gave nothing usable, so it isn't asked again that day
  PRIMARY KEY (creator_id, collab_id, day)
);
