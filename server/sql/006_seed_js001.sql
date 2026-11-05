INSERT INTO tests (id, author_id, name, description, visibility, questions)
VALUES (
    'js001',
    (SELECT id FROM users WHERE lower(email) = 'arsen@example.com'),
    'Основи JavaScript',
    'Короткий тест із трьох запитань про JavaScript.',
    'public',
    '[
        {
            "id": 1,
            "type": "single",
            "question": "Який метод додає елемент у кінець масиву?",
            "variants": ["pop()", "push()", "shift()"],
            "rightAnswer": 1
        },
        {
            "id": 2,
            "type": "multiple",
            "question": "Які значення мають тип boolean?",
            "variants": ["true", "false", "\"true\"", "1"],
            "rightAnswer": [0, 1]
        },
        {
            "id": 3,
            "type": "text",
            "question": "Яке ключове слово оголошує змінну, якій можна повторно присвоїти значення, з областю видимості блоку?",
            "rightAnswer": "let"
        }
    ]'::jsonb
)
ON CONFLICT (id) DO NOTHING;