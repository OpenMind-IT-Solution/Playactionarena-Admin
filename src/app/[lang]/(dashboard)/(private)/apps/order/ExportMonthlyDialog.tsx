'use client'

// React Imports
import { useMemo, useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs, { type Dayjs } from 'dayjs'
import { toast } from 'react-toastify'
import * as XLSX from 'xlsx'

// Type Imports
import type { OrderType } from '@/types/apps/orderTypes'

type Props = {
  open: boolean
  onClose: () => void
  orders: OrderType[]
}

const GST_RATES = [5, 12, 18]

const round2 = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100

const formatDateKey = (raw?: string): string => {
  if (!raw) return ''
  const d = new Date(raw)

  if (isNaN(d.getTime())) return ''

  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

const inSelectedMonth = (raw?: string, month?: string): boolean => {
  if (!raw || !month) return false
  const d = new Date(raw)

  if (isNaN(d.getTime())) return false

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === month
}

const currentMonth = (): string => {
  const d = new Date()

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const ExportMonthlyDialog = ({ open, onClose, orders }: Props) => {
  // States
  const [month, setMonth] = useState<string>(currentMonth())
  const [monthValue, setMonthValue] = useState<Dayjs | null>(dayjs(currentMonth()))
  const [exporting, setExporting] = useState(false)

  const reportOrders = useMemo(() => {
    return (orders || []).filter(
      order => inSelectedMonth(order.createdAt, month) && order.status !== 'cancelled' && order.status !== 'deleted'
    )
  }, [orders, month])

  const handleMonthChange = (value: Dayjs | null) => {
    setMonthValue(value)

    if (value) setMonth(value.format('YYYY-MM'))
  }

  const handleExport = () => {
    if (reportOrders.length === 0) {
      toast.info('No orders to export for the selected month.')

      return
    }

    setExporting(true)

    try {
      const byDay = new Map<string, OrderType[]>()

      reportOrders.forEach(order => {
        const key = formatDateKey(order.createdAt)

        if (!key) return
        if (!byDay.has(key)) byDay.set(key, [])

        byDay.get(key)!.push(order)
      })

      const sortedDays = Array.from(byDay.keys()).sort((a, b) => {
        const [da, ma, ya] = a.split('/').map(Number)
        const [db, mb, yb] = b.split('/').map(Number)

        return new Date(ya, ma - 1, da).getTime() - new Date(yb, mb - 1, db).getTime()
      })

      const number = (v: number | undefined | null): number => (v == null ? 0 : round2(Number(v)))

      const rows = sortedDays.map(day => {
        const dayOrders = byDay.get(day)!

        const totalInclGst = round2(dayOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0))

        const bracketSums: Record<number, { taxable: number; gst: number }> = {}

        GST_RATES.forEach(rate => {
          bracketSums[rate] = { taxable: 0, gst: 0 }
        })

        dayOrders.forEach(order => {
          ;(order.orderItems || order.items || []).forEach((item: any) => {
            const qty = Number(item.quantity || 0)
            const netPrice = Number(item.price || 0)
            let rate = item.gstRate != null ? Number(item.gstRate) : null

            if (rate == null || isNaN(rate)) rate = 5

            const bucket = bracketSums[rate] || bracketSums[5]
            const taxable = netPrice * qty

            bucket.taxable += taxable
            bucket.gst += (taxable * rate) / 100
          })
        })

        const byPayment = (matcher: (method?: string) => boolean): number =>
          round2(dayOrders.filter(o => matcher(o.paymentMethod)).reduce((sum, o) => sum + Number(o.totalAmount || 0), 0))

        return [
          day,
          dayOrders.length,
          number(totalInclGst),
          ...GST_RATES.map(rate => number(round2(bracketSums[rate].taxable))),
          ...GST_RATES.map(rate => number(round2(bracketSums[rate].gst / 2))),
          ...GST_RATES.map(rate => number(round2(bracketSums[rate].gst / 2))),
          number(byPayment(m => m === 'cash')),
          number(byPayment(m => m !== 'cash' && m !== 'card')),
          number(byPayment(m => m === 'card'))
        ]
      })

      const headerRow1 = [
        'Date', 'Orders', 'Total (Incl. GST)',
        'Taxable Value', 'Taxable Value', 'Taxable Value',
        'CGST', 'CGST', 'CGST',
        'SGST', 'SGST', 'SGST',
        'Revenue', 'Revenue', 'Revenue'
      ]
      const headerRow2 = [
        '', '', '',
        '5%', '12%', '18%',
        '5%', '12%', '18%',
        '5%', '12%', '18%',
        'Cash', 'Online/UPI', 'Card'
      ]

      const aoa = [headerRow1, headerRow2, ...rows]
      const ws = XLSX.utils.aoa_to_sheet(aoa)

      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },
        { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } },
        { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } },
        { s: { r: 0, c: 3 }, e: { r: 0, c: 5 } },
        { s: { r: 0, c: 6 }, e: { r: 0, c: 8 } },
        { s: { r: 0, c: 9 }, e: { r: 0, c: 11 } },
        { s: { r: 0, c: 12 }, e: { r: 0, c: 14 } }
      ]

      ws['!cols'] = Array.from({ length: 15 }, () => ({ wch: 12 }))

      const wb = XLSX.utils.book_new()

      XLSX.utils.book_append_sheet(wb, ws, `Orders ${month}`)
      XLSX.writeFile(wb, `Orders_Daily_${month}.xlsx`)
      toast.success(`Exported daily report for ${month} (${sortedDays.length} day(s)).`)
    } catch (err) {
      console.error('Export failed:', err)
      toast.error('Failed to export orders.')
    } finally {
      setExporting(false)
      onClose()
    }
  }

  return (
    <Dialog open={open} onClose={exporting ? undefined : onClose} maxWidth='xs' fullWidth>
      <DialogTitle className='flex items-center gap-2'>
        <i className='tabler-calendar-event text-textSecondary' />
        Export Daily Report
      </DialogTitle>
      <DialogContent>
        <Typography variant='body2' className='mb-4'>
          Select a month. The export will contain one row per day with totals (total incl. GST, taxable value, and
          CGST/SGST per GST rate, plus revenue split by payment method).
        </Typography>
        <DatePicker
          views={['month', 'year']}
          label='Month'
          value={monthValue}
          onChange={handleMonthChange}
          disabled={exporting}
          maxDate={dayjs(currentMonth())}
          slotProps={{
            textField: { fullWidth: true, variant: 'outlined' }
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button variant='tonal' color='secondary' onClick={onClose} disabled={exporting}>
          Cancel
        </Button>
        <Button
          variant='contained'
          startIcon={exporting ? <i className='tabler-loader animate-spin' /> : <i className='tabler-download' />}
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? 'Exporting…' : 'Download'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ExportMonthlyDialog
