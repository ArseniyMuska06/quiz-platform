import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router"

type MyTest = {
    id: string
    name: string
    description: string
    questionCount: number
    visibility: "public" | "private"
}

function MyTestsPage() {
    const navigate = useNavigate()
    const [tests, setTests] = useState<MyTest[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [retry, setRetry] = useState(0)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [deleteError, setDeleteError] = useState("")

    useEffect(() => {
        const controller = new AbortController()

        async function loadTests() {
            setLoading(true)
            setError("")

            try {
                const response = await fetch("/api/me/tests", {
                    signal: controller.signal,
                })

                if (response.status === 401) {
                    navigate("/login", {
                        replace: true,
                        state: { from: "/my-tests" },
                    })
                    return
                }

                if (!response.ok) {
                    throw new Error("Не вдалося завантажити тести.")
                }

                const data: MyTest[] = await response.json()
                if (!controller.signal.aborted) setTests(data)
            } catch {
                if (!controller.signal.aborted) {
                    setError("Не вдалося завантажити твої тести.")
                }
            } finally {
                if (!controller.signal.aborted) setLoading(false)
            }
        }

        void loadTests()
        return () => controller.abort()
    }, [navigate, retry])

    async function deleteTest(test: MyTest) {
        if (deletingId !== null) return

        const confirmed = window.confirm(
            `Видалити тест «${test.name}»? Усі результати його проходження також буде видалено. Цю дію неможливо скасувати.`
        )

        if (!confirmed) return

        setDeletingId(test.id)
        setDeleteError("")

        try {
            const response = await fetch(
                `/api/tests/${encodeURIComponent(test.id)}`,
                { method: "DELETE" }
            )

            if (response.status === 401) {
                navigate("/login", { state: { from: "/my-tests" } })
                return
            }

            if (!response.ok) {
                setDeleteError("Не вдалося видалити тест. Онови список і спробуй ще раз.")
                return
            }

            setTests(previous => previous.filter(item => item.id !== test.id))
        } catch {
            setDeleteError("Не вдалося отримати відповідь сервера. Онови список, щоб перевірити результат.")
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <>
            <header className="header row-mode">
                <div className="content">
                    <Link className="quizora-logo" to="/">Quizora</Link>
                    <Link className="text-button" to="/">Усі тести</Link>
                </div>
            </header>

            <main className="main">
                <div className="content">
                    <h1 className="home-title">Мої тести</h1>

                    <Link className="create-test-button" to="/create">
                        Створити тест
                    </Link>

                    {loading && <p>Завантаження тестів…</p>}

                    {error && (
                        <div>
                            <p role="alert">{error}</p>
                            <button onClick={() => setRetry(value => value + 1)}>
                                Спробувати ще раз
                            </button>
                        </div>
                    )}

                    {!loading && !error && tests.length === 0 && (
                        <p>Ти ще не створив жодного тесту.</p>
                    )}

                    {deleteError && <p role="alert">{deleteError}</p>}

                    {!loading && !error && (
                        <div className="tests-list">
                            {tests.map(test => (
                                <div key={test.id}>
                                    <Link className="test-preview" to={`/${test.id}`}>
                                        <div>
                                            <strong>{test.name}</strong>
                                            <p>{test.description}</p>
                                            <p>Кількість запитань: {test.questionCount}</p>
                                            <p>
                                                {test.visibility === "public" ? "Публічний" : "Особистий"}
                                            </p>
                                        </div>
                                    </Link>

                                    <button
                                        type="button"
                                        className="text-button"
                                        onClick={() => deleteTest(test)}
                                        disabled={deletingId !== null}
                                    >
                                        {deletingId === test.id ? "Видалення…" : "Видалити"}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </>
    )
}

export default MyTestsPage