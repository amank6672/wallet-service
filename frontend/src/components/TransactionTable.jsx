import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table'
import { useMemo, memo, useCallback } from 'react'
import { formatAmount, formatDate } from '../utils/formatters.js'
import styles from './TransactionTable.module.css'

const TransactionTable = memo(function TransactionTable({ data, loading, sorting, onSortingChange }) {

  // Memoized cell renderers
  const renderDateCell = useCallback(({ getValue }) => (
    <span className={styles.cellText}>{formatDate(getValue())}</span>
  ), []);

  const renderAmountCell = useCallback(({ getValue }) => {
    const amount = parseFloat(getValue() || 0);
    const isCredit = amount > 0;
    return (
      <span className={`${styles.cellAmount} ${isCredit ? styles.cellAmountCredit : styles.cellAmountDebit}`}>
        {isCredit ? '+' : ''}{formatAmount(getValue())}
      </span>
    );
  }, []);

  const renderBalanceCell = useCallback(({ getValue }) => (
    <span className={styles.cellBalance}>
      {formatAmount(getValue())}
    </span>
  ), []);

  const renderTypeCell = useCallback(({ getValue, row }) => {
    const type = getValue();
    const amount = parseFloat(row.original.amount || 0);
    const isCredit = amount > 0 || type === 'CREDIT';
    
    return (
      <span className={`${styles.typeBadge} ${isCredit ? styles.typeBadgeCredit : styles.typeBadgeDebit}`}>
        {type || (isCredit ? 'CREDIT' : 'DEBIT')}
      </span>
    );
  }, []);

  const renderDescriptionCell = useCallback(({ getValue }) => (
    <span className={styles.cellText}>{getValue() || '-'}</span>
  ), []);

  const columns = useMemo(
    () => [
      {
        accessorKey: 'date',
        header: 'Date',
        cell: renderDateCell,
        enableSorting: true,
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: renderAmountCell,
        enableSorting: true,
      },
      {
        accessorKey: 'balance',
        header: 'Balance',
        cell: renderBalanceCell,
        enableSorting: true,
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: renderTypeCell,
        enableSorting: true,
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: renderDescriptionCell,
      },
    ],
    [renderDateCell, renderAmountCell, renderBalanceCell, renderTypeCell, renderDescriptionCell]
  )

  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true, // Sorting is handled on the backend
    state: {
      sorting: sorting || [{ id: 'date', desc: true }],
    },
    onSortingChange: (updater) => {
      const newSorting = typeof updater === 'function' ? updater(sorting || []) : updater
      if (onSortingChange) {
        onSortingChange(newSorting)
      }
    },
  })

  if (loading && data.length === 0) {
    return (
      <div className={styles.loadingState}>
        Loading transactions...
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className={styles.emptyState}>
        No transactions to display
      </div>
    )
  }

  const getHeaderAlignClass = useCallback((headerId) => {
    if (headerId === 'amount' || headerId === 'balance') return styles.thRight
    if (headerId === 'type') return styles.thCenter
    return styles.thLeft
  }, []);

  const getHeaderContentClass = useCallback((headerId) => {
    if (headerId === 'amount' || headerId === 'balance') return styles.thContentRight
    if (headerId === 'type') return styles.thContentCenter
    return ''
  }, []);

  const getCellAlignClass = useCallback((columnId) => {
    if (columnId === 'amount' || columnId === 'balance') return styles.tdRight
    if (columnId === 'type') return styles.tdCenter
    return styles.tdLeft
  }, []);

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead className={styles.thead}>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  className={`${styles.th} ${getHeaderAlignClass(header.id)} ${header.column.getCanSort() ? styles.thSortable : ''}`}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className={`${styles.thContent} ${getHeaderContentClass(header.id)}`}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanSort() && (
                      <span className={styles.sortIcon}>
                        {{
                          asc: '↑',
                          desc: '↓',
                        }[header.column.getIsSorted()] ?? '↕'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className={styles.tbody}>
          {table.getRowModel().rows.map((row, index) => (
            <tr
              key={row.id}
              className={`${styles.tr} ${index % 2 === 0 ? styles.trEven : styles.trOdd}`}
            >
              {row.getVisibleCells().map(cell => (
                <td
                  key={cell.id}
                  className={`${styles.td} ${getCellAlignClass(cell.column.id)}`}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
});

TransactionTable.displayName = 'TransactionTable';

export default TransactionTable;
