BEGIN;

ALTER TABLE users
    ADD COLUMN email text NOT NULL;

CREATE UNIQUE INDEX users_email_unique
    ON users (lower(email));

COMMIT;