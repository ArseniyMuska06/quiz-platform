import { useParams } from "react-router"
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

export default TestPage