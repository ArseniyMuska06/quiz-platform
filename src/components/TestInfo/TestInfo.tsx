import { useNavigate } from "react-router"
import { useState } from "react"
import TestTaking, { type TakingQuestion } from "../TestTaking/TestTaking"
import "./TestInfo.css"

export type TestDetails = {
    id: string
    name: string
    description: string
    author: string
    questionCount: number
    stats: {
        id: string
        lastResult: number
        bestResult: number
    }[]
}

function TestInfo({ test }: { test: TestDetails }) {
    const navigate = useNavigate()

    const stats = test.stats[0]

    const [questions, setQuestions] = useState<TakingQuestion[] | null>(null)
    const [starting, setStarting] = useState(false)
    const [startError, setStartError] = useState("")

    async function startTest() {
        if (starting) return

        setStarting(true)
        setStartError("")

        try {
            const response = await fetch(
                `/api/tests/${encodeURIComponent(test.id)}/questions`
            )

            if (response.status === 401) {
                navigate("/login", { state: { testId: test.id } })
                return
            }

            if (!response.ok) {
                setStartError("Не вдалося завантажити запитання. Спробуй ще раз.")
                return
            }

            const data: { questions: TakingQuestion[] } = await response.json()
            setQuestions(data.questions)
        } catch {
            setStartError("Не вдалося з’єднатися із сервером.")
        } finally {
            setStarting(false)
        }
    }

    if (questions !== null) {
        return (
            <TestTaking
                key={test.id}
                test={{ id: test.id, name: test.name, questions }}
            />
        )
    }

    return (
        <>
            <header className="header row-mode">
                <div className="content">
                    <p className="quizora-logo">Quizora</p>
                    <button className="text-button" onClick={() => navigate('/')}>Усі тести</button>
                </div>
            </header>

            <main className="main">
                <div className="content">
                    <div className="test-info">
                        <div className="test-info-header">
                            <p className="test-question-count">запитань {test.questionCount}</p>
                            <h1>{test.name}</h1>
                            <p className="test-info-desc">{test.description}</p>
                            <p className="test-info-author">Автор: {test.author}</p>
                        </div>

                        {stats && (
                            <div className="test-stats">
                                <div className="last-result">
                                    <p className="text">Останній результат</p>
                                    <p className="number">{stats.lastResult}%</p>
                                </div>

                                <div className="best-result">
                                    <p className="text">Найкращий результат</p>
                                    <p className="number">{stats.bestResult}%</p>
                                </div>
                            </div>
                        )}

                        <div className="test-info-footer">
                            {startError && <p role="alert">{startError}</p>}

                            <button
                                className="start-test-button"
                                onClick={startTest}
                                disabled={starting}
                            >
                                {starting ? "Завантаження…" : "Розпочати"}
                            </button>
                        </div>
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

export default TestInfo