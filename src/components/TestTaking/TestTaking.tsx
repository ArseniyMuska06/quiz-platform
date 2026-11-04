import { useNavigate } from "react-router"
import { useState } from "react"
import type { TestType } from "../../utils/TestStorage"
import "./TestTaking.css"
import TestResults from "../TestResults/TestResults"

type TestInfoProps = {
    test: TestType
}

type AnswerType = number | number[] | string | null

function TestTaking({test} : TestInfoProps) {
    const navigate = useNavigate()

    const [questionNumber, setQuestionNumber] = useState(1)
    const [testAnswers, setTestAnswers] = useState<AnswerType[]>(
        () => Array(test.questions.length).fill(null)
    )

    const [showResults, setShowResults] = useState(false)
    const [showAllQuestions, setShowAllQuestions] = useState(false)

    const question = test.questions[questionNumber - 1]
    const currentAnswer = testAnswers[questionNumber - 1]

    const answeredCount = testAnswers.filter((answer) => {
        if (answer == null) return false
        if (Array.isArray(answer)) return answer.length > 0
        if (typeof answer == "string") return answer.trim() !== ""
        return true
    }).length

    return (
        showResults ? <TestResults test={test} testAnswers={testAnswers} /> : 

        <>
            <header className="header row-mode">
                <div className="content">
                    <p className="quizora-logo">Quizora</p>
                    <button className="text-button" onClick={() => navigate('/')}>Усі тести</button>
                </div>
            </header>

            <main className="main">
                <div className="content">
                    <div className="test-taking-head">
                        <p style={{fontWeight: 600}}>{test.name}</p>

                        <div className="test-taking-progress">
                            <p>Запитання {questionNumber} із {test.questions.length}</p>
                            <p style={{fontWeight: 600}}>{answeredCount}/{test.questions.length} відповідей</p>
                        </div>

                        <div className="test-taking-nav">
                            {test.questions.map((item, index) => {
                                if (index < 9 || showAllQuestions) {
                                    let isAnswered = false

                                    if (typeof testAnswers[index] === "number") {
                                        isAnswered = true
                                    }
                                    if (typeof testAnswers[index] === "string") {
                                        isAnswered = testAnswers[index].trim() !== ""
                                    }
                                    if (Array.isArray(testAnswers[index])) {
                                        isAnswered = testAnswers[index].length > 0
                                    }

                                    return <button className={(questionNumber === index + 1) ? "question-button-active" : isAnswered ? "question-button-selected" : "question-button"} key={item.id} onClick={() => setQuestionNumber(index + 1)}>{index + 1}</button>
                                }
                            })}

                            {(test.questions.length > 9 && !showAllQuestions) ? 
                            <button className="question-button" onClick={() => setShowAllQuestions(true)}>...</button> : null}
                        </div>
                    </div>

                    <div className="test-taking-main">
                        {question.type === "single" && <p className="question-type-label">одна правильна відповідь</p>}
                        {question.type === "multiple" && <p className="question-type-label">декілька правильних відповідей</p>}
                        {question.type === "text" && <p className="question-type-label">власна відповідь</p>}

                        <h1>{question.question}</h1>

                        {(question.type === "single") && (
                            <div className="single-answer-options">
                                {question.variants.map((item, index) => {
                                    return (
                                        <div className="single-answer" key={index}>
                                            <input type="radio" name={"ques_" + questionNumber} id={"variant_" + index} onChange={() => setTestAnswers((prev) => {
                                                    const updated = [...prev]
                                                    updated[questionNumber - 1] = index
                                                    return updated
                                            })} checked={testAnswers[questionNumber - 1] === index} />
                                            <label htmlFor={"variant_" + index}>{item}</label>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {(question.type === "multiple") && (
                            <div className="multiple-answer-options">
                                {question.variants.map((item, index) => {
                                    return (
                                        <div className="multiple-answer" key={index}>
                                            <input type="checkbox" name={"ques_" + questionNumber} id={"variant_" + index} onChange={(event) => {
                                                const checked = event?.currentTarget.checked

                                                setTestAnswers((prev) => {
                                                    const updated = [...prev]
                                                    const answer = updated[questionNumber - 1]
                                                    if (checked == true) {
                                                        if (Array.isArray(answer)) { 
                                                        updated[questionNumber - 1] = [...answer, index].sort((a,b) => a - b)
                                                        } else updated[questionNumber - 1] = [index]
                                                    } else {
                                                        if (Array.isArray(answer)) {
                                                            updated[questionNumber - 1] = answer.filter((item) => {
                                                                return item !== index
                                                            })
                                                        }
                                                    }
                                                    
                                                    return updated
                                                })
                                            }} checked={
                                                Array.isArray(currentAnswer) && currentAnswer.includes(index)
                                            } />
                                            <label htmlFor={"variant_" + index}>{item}</label>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {(question.type === "text") && (
                            <div className="text-answer">
                                <p>Ваша відповідь</p>
                                <input placeholder="Введіть відповідь" type="text" name={"ques_" + questionNumber} onChange={(e) => {
                                    setTestAnswers((prev) => {
                                        const updated = [...prev]
                                        updated[questionNumber - 1] = e.target.value
                                        return updated
                                    })
                                }} value={(typeof currentAnswer === "string") ? currentAnswer : ""} />
                            </div>
                        )}

                        <div className="test-taking-buttons">
                            <button className="prev-ques-button" onClick={() => setQuestionNumber(prev => prev-1)} disabled={questionNumber === 1}>Назад</button>
                            <button onClick={() => setQuestionNumber(prev => prev+1)} className={(questionNumber === test.questions.length) ? "non-display-button" : "next-ques-button"}>Далі</button>
                            <button onClick={() => {
                                setShowResults(true)
                            }} className={(questionNumber === test.questions.length) ? "finish-test-button" : "non-display-button"}>Завершити</button>
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

export default TestTaking