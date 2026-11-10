import { useState, type FormEvent } from "react"
import { Link, useLocation, useNavigate } from "react-router"
import '../../styles/Auth.css'

function LoginPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (loading) return

        setError("")
        setLoading(true)

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            })

            if (response.status === 401) {
                setError("Неправильний email або пароль.")
                return
            }

            if (!response.ok) {
                setError("Не вдалося увійти. Спробуй ще раз.")
                return
            }

            const testId = location.state?.testId
            let destination = "/"

            if (typeof testId === "string") {
                destination = `/${encodeURIComponent(testId)}`
            } else if (location.state?.from === "/my-tests" || location.state?.from === "/create") {
                destination = location.state.from
            }

            navigate(destination, { replace: true })
        } catch {
            setError("Не вдалося з’єднатися із сервером.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <header className="header">
                <div className="content">
                    <p className="quizora-logo">Quizora</p>
                    <div className="header-buttons">
                        <button type="button" className="text-button" onClick={() => navigate('/register')}>Реєстрація</button>
                    </div>
                </div>
            </header>

            <main className="main">
                <div className="content">
                    <div className="auth-card">
                        <h1>Вхід</h1>
                        <p className="auth-description">Увійдіть, щоб створювати та керувати власними тестами</p>

                        <form onSubmit={handleSubmit}>
                            <div className="auth-field">
                                <p>Електронна пошта</p>
                                <input
                                    type="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={event => setEmail(event.target.value)}
                                    placeholder="name@example.com"
                                    required
                                />
                            </div>

                            <div className="auth-field">
                                <p>Пароль</p>
                                <input
                                    type="password"
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={event => setPassword(event.target.value)}
                                    placeholder="Введіть пароль"
                                    required
                                />
                            </div>

                            {error && <p className="error-message" role="alert">{error}</p>}

                            <button className="auth-submit-button" type="submit" disabled={loading}>
                                {loading ? "Входимо…" : "Увійти"}
                            </button>
                        </form>

                        <p className="auth-switch-link">
                            Ще не маєте акаунта?{" "}
                            <Link className="purple-link" to="/register" state={location.state}>Зареєструватися</Link>
                        </p>
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

export default LoginPage