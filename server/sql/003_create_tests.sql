CREATE TABLE tests (
    id text PRIMARY KEY,
    author_id integer NOT NULL REFERENCES users(id),
    name text NOT NULL CHECK (btrim(name) <> ''),
    description text NOT NULL CHECK (btrim(description) <> ''),
    visibility text NOT NULL CHECK (visibility IN ('public', 'private')),
    questions jsonb NOT NULL CHECK (
        jsonb_typeof(questions) = 'array'
        AND questions <> '[]'::jsonb
    )
);