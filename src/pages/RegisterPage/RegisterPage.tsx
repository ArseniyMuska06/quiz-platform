import { useState, type FormEvent } from "react"
import { Link, useLocation, useNavigate } from "react-router"
import '../../styles/Auth.css'

function RegisterPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const [error, setError] = useState("")
    const [submitting, setSubmitting] = useState(false)

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (submitting) return

        const form = new FormData(event.currentTarget)
        const account = {
            name: form.get("name"),
            email: form.get("email"),
            password: form.get("password"),
        }

        setError("")
        setSubmitting(true)

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(account),
            })

            if (!response.ok) {
                const data = await response.json()
                setError(data.error ?? "Не вдалося створити акаунт.")
                return
            }

            navigate("/login", { replace: true, state: location.state })
        } catch {
            setError("Не вдалося отримати відповідь від сервера.")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <>
            <header className="header">
                <div className="content">
                    <p className="quizora-logo">Quizora</p>
                    <div className="header-buttons">
                        <button type="button" className="text-button" onClick={() => navigate('/login')}>Вхід</button>
                    </div>
                </div>
            </header>

            <main className="main">
                <div className="content">
                    <div className="auth-card">
                        <h1>Реєстрація</h1>
                        <p className="auth-description">Зареєструйтеся, щоб створювати власні тести</p>

                        <form onSubmit={handleSubmit}>
                            <div className="auth-field">
                                <p>Ім'я користувача</p>
                                <input name="name" autoComplete="name" placeholder="Введіть ваше ім'я" required />
                            </div>

                            <div className="auth-field">
                                <p>Електронна пошта</p>
                                <input
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="name@example.com"
                                    required
                                />
                            </div>

                            <div className="auth-field">
                                <p>Пароль (щонайменше 15 символів)</p>
                                <input
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    minLength={15}
                                    placeholder="Введіть пароль"
                                    required
                                />
                            </div>

                            {error && <p className="error-message" role="alert">{error}</p>}

                            <button className="auth-submit-button" type="submit" disabled={submitting}>
                                {submitting ? "Створення акаунта…" : "Зареєструватися"}
                            </button>
                        </form>

                        <p className="auth-switch-link">
                            Уже маєш акаунт?{" "}
                            <Link className="purple-link" to="/login" state={location.state}>Увійти</Link>
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

export default RegisterPage