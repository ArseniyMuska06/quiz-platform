import { useEffect, useState } from "react"

type CurrentUser = {
    id: number
    name: string
}

type AuthStatus = "loading" | "guest" | "signedIn" | "error"

export function useAuth() {
    const [user, setUser] = useState<CurrentUser | null>(null)
    const [authStatus, setAuthStatus] = useState<AuthStatus>("loading")
    const [loggingOut, setLoggingOut] = useState(false)
    const [logoutError, setLogoutError] = useState("")

    useEffect(() => {
        const controller = new AbortController()
        const { signal } = controller

        async function checkSession() {
            try {
                const response = await fetch("/api/auth/me", { signal })
                if (signal.aborted) return

                if (response.status === 401) {
                    setAuthStatus("guest")
                    return
                }

                if (!response.ok) {
                    setAuthStatus("error")
                    return
                }

                const currentUser: CurrentUser = await response.json()
                if (signal.aborted) return

                setUser(currentUser)
                setAuthStatus("signedIn")
            } catch {
                if (!signal.aborted) setAuthStatus("error")
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

            setUser(null)
            setAuthStatus("guest")
        } catch {
            setLogoutError("Не вдалося з’єднатися із сервером.")
        } finally {
            setLoggingOut(false)
        }
    }

    return { user, authStatus, logout, loggingOut, logoutError }
}