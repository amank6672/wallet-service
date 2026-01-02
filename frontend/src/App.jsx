import { BrowserRouter, Routes, Route } from 'react-router-dom'
import WalletPage from './pages/WalletPage'
import TransactionsPage from './pages/TransactionsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WalletPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
      </Routes>
    </BrowserRouter>
  )
}
