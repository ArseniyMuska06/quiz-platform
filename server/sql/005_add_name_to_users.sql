ALTER TABLE users
    ADD COLUMN name text NOT NULL
    CHECK (btrim(name) <> '');