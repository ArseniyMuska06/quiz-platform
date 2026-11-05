type GradingQuestion =
    | { type: "single"; rightAnswer: number }
    | { type: "multiple"; rightAnswer: number[] }
    | { type: "text"; rightAnswer: string }

function isAnswerCorrect(question: GradingQuestion, answer: unknown): boolean {
    switch (question.type) {
        case "single":
            return answer === question.rightAnswer

        case "multiple": {
            if (!Array.isArray(answer)) return false

            const expected = question.rightAnswer

            return answer.length === expected.length
                && expected.every(index => answer.includes(index))
        }

        case "text":
            return typeof answer === "string"
                && answer.trim().length > 0
                && answer.trim().toLowerCase() === question.rightAnswer.trim().toLowerCase()
    }
}

export function gradeTest(questions: GradingQuestion[], answers: unknown[]) {
    const correctByQuestion = questions.map((question, index) =>
        isAnswerCorrect(question, answers[index])
    )

    const correctCount = correctByQuestion.filter(correct => correct).length
    const questionCount = questions.length
    const percent = Math.round(correctCount / questionCount * 100)

    return { correctByQuestion, correctCount, questionCount, percent }
}