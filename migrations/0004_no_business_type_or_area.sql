-- Businesses no longer record a type or an area: the owner removed both on 2 Nov 2026.
ALTER TABLE businesses DROP COLUMN area;
ALTER TABLE businesses DROP COLUMN type;
