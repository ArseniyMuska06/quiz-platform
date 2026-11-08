import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import './MyTestsPage.css'

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
                    <p className="quizora-logo">Quizora</p>
                    <button type="button" className="text-button" onClick={() => navigate('/')}>Усі тести</button>
                </div>
            </header>

            <main className="main my-tests-page">
                <div className="content my-tests-page">
                    <div className="my-tests-header">
                        <h1 className="my-tests-title">Мої тести</h1>
                        <button type="button" className="create-test-button" onClick={() => navigate('/create')}>Створити тест</button>
                    </div>

                    {loading && <p>Завантаження тестів…</p>}

                    {error && (
                        <div className="my-tests-error-state">
                            <h2>Помилка</h2>
                            <p role="alert">{error}</p>
                            <button onClick={() => setRetry(value => value + 1)}>
                                Спробувати ще раз
                            </button>
                        </div>
                    )}

                    {!loading && !error && tests.length === 0 && (
                        <div className="my-tests-empty-state">
                            <h2>У вас ще немає тестів</h2>
                            <p>Створіть перший тест і додайте запитання з потрібними типами відповідей</p>
                            <button type="button" className="create-test-button" onClick={() => navigate('/create')}>Створити перший тест</button>
                        </div>
                    )}

                    {deleteError && <p role="alert">{deleteError}</p>}

                    {!loading && !error && (
                        <div className="tests-list">
                            {tests.map(test => (
                                <div className="created-test-preview" key={test.id}>
                                    <div className="test-preview" onClick={() => navigate(`/${test.id}`)} key={test.id}>
                                        <p>{test.name}</p>
                                        <p className="visibility">
                                            {test.visibility === "public" ? "Публічний" : "Особистий"}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        className="delete-test-button"
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

            <footer className="footer">
                <div className="content">
                    <p>Quizora — створюй тести та перевіряй знання</p>
                    <p>© 2026 Quizora</p>
                </div>
            </footer>
        </>
    )
}

export default MyTestsPage