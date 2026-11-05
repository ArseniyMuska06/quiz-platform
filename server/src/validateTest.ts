function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value)
}

function hasText(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0
}

function isVariantIndex(value: unknown, count: number): boolean {
    return typeof value === "number"
        && Number.isInteger(value)
        && value >= 0
        && value < count
}

export function validateTest(value: unknown): string | null {
    if (!isObject(value)) return "Очікується об’єкт тесту."
    if (!hasText(value.name)) return "Введи назву тесту."
    if (!hasText(value.description)) return "Введи опис тесту."

    if (value.visibility !== "public" && value.visibility !== "private") {
        return "Обери видимість тесту: public або private."
    }

    if (!Array.isArray(value.questions) || value.questions.length === 0) {
        return "Додай хоча б одне запитання."
    }

    for (const [index, question] of value.questions.entries()) {
        const label = `Запитання ${index + 1}`

        if (!isObject(question) || !hasText(question.question)) {
            return `${label}: введи текст запитання.`
        }

        if (question.type === "text") {
            if (!hasText(question.rightAnswer)) {
                return `${label}: введи правильну текстову відповідь.`
            }
            continue
        }

        if (question.type !== "single" && question.type !== "multiple") {
            return `${label}: невідомий тип запитання.`
        }

        const variants = question.variants
        if (!Array.isArray(variants) || variants.length < 2 || !variants.every(hasText)) {
            return `${label}: додай щонайменше два заповнені варіанти.`
        }

        const answer = question.rightAnswer

        if (question.type === "single") {
            if (!isVariantIndex(answer, variants.length)) {
                return `${label}: обери один із наявних варіантів як правильний.`
            }
            continue
        }

        if (!Array.isArray(answer) || answer.length === 0) {
            return `${label}: познач хоча б один правильний варіант.`
        }

        if (!answer.every(item => isVariantIndex(item, variants.length))) {
            return `${label}: правильна відповідь містить неіснуючий номер варіанта.`
        }

        if (new Set(answer).size !== answer.length) {
            return `${label}: номер правильного варіанта повторюється.`
        }
    }

    return null
}