import { useNavigate } from "react-router"
import type { TestType } from "../../utils/TestStorage"
import "./TestResults.css"

type AnswerType = number | number[] | string | null

export type AttemptResult = {
    attemptId: number
    correctCount: number
    questionCount: number
    percent: number
    correctByQuestion: boolean[]
    questions: TestType["questions"]
}

type ParamsType = {
    testName: string
    result: AttemptResult
    testAnswers: AnswerType[]
}

function TestResults({ testName, result, testAnswers }: ParamsType) {
    const navigate = useNavigate()

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
                    <div className="test-results-summary">
                        <p className="test-results-label">результат тесту</p>
                        <div className="test-results-info">
                            <div>
                                <h1>{testName}</h1>
                                <p className="test-results-count">Правильних відповідей: <span className="value">{result.correctCount} із {result.questionCount}</span></p>
                            </div>
                            <p className="test-results-percent">{result.percent}%</p>
                        </div>
                    </div>

                    <div className="test-results-review">
                        <div className="test-results-review-header">
                            <p className="test-results-review-title">Перегляд відповідей</p>
                            <p className="test-results-question-count">Запитань: {result.questionCount}</p>
                        </div>
                        <div className="answer-review-list">
                            {result.questions.map((item, index) => {
                                const yourVariant = testAnswers[index]

                                const skipped =
                                    yourVariant == null ||
                                    (Array.isArray(yourVariant) && yourVariant.length === 0) ||
                                    (typeof yourVariant === "string" && yourVariant.trim() === "")

                                const correct = result.correctByQuestion[index]
                                const statusClass = skipped ? "skipped" : correct ? "right" : "wrong"
                                const statusText = skipped ? "Пропущено" : correct ? "Правильно" : "Неправильно"

                                return (
                                    <div className="answer-review-card" key={item.id}>
                                        <p className="answer-review-number">{item.id}</p>

                                        <div className="answer-review-content">
                                            <div className="answer-review-header">
                                                <p className="answer-review-question"> {item.question}</p>

                                                <p className={`answer-review-status ${statusClass}`}>
                                                    {statusText}
                                                </p>

                                                {/* {(item.type === "single") && <p className={
                                                    typeof yourVariant === "number" ? (
                                                        (item.rightAnswer === yourVariant) ? "answer-review-status right" : "answer-review-status wrong"
                                                    ) : "answer-review-status skipped"
                                                }>
                                                    {
                                                        typeof yourVariant === "number" ? (
                                                            (item.rightAnswer === yourVariant) ? "Правильно" : "Неправильно"
                                                        ) : "Пропущено"
                                                    }
                                                </p>}

                                                {(item.type === "multiple") && <p className={
                                                    (Array.isArray(yourVariant) && yourVariant.length > 0) ? (
                                                        ((item.rightAnswer.length === yourVariant.length) && 
                                                        (item.rightAnswer.every((variant) => yourVariant.includes(variant)))) ? "answer-review-status right" : "answer-review-status wrong"
                                                    ) : "answer-review-status skipped"
                                                }>
                                                    {
                                                        (Array.isArray(yourVariant) && yourVariant.length > 0) ? (
                                                            ((item.rightAnswer.length === yourVariant.length) && 
                                                            (item.rightAnswer.every((variant) => yourVariant.includes(variant)))) ? "Правильно" : "Неправильно"
                                                        ) : "Пропущено"
                                                    }
                                                </p>}

                                                {(item.type === "text") && <p className={
                                                    (typeof yourVariant === "string" && yourVariant.trim() !== "") ? (
                                                        (item.rightAnswer.trim() === yourVariant.trim()) ? "answer-review-status right" : "answer-review-status wrong"
                                                    ) : "answer-review-status skipped"
                                                }>
                                                        {
                                                        (typeof yourVariant === "string" && yourVariant.trim() !== "") ? (
                                                            (item.rightAnswer.trim() === yourVariant.trim()) ? "Правильно" : "Неправильно"
                                                        ) : "Пропущено"
                                                    }    
                                                </p>} */}
                                            </div>

                                            <div className="answer-review-comparison">
                                                <div className="user-answer">
                                                    <p className="label">ваша відповідь</p>
                                                    <p>
                                                        {
                                                            item.type === "single" && (
                                                                typeof yourVariant === "number" ? (
                                                                    item.variants[yourVariant]
                                                                ) : "Відповіді немає"
                                                            )
                                                        }

                                                        {
                                                            item.type === "multiple" && (
                                                                (Array.isArray(yourVariant) && yourVariant.length > 0) ? (
                                                                    yourVariant.map((variant) => {
                                                                        return item.variants[variant]
                                                                    }).join(", ")
                                                                ) : "Відповіді немає"
                                                            )
                                                        }

                                                        {
                                                            item.type === "text" && (
                                                                typeof yourVariant === "string" && yourVariant.trim() !== "" ? yourVariant : "Відповіді немає"
                                                            )
                                                        }
                                                    </p>
                                                </div>

                                                <div className="right-answer">
                                                    <p className="label">правильна відповідь</p>
                                                    <p>
                                                        {
                                                            item.type === "single" && item.variants[item.rightAnswer]
                                                        }

                                                        {
                                                            item.type === "multiple" && (
                                                                item.rightAnswer.map((variant) => {
                                                                    return item.variants[variant]
                                                                }).join(", ")
                                                            )
                                                        }

                                                        {
                                                            item.type === "text" && item.rightAnswer
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )})}
                            </div>
                        <button className="go-to-home-button" onClick={() => navigate('/')}>На головну</button>
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

export default TestResults