import { useState, type FormEvent } from "react"
import { Link, useLocation, useNavigate } from "react-router"

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
        <main className="main">
            <div className="content">
                <Link to="/">Усі тести</Link>
                <h1>Реєстрація</h1>

                <form onSubmit={handleSubmit}>
                    <p>
                        <label>
                            Ім’я<br />
                            <input name="name" autoComplete="name" required />
                        </label>
                    </p>

                    <p>
                        <label>
                            Електронна пошта<br />
                            <input
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                            />
                        </label>
                    </p>

                    <p>
                        <label>
                            Пароль (щонайменше 15 символів)<br />
                            <input
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                minLength={15}
                                required
                            />
                        </label>
                    </p>

                    {error && <p role="alert">{error}</p>}

                    <button type="submit" disabled={submitting}>
                        {submitting ? "Створення акаунта…" : "Зареєструватися"}
                    </button>
                </form>

                <p>
                    Уже маєш акаунт?{" "}
                    <Link to="/login" state={location.state}>Увійти</Link>
                </p>
            </div>
        </main>
    )
}

export default RegisterPage