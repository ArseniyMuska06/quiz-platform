import HomePage from './pages/HomePage/HomePage'
import './App.css'
import { Routes, Route } from 'react-router'
import TestPage from './pages/TestPage/TestPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/:testId" element={<TestPage />} />
    </Routes>
  )
}

export default App