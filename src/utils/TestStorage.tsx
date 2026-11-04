type QuestionType = 
| {
    id: number,
    type: "single",
    question: string,
    variants: string[],
    rightAnswer: number
}
| {
    id: number,
    type: "multiple",
    question: string,
    variants: string[],
    rightAnswer: number[]
}
| {
    id: number,
    type: "text",
    question: string,
    rightAnswer: string
}

export type TestType = {
    id: string,
    name: string,
    description: string,
    questions: QuestionType[]
}

function TestStorage() {
    const QuizoraTests: TestType[] = JSON.parse(
        localStorage.getItem("QuizoraTests") ?? "[]"
    )

    return QuizoraTests
}

export default TestStorage