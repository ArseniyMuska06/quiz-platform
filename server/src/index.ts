import express from "express"
import { pool } from "./db.js"
import * as argon2 from "argon2"
import session from "express-session"
import connectPgSimple from "connect-pg-simple"
import { gradeTest } from "./GradeTest.js"
import { randomUUID } from "node:crypto"
import { validateTest } from "./validateTest.js"

const app = express()
app.use(express.json())
const port = 3001

declare module "express-session" {
    interface SessionData {
        userId?: number
    }
}

const sessionSecret = process.env.SESSION_SECRET

if (!sessionSecret) {
    throw new Error("Додай SESSION_SECRET у server/.env")
}

const PgSessionStore = connectPgSimple(session)

app.use(session({
    name: "quizora.sid",
    secret: sessionSecret,
    store: new PgSessionStore({
        pool,
        createTableIfMissing: true
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000
    }
}))

app.get("/api/health", (_request, response) => {
    response.json({ status: "ok" })
})

app.get("/api/db-check", async (_request, response) => {
    try {
        const result = await pool.query(
            "SELECT current_database() AS database, current_user AS username"
        )

        response.json(result.rows[0])
    } catch (error) {
        console.error("Помилка підключення до PostgreSQL:", error)
        response.status(500).json({ error: "Не вдалося виконати запит до бази" })
    }
})

app.post("/api/auth/register", async (request, response) => {
    const body = request.body ?? {}
    const name = typeof body.name === "string" ? body.name.trim() : ""
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
    const password = body.password

    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        response.status(400).json({ error: "Введи ім’я та коректний email" })
        return
    }

    if (typeof password !== "string" || password.length < 15) {
        response.status(400).json({ error: "Пароль має містити щонайменше 15 символів" })
        return
    }

    try {
        const passwordHash = await argon2.hash(password)

        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash)
             VALUES ($1, $2, $3)
             ON CONFLICT (lower(email)) DO NOTHING
             RETURNING id, name, email`,
            [name, email, passwordHash]
        )

        if (result.rows.length === 0) {
            response.status(409).json({ error: "Цей email уже зареєстровано" })
            return
        }

        response.status(201).json(result.rows[0])
    } catch (error) {
        console.error("Помилка реєстрації:", error)
        response.status(500).json({ error: "Не вдалося створити акаунт" })
    }
})

app.post("/api/auth/login", async (request, response, next) => {
    const body = request.body ?? {}
    const email = typeof body.email === "string" ? body.email.trim() : ""
    const password = body.password

    if (!email || typeof password !== "string" || !password) {
        response.status(400).json({ error: "Введи email і пароль" })
        return
    }

    try {
        const result = await pool.query(
            `SELECT id, name, email, password_hash
             FROM users
             WHERE lower(email) = lower($1)`,
            [email]
        )

        const user = result.rows[0]

        if (!user || !(await argon2.verify(user.password_hash, password))) {
            response.status(401).json({ error: "Неправильний email або пароль" })
            return
        }

        request.session.regenerate((error) => {
            if (error) return next(error)

            request.session.userId = user.id

            request.session.save((saveError) => {
                if (saveError) return next(saveError)

                response.json({ id: user.id, name: user.name, email: user.email })
            })
        })
    } catch (error) {
        next(error)
    }
})

app.get("/api/auth/me", async (req, res, next) => {
    const userId = req.session.userId

    if (userId === undefined) {
        res.status(401).json({ error: "Потрібно увійти" })
        return
    }

    try {
        const result = await pool.query(
            "SELECT id, name FROM users WHERE id = $1",
            [userId]
        )

        const user = result.rows[0]

        if (!user) {
            res.status(401).json({ error: "Потрібно увійти" })
            return
        }

        res.json(user)
    } catch (error) {
        next(error)
    }
})

app.post("/api/auth/logout", (request, response, next) => {
    request.session.destroy((error) => {
        if (error) return next(error)

        response.clearCookie("quizora.sid", {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production"
        })

        response.sendStatus(204)
    })
})

app.get("/api/tests", async (_request, response, next) => {
    try {
        const result = await pool.query(`
            SELECT
                id,
                name,
                description,
                jsonb_array_length(questions) AS "questionCount"
            FROM tests
            WHERE visibility = 'public'
            ORDER BY name, id
        `)

        response.json(result.rows)
    } catch (error) {
        next(error)
    }
})

app.get("/api/me/tests", async (request, response, next) => {
    const userId = request.session.userId

    if (userId === undefined) {
        response.status(401).json({ error: "Щоб переглянути свої тести, увійди в акаунт." })
        return
    }

    try {
        const result = await pool.query(
            `SELECT
                 id,
                 name,
                 description,
                 visibility,
                 jsonb_array_length(questions) AS "questionCount"
             FROM tests
             WHERE author_id = $1
             ORDER BY name, id`,
            [userId]
        )

        response.json(result.rows)
    } catch (error) {
        next(error)
    }
})

app.get("/api/tests/:testId", async (request, response, next) => {
    try {
        const result = await pool.query(
            `SELECT
                 t.id,
                 t.name,
                 t.description,
                 u.name AS author,
                 jsonb_array_length(t.questions) AS "questionCount"
             FROM tests AS t
             JOIN users AS u ON u.id = t.author_id
             WHERE t.id = $1
               AND (t.visibility = 'public' OR t.author_id = $2)`,
            [request.params.testId, request.session.userId ?? null]
        )

        const test = result.rows[0]

        if (!test) {
            response.status(404).json({ error: "Тест не знайдено або він недоступний." })
            return
        }

        const userId = request.session.userId

        if (userId === undefined) {
            response.json({ ...test, stats: [] })
            return
        }

        const stats = await pool.query(
            `SELECT
                test_id AS id,
                ROUND(100.0 * correct_count / question_count) AS "lastResult",
                MAX(ROUND(100.0 * correct_count / question_count)) OVER () AS "bestResult"
            FROM attempts
            WHERE test_id = $1 AND user_id = $2
            ORDER BY completed_at DESC, attempts.id DESC
            LIMIT 1`,
            [test.id, userId]
        )

        response.json({
            ...test,
            stats: stats.rows.map(row => ({
                id: row.id,
                lastResult: Number(row.lastResult),
                bestResult: Number(row.bestResult),
            })),
        })
    } catch (error) {
        next(error)
    }
})

app.get("/api/tests/:testId/questions", async (request, response, next) => {
    const userId = request.session.userId

    if (userId === undefined) {
        response.status(401).json({ error: "Щоб пройти тест, увійди в акаунт." })
        return
    }

    try {
        const result = await pool.query(
            `SELECT id, questions
             FROM tests
             WHERE id = $1
               AND (visibility = 'public' OR author_id = $2)`,
            [request.params.testId, userId]
        )

        const test = result.rows[0]

        if (!test) {
            response.status(404).json({ error: "Тест не знайдено або він недоступний." })
            return
        }

        type StoredQuestion = {
            id: number
            type: "single" | "multiple" | "text"
            question: string
            variants?: string[]
        }

        const questions = test.questions.map((item: StoredQuestion) => ({
            id: item.id,
            type: item.type,
            question: item.question,
            ...(item.variants && { variants: item.variants }),
        }))

        response.json({ id: test.id, questions })
    } catch (error) {
        next(error)
    }
})

app.post("/api/tests/:testId/attempts", async (request, response, next) => {
    const userId = request.session.userId
    const testId = request.params.testId
    const answers: unknown = request.body?.answers

    if (userId === undefined) {
        response.status(401).json({ error: "Щоб завершити тест, увійди в акаунт." })
        return
    }

    if (!Array.isArray(answers)) {
        response.status(400).json({ error: "Очікується масив answers." })
        return
    }

    try {
        const result = await pool.query(
            `SELECT questions
             FROM tests
             WHERE id = $1 AND (visibility = 'public' OR author_id = $2)`,
            [testId, userId]
        )

        const test = result.rows[0]

        if (!test) {
            response.status(404).json({ error: "Тест не знайдено або він недоступний." })
            return
        }

        if (answers.length !== test.questions.length) {
            response.status(400).json({
                error: "Для кожного запитання передай відповідь або null.",
            })
            return
        }

        const score = gradeTest(test.questions, answers)

        const saved = await pool.query(
            `INSERT INTO attempts
                (user_id, test_id, answers, question_count, correct_count)
             VALUES ($1, $2, $3::jsonb, $4, $5)
             RETURNING id`,
            [
                userId,
                testId,
                JSON.stringify(answers),
                score.questionCount,
                score.correctCount,
            ]
        )

        response.status(201).json({
            attemptId: saved.rows[0].id,
            ...score,
            questions: test.questions,
        })
    } catch (error) {
        next(error)
    }
})

app.post("/api/tests", async (request, response, next) => {
    const authorId = request.session.userId

    if (authorId === undefined) {
        response.status(401).json({ error: "Щоб створити тест, увійди в акаунт." })
        return
    }

    const error = validateTest(request.body)

    if (error !== null) {
        response.status(400).json({ error })
        return
    }

    type QuestionInput = {
        type: "single" | "multiple" | "text"
        question: string
        variants?: string[]
        rightAnswer: number | number[] | string
    }

    const { name, description, visibility } = request.body
    const inputQuestions: QuestionInput[] = request.body.questions

    const questions = inputQuestions.map((item, index) => ({
        id: index + 1,
        type: item.type,
        question: item.question.trim(),
        ...(item.variants && item.type !== "text" ? { variants: item.variants.map(v => v.trim()) } : {}),
        rightAnswer: item.rightAnswer,
    }))

    try {
        const result = await pool.query(
            `INSERT INTO tests (id, author_id, name, description, visibility, questions)
             VALUES ($1, $2, $3, $4, $5, $6::jsonb)
             RETURNING id, name, visibility`,
            [
                randomUUID(),
                authorId,
                name.trim(),
                description.trim(),
                visibility,
                JSON.stringify(questions),
            ]
        )

        response.status(201).json(result.rows[0])
    } catch (error) {
        next(error)
    }
})

app.delete("/api/tests/:testId", async (request, response, next) => {
    const userId = request.session.userId

    if (userId === undefined) {
        response.status(401).json({ error: "Щоб видалити тест, увійди в акаунт." })
        return
    }

    try {
        const result = await pool.query(
            `DELETE FROM tests
             WHERE id = $1 AND author_id = $2
             RETURNING id`,
            [request.params.testId, userId]
        )

        if (result.rows.length === 0) {
            response.status(404).json({
                error: "Тест не знайдено або ти не є його автором.",
            })
            return
        }

        response.sendStatus(204)
    } catch (error) {
        next(error)
    }
})

app.listen(port, () => {
    console.log(`Quizora API запущено на http://localhost:${port}`)
})