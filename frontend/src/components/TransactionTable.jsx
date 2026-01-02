export default function TransactionTable({ data }) {
  return (
    <table border="1" cellPadding="8">
      <thead>
        <tr>
          <th>Date</th>
          <th>Amount</th>
          <th>Balance</th>
          <th>Type</th>
          <th>Message</th>
        </tr>
      </thead>
      <tbody>
        {data.map(tx => (
          <tr key={tx._id}>
            <td>{new Date(tx.createdAt).toLocaleString()}</td>
            <td>{tx.amount?.$numberDecimal}</td>
            <td>{tx.balance?.$numberDecimal}</td>
            <td>{tx.type}</td>
            <td>{tx.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
