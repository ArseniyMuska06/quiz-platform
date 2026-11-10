import { Link, Navigate, useNavigate } from "react-router"
import { useState, type FormEvent } from "react"
import { useAuth } from "../../hooks/useAuth"
import './CreateTestPage.css'

type QuestionType = "text" | "single" | "multiple"

type VariantDraft = {
    key: string
    text: string
    correct: boolean
}

type QuestionDraft = {
    key: string
    type: QuestionType
    question: string
    rightAnswer: string
    variants: VariantDraft[]
}

function createEmptyQuestion(): QuestionDraft {
    return {
        key: crypto.randomUUID(),
        type: "text",
        question: "",
        rightAnswer: "",
        variants: [
            { key: crypto.randomUUID(), text: "", correct: false },
            { key: crypto.randomUUID(), text: "", correct: false },
        ],
    }
}

function CreateTestPage() {
    const navigate = useNavigate()
    const { user, authStatus, logout, loggingOut } = useAuth()

    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState("")

    const [questions, setQuestions] = useState<QuestionDraft[]>(() => [
        createEmptyQuestion(),
    ])

    function updateQuestion(
        key: string,
        field: "question" | "rightAnswer",
        value: string
    ) {
        setQuestions(previous => previous.map(question =>
            question.key === key
                ? { ...question, [field]: value }
                : question
        ))
    }

    function addQuestion() {
        const question = createEmptyQuestion()
        setQuestions(previous => [...previous, question])
    }

    function removeQuestion(key: string) {
        setQuestions(previous => {
            if (previous.length === 1) return previous
            return previous.filter(question => question.key !== key)
        })
    }

    function changeQuestionType(key: string, type: QuestionType) {
        setQuestions(previous => previous.map(question => {
            if (question.key !== key) return question

            return {
                ...question,
                type,
                variants: question.variants.map(variant => ({
                    ...variant,
                    correct: false,
                })),
            }
        }))
    }

    function updateVariant(questionKey: string, variantKey: string, text: string) {
        setQuestions(previous => previous.map(question => {
            if (question.key !== questionKey) return question

            return {
                ...question,
                variants: question.variants.map(variant =>
                    variant.key === variantKey ? { ...variant, text } : variant
                ),
            }
        }))
    }

    function selectVariant(questionKey: string, variantKey: string, checked: boolean) {
        setQuestions(previous => previous.map(question => {
            if (question.key !== questionKey) return question

            return {
                ...question,
                variants: question.variants.map(variant => {
                    if (variant.key === variantKey) {
                        return { ...variant, correct: checked }
                    }

                    if (question.type === "single") {
                        return { ...variant, correct: false }
                    }

                    return variant
                }),
            }
        }))
    }

    function addVariant(questionKey: string) {
        const variant = {
            key: crypto.randomUUID(),
            text: "",
            correct: false,
        }

        setQuestions(previous => previous.map(question =>
            question.key === questionKey
                ? { ...question, variants: [...question.variants, variant] }
                : question
        ))
    }

    function removeVariant(questionKey: string, variantKey: string) {
        setQuestions(previous => previous.map(question => {
            if (question.key !== questionKey || question.variants.length <= 2) {
                return question
            }

            return {
                ...question,
                variants: question.variants.filter(variant => variant.key !== variantKey),
            }
        }))
    }

    async function createTest(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (saving) return

        const form = new FormData(event.currentTarget)

        const preparedQuestions = questions.map(question => {
            if (question.type === "text") {
                return {
                    type: "text",
                    question: question.question,
                    rightAnswer: question.rightAnswer,
                }
            }

            const correctIndexes = question.variants.flatMap((variant, index) =>
                variant.correct ? [index] : []
            )

            return {
                type: question.type,
                question: question.question,
                variants: question.variants.map(variant => variant.text),
                rightAnswer: question.type === "single"
                    ? correctIndexes[0]
                    : correctIndexes,
            }
        })

        const missingAnswer = questions.findIndex(question =>
            question.type !== "text" &&
            !question.variants.some(variant => variant.correct)
        )

        if (missingAnswer !== -1) {
            setSaveError(`Запитання ${missingAnswer + 1}: познач правильну відповідь.`)
            return
        }

        const test = {
            name: form.get("name"),
            description: form.get("description"),
            visibility: form.get("visibility"),
            questions: preparedQuestions,
        }

        setSaving(true)
        setSaveError("")

        try {
            const response = await fetch("/api/tests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(test),
            })

            if (response.status === 401) {
                setSaveError("Увійди в іншій вкладці та повтори збереження.")
                return
            }

            const data = await response.json()

            if (!response.ok) {
                setSaveError(data.error ?? "Не вдалося створити тест.")
                return
            }

            navigate(`/${data.id}`, { replace: true })
        } catch {
            setSaveError("Не вдалося отримати відповідь сервера. Перевір «Мої тести» в іншій вкладці перед повторним збереженням.")
        } finally {
            setSaving(false)
        }
    }

    if (authStatus === "loading") return <p>Перевіряємо вхід…</p>
    if (authStatus === "error") return <p role="alert">Не вдалося перевірити вхід.</p>
    if (!user) return <Navigate to="/login" replace />

    return (
        <>
            <header className="header">
                <div className="content">
                    <p className="quizora-logo">Quizora</p>
                    <div className="header-buttons">
                        <p className="header-user-name">{user.name}</p>

                        <button type="button" className="text-button" onClick={() => navigate('/my-tests')}>
                            Мої тести
                        </button>

                        <button
                            type="button"
                            className="text-button"
                            onClick={logout}
                            disabled={loggingOut}
                        >
                            {loggingOut ? "Виходимо…" : "Вихід"}
                        </button>
                    </div>
                </div>
            </header>
        
            <main className="main">
                <div className="content">
                    <div className="create-test-header">
                        <Link className="purple-link" to="/my-tests">←До моїх тестів</Link>
                        <h1>Створити тест</h1>
                        <p>Додайте основну інформацію та запитання з правильними відповідями</p>
                    </div>

                    <form className="create-test-form" onSubmit={createTest}>
                        <fieldset className="test-editor-fieldset" disabled={saving}>
                            <p className="label">Основна інформація</p>

                            <div className="form-field">
                                <p>Назва тесту</p>
                                <input name="name" placeholder="Наприклад, Основи веброзробки" required />
                            </div>

                            <div className="form-field">
                                <p>Опис</p>
                                <textarea name="description" placeholder="Коротко опишіть, які знання перевіряє тест" required />
                            </div>

                            <div className="form-field">
                                <p>Видимість</p>
                                <select name="visibility" defaultValue="private">
                                    <option value="private">Особистий</option>
                                    <option value="public">Публічний</option>
                                </select>
                            </div>
                        </fieldset>

                        {questions.map((question, index) => (
                            <fieldset className="test-editor-fieldset" key={question.key} disabled={saving}>
                                <div className="test-editor-header">
                                    <p className="label">Запитання {index + 1}</p>
                                    {questions.length > 1 && 
                                    <button
                                        type="button"
                                        onClick={() => removeQuestion(question.key)}
                                        disabled={questions.length === 1}
                                    >
                                        Видалити запитання
                                    </button>}
                                </div>

                                <div className="form-field">
                                    <p>Текст запитання</p>
                                    <input
                                        value={question.question}
                                        onChange={event => updateQuestion(
                                            question.key,
                                            "question",
                                            event.target.value
                                        )}
                                        placeholder="Введіть запитання"
                                        required
                                    />
                                </div>

                                <div className="form-field">
                                    <p>Тип відповіді</p>
                                    <select
                                        value={question.type}
                                        onChange={event => changeQuestionType(
                                            question.key,
                                            event.target.value as QuestionType
                                        )}
                                    >
                                        <option value="text">Текстова відповідь</option>
                                        <option value="single">Одна правильна відповідь</option>
                                        <option value="multiple">Декілька правильних відповідей</option>
                                    </select>
                                </div>

                                {question.type === "text" ? (
                                    <div className="form-field">
                                        <p>Правильна відповідь</p>
                                        <input
                                            value={question.rightAnswer}
                                            onChange={event => updateQuestion(
                                                question.key,
                                                "rightAnswer",
                                                event.target.value
                                            )}
                                            placeholder="Введіть правильну відповідь"
                                            required
                                        />
                                    </div>
                                ) : (
                                    <div className="form-field">
                                        <div className="answer-options-header">
                                            <p>Варіанти відповіді</p>
                                            <p className="field-hint">Позначте правильні</p>
                                        </div>

                                        {question.variants.map((variant, variantIndex) => (
                                            <div className="answer-option-row" key={variant.key}>
                                                <input
                                                    type={question.type === "single" ? "radio" : "checkbox"}
                                                    name={`correct-${question.key}`}
                                                    checked={variant.correct}
                                                    onChange={event => selectVariant(
                                                        question.key,
                                                        variant.key,
                                                        event.target.checked
                                                    )}
                                                />

                                                <input
                                                    aria-label={`Текст варіанта ${variantIndex + 1}`}
                                                    type="text"
                                                    value={variant.text}
                                                    onChange={event => updateVariant(
                                                        question.key,
                                                        variant.key,
                                                        event.target.value
                                                    )}
                                                    placeholder={`Варіант ${variantIndex + 1}`}
                                                    required
                                                />

                                                {question.variants.length > 2 && 
                                                <button
                                                    type="button"
                                                    className="remove-variant-button"
                                                    onClick={() => removeVariant(question.key, variant.key)}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                                                        <path
                                                            d="M6 6L18 18M18 6L6 18"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                        />
                                                    </svg>
                                                </button>}
                                            </div>
                                        ))}

                                        <button className="text-button purple" type="button" onClick={() => addVariant(question.key)}>
                                            + Додати варіант
                                        </button>
                                    </div>
                                )}
                            </fieldset>
                        ))}

                    <button className="add-question-button" type="button" onClick={addQuestion} disabled={saving}>
                        + Додати запитання
                    </button>

                    {saveError && <p role="alert">{saveError}</p>}

                    <div className="form-actions">
                        <button className="create-test-button" type="submit" disabled={saving}>
                            {saving ? "Збереження…" : "Створити тест"}
                        </button>
                    </div>
                </form>
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

export default CreateTestPage