import { Link, useNavigate } from "react-router"
import { useEffect, useState, type FormEvent } from "react"

function CreateTestPage() {
    const navigate = useNavigate()
    const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")

    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState("")

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
            questions: [{
                type: "text",
                question: form.get("question"),
                rightAnswer: form.get("rightAnswer"),
            }],
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

                <fieldset disabled={saving}>
                    <legend>Запитання 1 — текстова відповідь</legend>

                    <p>
                        <label>
                            Текст запитання<br />
                            <textarea name="question" required />
                        </label>
                    </p>

                    <p>
                        <label>
                            Правильна відповідь<br />
                            <input name="rightAnswer" required />
                        </label>
                    </p>
                </fieldset>

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