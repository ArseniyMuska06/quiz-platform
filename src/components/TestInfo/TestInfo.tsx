import { useNavigate } from "react-router"
import type { TestType } from "../../utils/TestStorage"
import { UserStats } from "../../utils/UserStats"
import "./TestInfo.css"

type TestInfoProps = {
    test: TestType
    setTestAction: (value: boolean) => void
}

function TestInfo({setTestAction, test} : TestInfoProps) {
    const navigate = useNavigate()

    const stats = UserStats()
    const testStats = stats.find((item) => {return item.id === test.id})

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
                            <p className="test-question-count">запитань {test.questions.length}</p>
                            <h1>{test.name}</h1>
                            <p className="test-info-desc">{test.description}</p>
                        </div>

                        <div className="test-stats">
                            <div className="last-result">
                                <p className="text">Останній результат</p>
                                <p className="number">{testStats ? testStats.lastResult : 0}%</p>
                            </div>
                            <div className="best-result">
                                <p className="text">Найкращий результат</p>
                                <p className="number">{testStats ? testStats.bestResult : 0}%</p>
                            </div>
                        </div>

                        <div className="test-info-footer">
                            <button className="start-test-button" onClick={() => setTestAction(true)}>Розпочати</button>
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