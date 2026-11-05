import { useEffect, useState } from "react"
import { Link, useParams } from "react-router"
import TestInfo, { type TestDetails } from "../../components/TestInfo/TestInfo"

function TestPage() {
    const { testId } = useParams()
    const [test, setTest] = useState<TestDetails | null>(null)
    const [error, setError] = useState("")
    const [retry, setRetry] = useState(0)

    useEffect(() => {
        if (!testId) return

        const controller = new AbortController()

        async function loadTest(id: string) {
            setTest(null)
            setError("")

            try {
                const response = await fetch(`/api/tests/${encodeURIComponent(id)}`, {
                    signal: controller.signal,
                })

                if (response.status === 404) {
                    throw new Error("Тест не знайдено або він недоступний.")
                }

                if (!response.ok) {
                    throw new Error("Не вдалося завантажити тест.")
                }

                const data: TestDetails = await response.json()
                if (!controller.signal.aborted) setTest(data)
            } catch (error) {
                if (controller.signal.aborted) return
                setError(error instanceof Error ? error.message : "Помилка завантаження.")
            }
        }

        void loadTest(testId)
        return () => controller.abort()
    }, [testId, retry])

    if (error) {
        return (
            <main>
                <p role="alert">{error}</p>
                <button onClick={() => setRetry(value => value + 1)}>
                    Спробувати ще раз
                </button>
                <p><Link to="/">До каталогу</Link></p>
            </main>
        )
    }

    if (!test) return <p>Завантаження тесту…</p>

    return <TestInfo test={test} />
}

export default TestPage

/* import { useParams } from "react-router"
import TestStorage from "../../utils/TestStorage"
import TestInfo from "../../components/TestInfo/TestInfo"
import TestTaking from "../../components/TestTaking/TestTaking"
import { useState } from "react"

function TestPage() {
    const { testId } = useParams()
    const test = TestStorage().find((item) => item.id == testId)

    const [testAction, setTestAction] = useState(false)

    if (!test) {
        return <h1>Тест не знайдено!</h1>
    }

    return (
        testAction ? <TestTaking test={test} /> : <TestInfo setTestAction={setTestAction} test={test} />
    )
}

export default TestPage */