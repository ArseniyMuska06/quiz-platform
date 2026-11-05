import { useState, type FormEvent } from "react"
import { Link, useLocation, useNavigate } from "react-router"

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
            } else if (location.state?.from === "/my-tests") {
                destination = "/my-tests"
            }

            navigate(destination, { replace: true })
        } catch {
            setError("Не вдалося з’єднатися із сервером.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="main">
            <div className="content">
                <Link to="/">Усі тести</Link>
                <h1>Вхід у Quizora</h1>

                <form onSubmit={handleSubmit}>
                    <p>
                        <label>
                            Електронна пошта
                            <br />
                            <input
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={event => setEmail(event.target.value)}
                                required
                            />
                        </label>
                    </p>

                    <p>
                        <label>
                            Пароль
                            <br />
                            <input
                                type="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={event => setPassword(event.target.value)}
                                required
                            />
                        </label>
                    </p>

                    {error && <p role="alert">{error}</p>}

                    <button type="submit" disabled={loading}>
                        {loading ? "Входимо…" : "Увійти"}
                    </button>
                </form>
            </div>
        </main>
    )
}

export default LoginPage