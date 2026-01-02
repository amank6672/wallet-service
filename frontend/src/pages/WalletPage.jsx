import { useEffect, useState } from 'react'
import { setupWallet, getWallet, transact } from '../api/walletApi'
import { Link } from 'react-router-dom'

export default function WalletPage() {
  const [wallet, setWallet] = useState(null)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')

  useEffect(() => {
    const walletId = localStorage.getItem('walletId')
    if (walletId) {
      getWallet(walletId).then(setWallet)
    }
  }, [])


  const handleSetup = async () => {
    const data = await setupWallet({ name })
    localStorage.setItem('walletId', data.id)
    setWallet(data)
  }

  const handleTransaction = async (type) => {
    await transact(wallet._id, {
      amount: type === 'CREDIT' ? amount : -amount,
      description: type
    })
    const updated = await getWallet(wallet._id)
    setWallet(updated)
    setAmount('')
  }

  console.log('wallet', wallet)


  if (!wallet) {
    return (
      <div>
        <h2>Create Wallet</h2>
        <input
          placeholder="User name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <button onClick={handleSetup}>Submit</button>
      </div>
    )
  }

  return (
    <div>
      <h2>{wallet.name}</h2>
      <h3>Balance: {wallet.balance?.$numberDecimal}</h3>

      <input
        placeholder="Amount"
        value={amount}
        onChange={e => setAmount(e.target.value)}
      />

      <button onClick={() => handleTransaction('CREDIT')}>
        Credit
      </button>
      <button onClick={() => handleTransaction('DEBIT')}>
        Debit
      </button>

      <br /><br />
      <Link to="/transactions">View Transactions</Link>
    </div>
  )
}
