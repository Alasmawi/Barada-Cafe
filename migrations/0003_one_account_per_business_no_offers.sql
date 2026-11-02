-- Every post is a collab, and a business has exactly one account.

ALTER TABLE collabs DROP COLUMN kind;

-- Hand anything a second account did to the business's first account, then remove the rest.
UPDATE collabs
SET created_by = (SELECT MIN(id) FROM users WHERE users.business_id = collabs.business_id);

UPDATE requests
SET decided_by = (
  SELECT MIN(first.id) FROM users AS first
  JOIN users AS acted ON acted.business_id = first.business_id
  WHERE acted.id = requests.decided_by
)
WHERE decided_by IS NOT NULL;

UPDATE requests
SET invited_by = (
  SELECT MIN(first.id) FROM users AS first
  JOIN users AS acted ON acted.business_id = first.business_id
  WHERE acted.id = requests.invited_by
)
WHERE invited_by IS NOT NULL;

DELETE FROM sessions WHERE user_id IN (
  SELECT id FROM users
  WHERE business_id IS NOT NULL
    AND id <> (SELECT MIN(other.id) FROM users AS other WHERE other.business_id = users.business_id)
);

DELETE FROM users
WHERE business_id IS NOT NULL
  AND id <> (SELECT MIN(other.id) FROM users AS other WHERE other.business_id = users.business_id);

CREATE UNIQUE INDEX users_one_per_business ON users (business_id);
