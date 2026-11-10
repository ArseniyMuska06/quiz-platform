import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { useAuth } from "../../hooks/useAuth"
import "./HomePage.css"

type TestCard = {
    id: string
    name: string
    description: string
    questionCount: number
}

function HomePage() {
    const navigate = useNavigate()
    const [tests, setTests] = useState<TestCard[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [retry, setRetry] = useState(0)

    useEffect(() => {
        const controller = new AbortController()

        async function loadTests() {
            setLoading(true)
            setError("")

            try {
                const response = await fetch("/api/tests", {
                    signal: controller.signal,
                })

                if (!response.ok) {
                    throw new Error("Не вдалося завантажити тести")
                }

                const data: TestCard[] = await response.json()
                if (!controller.signal.aborted) {
                    setTests(data)
                }
            } catch {
                if (!controller.signal.aborted) {
                    setError("Не вдалося завантажити тести.")
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false)
                }
            }
        }

        void loadTests()
        return () => controller.abort()
    }, [retry])

    const { user, authStatus, logout, loggingOut, logoutError } = useAuth()

    return (
        <>
            <header className="header">
                <div className="content">
                    <p className="quizora-logo">Quizora</p>
                    <div className="header-buttons">
                        {authStatus === "guest" && (
                            <>
                                <button type="button" className="text-button" onClick={() => navigate('/login')}>Вхід</button>
                                <button type="button" className="register-test-button" onClick={() => navigate('/register')}>Реєстрація</button>
                            </>
                        )}

                        {authStatus === "signedIn" && user && (
                            <>
                                <p className="header-user-name">{user.name}</p>

                                <button type="button" className="text-button" onClick={() => navigate('/my-tests')}>
                                    Мої тести
                                </button>

                                <button
                                    type="button"
                                    className="text-button"
                                    onClick={logout}
                                    disabled={loggingOut}
                                >
                                    {loggingOut ? "Виходимо…" : "Вихід"}
                                </button>
                            </>
                        )}

                        {authStatus === "error" && (
                            <span role="alert">Не вдалося перевірити вхід. Онови сторінку.</span>
                        )}

                        {logoutError && <span role="alert">{logoutError}</span>}
                    </div>
                </div>
            </header>

            <main className="main">
                <div className="content">
                    <h1 className="home-title">Усі тести</h1>

                    <div className="tests-list">
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
                            <p>Публічних тестів поки немає.</p>
                        )}

                        {!loading && !error && tests.map(test => (
                            <div className="test-preview" onClick={() => navigate(`/${test.id}`)} key={test.id}>
                                <p>{test.name}</p>
                            </div>
                        ))}
                    </div>
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

export default HomePage