import { Link, useNavigate } from "react-router"
import { useEffect, useState, type FormEvent } from "react"

type QuestionDraft = {
    key: string
    question: string
    rightAnswer: string
}

function CreateTestPage() {
    const navigate = useNavigate()
    const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")

    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState("")

    const [questions, setQuestions] = useState<QuestionDraft[]>(() => [{
        key: crypto.randomUUID(),
        question: "",
        rightAnswer: "",
    }])

    function updateQuestion(
        key: string,
        field: "question" | "rightAnswer",
        value: string
    ) {
        setQuestions(previous => previous.map(question =>
            question.key === key
                ? { ...question, [field]: value }
                : question
        ))
    }

    function addQuestion() {
        setQuestions(previous => [
            ...previous,
            {
                key: crypto.randomUUID(),
                question: "",
                rightAnswer: "",
            },
        ])
    }

    function removeQuestion(key: string) {
        setQuestions(previous => {
            if (previous.length === 1) return previous
            return previous.filter(question => question.key !== key)
        })
    }

    useEffect(() => {
        const controller = new AbortController()

        async function checkSession() {
            try {
                const response = await fetch("/api/auth/me", {
                    signal: controller.signal,
                })

                if (controller.signal.aborted) return

                if (response.status === 401) {
                    navigate("/login", {
                        replace: true,
                        state: { from: "/create" },
                    })
                    return
                }

                setStatus(response.ok ? "ready" : "error")
            } catch {
                if (!controller.signal.aborted) setStatus("error")
            }
        }

        void checkSession()
        return () => controller.abort()
    }, [navigate])

    async function createTest(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (saving) return

        const form = new FormData(event.currentTarget)

        const test = {
            name: form.get("name"),
            description: form.get("description"),
            visibility: form.get("visibility"),
            questions: questions.map(question => ({
                type: "text",
                question: question.question,
                rightAnswer: question.rightAnswer,
            })),
        }

        setSaving(true)
        setSaveError("")

        try {
            const response = await fetch("/api/tests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(test),
            })

            if (response.status === 401) {
                setSaveError("Увійди в іншій вкладці та повтори збереження.")
                return
            }

            const data = await response.json()

            if (!response.ok) {
                setSaveError(data.error ?? "Не вдалося створити тест.")
                return
            }

            navigate(`/${data.id}`, { replace: true })
        } catch {
            setSaveError("Не вдалося отримати відповідь сервера. Перевір «Мої тести» в іншій вкладці перед повторним збереженням.")
        } finally {
            setSaving(false)
        }
    }

    if (status === "loading") return <p>Перевірка входу…</p>
    if (status === "error") return <p role="alert">Не вдалося перевірити вхід. Онови сторінку.</p>

    return (
        <main className="main">
            <div className="content">
                <Link to="/my-tests">Мої тести</Link>
                <h1>Створити тест</h1>

                <form onSubmit={createTest}>
                <fieldset disabled={saving}>
                    <legend>Інформація про тест</legend>

                    <p>
                        <label>
                            Назва тесту<br />
                            <input name="name" required />
                        </label>
                    </p>

                    <p>
                        <label>
                            Опис<br />
                            <textarea name="description" required />
                        </label>
                    </p>

                    <p>
                        <label>
                            Видимість<br />
                            <select name="visibility" defaultValue="private">
                                <option value="private">Особистий</option>
                                <option value="public">Публічний</option>
                            </select>
                        </label>
                    </p>
                </fieldset>

                <p>Кількість запитань: {questions.length}</p>

                {questions.map((question, index) => (
                    <fieldset key={question.key} disabled={saving}>
                        <legend>Запитання {index + 1} — текстова відповідь</legend>

                        <p>
                            <label>
                                Текст запитання<br />
                                <textarea
                                    value={question.question}
                                    onChange={event => updateQuestion(
                                        question.key,
                                        "question",
                                        event.target.value
                                    )}
                                    required
                                />
                            </label>
                        </p>

                        <p>
                            <label>
                                Правильна відповідь<br />
                                <input
                                    value={question.rightAnswer}
                                    onChange={event => updateQuestion(
                                        question.key,
                                        "rightAnswer",
                                        event.target.value
                                    )}
                                    required
                                />
                            </label>
                        </p>

                        <button
                            type="button"
                            onClick={() => removeQuestion(question.key)}
                            disabled={questions.length === 1}
                        >
                            Видалити запитання
                        </button>
                    </fieldset>
                ))}

                <button type="button" onClick={addQuestion} disabled={saving}>
                    Додати запитання
                </button>

                {saveError && <p role="alert">{saveError}</p>}

                <button type="submit" disabled={saving}>
                    {saving ? "Збереження…" : "Створити тест"}
                </button>
            </form>
            </div>
        </main>
    )
}

export default CreateTestPage