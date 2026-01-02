import { useEffect, useState } from 'react'
import { getTransactions, exportCSV } from '../api/walletApi'
import TransactionTable from '../components/TransactionTable'
import { Link } from 'react-router-dom'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([])

  useEffect(() => {
    const walletId = localStorage.getItem('walletId')
    getTransactions(walletId).then(setTransactions)
  }, [])

  console.log('trans', transactions)

  return (
    <div>
      <h2>Transactions</h2>

      <button onClick={() =>
        exportCSV(localStorage.getItem('walletId'))
      }>
        Export CSV
      </button>

      <TransactionTable data={transactions} />

      <br />
      <Link to="/">Back</Link>
    </div>
  )
}
