import HomePage from './pages/HomePage/HomePage'
import './App.css'
import { Routes, Route } from 'react-router'
import TestPage from './pages/TestPage/TestPage'
import LoginPage from "./pages/LoginPage/LoginPage"
import MyTestsPage from "./pages/MyTestsPage/MyTestsPage"

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/:testId" element={<TestPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/my-tests" element={<MyTestsPage />} />
    </Routes>
  )
}

export default App