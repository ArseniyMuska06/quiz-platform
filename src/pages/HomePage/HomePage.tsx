import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router"
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

    const [authStatus, setAuthStatus] = useState<
        "loading" | "guest" | "signedIn" | "error"
    >("loading")

    const [loggingOut, setLoggingOut] = useState(false)
    const [logoutError, setLogoutError] = useState("")

    useEffect(() => {
        const controller = new AbortController()

        async function checkSession() {
            try {
                const response = await fetch("/api/auth/me", {
                    signal: controller.signal,
                })

                if (controller.signal.aborted) return

                if (response.ok) {
                    setAuthStatus("signedIn")
                } else if (response.status === 401) {
                    setAuthStatus("guest")
                } else {
                    setAuthStatus("error")
                }
            } catch {
                if (!controller.signal.aborted) setAuthStatus("error")
            }
        }

        void checkSession()
        return () => controller.abort()
    }, [])

    async function logout() {
        if (loggingOut) return

        setLoggingOut(true)
        setLogoutError("")

        try {
            const response = await fetch("/api/auth/logout", { method: "POST" })

            if (!response.ok) {
                setLogoutError("Не вдалося вийти. Спробуй ще раз.")
                return
            }

            setAuthStatus("guest")
        } catch {
            setLogoutError("Не вдалося з’єднатися із сервером.")
        } finally {
            setLoggingOut(false)
        }
    }

    return (
        <>
            <header className="header">
                <div className="content">
                    <p className="quizora-logo">Quizora</p>
                    <div className="header-buttons">
                        {authStatus === "guest" && (
                            <>
                                <Link className="text-button" to="/login">Вхід</Link>
                                <Link className="text-button" to="/register">Реєстрація</Link>
                            </>
                        )}

                        {authStatus === "signedIn" && (
                            <>
                                <Link className="text-button" to="/my-tests">Мої тести</Link>
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