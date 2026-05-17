import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Transaction } from '@/types/database'

export function CsvExport({ transactions }: { transactions: Transaction[] }) {
  function exportCsv() {
    const rows = [['Datum', 'Mitglied', 'Getränk', 'Preis'], ...transactions.map((t) => [t.created_at, t.user?.name ?? '', t.drink?.name ?? '', String(t.price)])]
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(';')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `getraenkekasse-export-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }
  return <Button onClick={exportCsv} variant="outline"><Download className="h-4 w-4" /> CSV Export</Button>
}
