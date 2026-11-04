import { useNavigate } from "react-router"
import TestStorage from "../../utils/TestStorage"
import "./HomePage.css"
import { useEffect } from "react"

function HomePage() {
    const navigate = useNavigate()

    const QuizoraTests = TestStorage()

    useEffect(() => {
        if (localStorage.getItem("UserStats") === null) {
            localStorage.setItem("UserStats", JSON.stringify([]))
        }
    }, [])

    return (
        <>
            <header className="header">
                <div className="content">
                    <p className="quizora-logo">Quizora</p>
                    <div className="header-buttons">
                        <button className="text-button">Редагувати тести</button>
                        <button className="create-test-button">Створити</button>
                    </div>
                </div>
            </header>

            <main className="main">
                <div className="content">
                    <h1 className="home-title">Усі тести</h1>
                    <div className="tests-list">
                        {QuizoraTests.length === 0 && (
                            <p>Тестів поки немає. Створи свій перший тест.</p>
                        )}

                        {QuizoraTests.map((item) => {
                            return <div className="test-preview" onClick={() => navigate(`/${item.id}`)} key={item.id}>
                                <p>{item.name}</p>
                            </div>
                        })}
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

export default HomePage