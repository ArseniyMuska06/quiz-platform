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

                    {!loading && !error && (
                        <div className="tests-list">
                            {tests.map(test => (
                                <Link
                                    key={test.id}
                                    className="test-preview"
                                    to={`/${test.id}`}
                                >
                                    <div>
                                        <strong>{test.name}</strong>
                                        <p>{test.description}</p>
                                        <p>Кількість запитань: {test.questionCount}</p>
                                        <p>
                                            {test.visibility === "public"
                                                ? "Публічний"
                                                : "Особистий"}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </>
    )
}

export default MyTestsPage