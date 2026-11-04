type StatsType = {
    id: string,
    lastResult: number,
    bestResult: number
}

type UpdateProps = {
    testId: string,
    lastResult: number
}

export function UserStats() {
    const stats: StatsType[] = JSON.parse(
        localStorage.getItem("UserStats") ?? "[]"
    )
    
    return stats
}

export function UpdateUserStats({testId, lastResult} : UpdateProps) {
    const stats = UserStats()
    const testStats = (stats.filter((item) => {return item.id === testId}))

    const bestResult = testStats[0] ? ((lastResult > testStats[0].bestResult) ? lastResult : testStats[0].bestResult) : lastResult

    const newItemStats = {
        id: testId,
        lastResult: lastResult,
        bestResult: bestResult
    }

    const newStats = stats.map((item) => {
        if (item.id === testId) {
            return newItemStats
        } else {
            return item
        }
    })

    if (!stats.some((item) => item.id === testId)) {
        newStats.push(newItemStats)
    }

    localStorage.setItem("UserStats", JSON.stringify(newStats))
}