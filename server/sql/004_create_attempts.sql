CREATE TABLE attempts (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id integer NOT NULL REFERENCES users(id),
    test_id text NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    answers jsonb NOT NULL CHECK (jsonb_typeof(answers) = 'array'),
    question_count integer NOT NULL CHECK (question_count > 0),
    correct_count integer NOT NULL CHECK (
        correct_count BETWEEN 0 AND question_count
    ),
    completed_at timestamptz NOT NULL DEFAULT now()
);