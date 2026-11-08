import { Link, useNavigate } from "react-router"
import { useEffect, useState, type FormEvent } from "react"
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
    const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")

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

    useEffect(() => {
        const controller = new AbortController()

        async function checkSession() {
            try {
                const response = await fetch("/api/auth/me", {
                    signal: controller.signal,
                })

                if (controller.signal.aborted) return

                if (response.status === 401) {
                    navigate("/login", {
                        replace: true,
                        state: { from: "/create" },
                    })
                    return
                }

                setStatus(response.ok ? "ready" : "error")
            } catch {
                if (!controller.signal.aborted) setStatus("error")
            }
        }

        void checkSession()
        return () => controller.abort()
    }, [navigate])

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

    if (status === "loading") return <p>Перевірка входу…</p>
    if (status === "error") return <p role="alert">Не вдалося перевірити вхід. Онови сторінку.</p>

    return (
        <main className="main">
            <div className="content">
                <Link to="/my-tests">Мої тести</Link>
                <h1>Створити тест</h1>

                <form onSubmit={createTest}>
                <fieldset disabled={saving}>
                    <legend>Інформація про тест</legend>

                    <p>
                        <label>
                            Назва тесту<br />
                            <input name="name" required />
                        </label>
                    </p>

                    <p>
                        <label>
                            Опис<br />
                            <textarea name="description" required />
                        </label>
                    </p>

                    <p>
                        <label>
                            Видимість<br />
                            <select name="visibility" defaultValue="private">
                                <option value="private">Особистий</option>
                                <option value="public">Публічний</option>
                            </select>
                        </label>
                    </p>
                </fieldset>

                <p>Кількість запитань: {questions.length}</p>

                {questions.map((question, index) => (
                    <fieldset key={question.key} disabled={saving}>
                        <legend>Запитання {index + 1}</legend>

                        <p>
                            <label>
                                Тип запитання<br />
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
                            </label>
                        </p>

                        <p>
                            <label>
                                Текст запитання<br />
                                <textarea
                                    value={question.question}
                                    onChange={event => updateQuestion(
                                        question.key,
                                        "question",
                                        event.target.value
                                    )}
                                    required
                                />
                            </label>
                        </p>

                        {question.type === "text" ? (
                            <p>
                                <label>
                                    Правильна відповідь<br />
                                    <input
                                        value={question.rightAnswer}
                                        onChange={event => updateQuestion(
                                            question.key,
                                            "rightAnswer",
                                            event.target.value
                                        )}
                                        required
                                    />
                                </label>
                            </p>
                        ) : (
                            <div>
                                <p>Познач правильні варіанти відповідей.</p>

                                {question.variants.map((variant, variantIndex) => (
                                    <div key={variant.key}>
                                        <label>
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
                                            Правильний варіант {variantIndex + 1}
                                        </label>

                                        <input
                                            aria-label={`Текст варіанта ${variantIndex + 1}`}
                                            value={variant.text}
                                            onChange={event => updateVariant(
                                                question.key,
                                                variant.key,
                                                event.target.value
                                            )}
                                            required
                                        />

                                        <button
                                            type="button"
                                            onClick={() => removeVariant(question.key, variant.key)}
                                            disabled={question.variants.length <= 2}
                                        >
                                            Видалити варіант
                                        </button>
                                    </div>
                                ))}

                                <button type="button" onClick={() => addVariant(question.key)}>
                                    Додати варіант
                                </button>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => removeQuestion(question.key)}
                            disabled={questions.length === 1}
                        >
                            Видалити запитання
                        </button>
                    </fieldset>
                ))}

                <button type="button" onClick={addQuestion} disabled={saving}>
                    Додати запитання
                </button>

                {saveError && <p role="alert">{saveError}</p>}

                <button type="submit" disabled={saving}>
                    {saving ? "Збереження…" : "Створити тест"}
                </button>
            </form>
            </div>
        </main>
    )
}

export default CreateTestPage