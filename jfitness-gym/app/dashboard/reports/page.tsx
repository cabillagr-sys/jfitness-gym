'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { todayManila, dayRange, peso, fmtDateTime } from '@/lib/format'

export default function ReportsPage() {
  const supabase = createClient()
  const [date, setDate] = useState(todayManila())
  const [rows, setRows] = useState<any[]>([])
  const [checkins, setCheckins] = useState(0)
  const [error, setError] = useState('')

  async function load(d: string) {
    setError('')
    const [start, end] = dayRange(d)
    const [p, a] = await Promise.all([
      supabase.from('payments').select('*, members(full_name)').gte('paid_at', start).lte('paid_at', end).order('paid_at'),
      supabase.from('attendance').select('*', { count: 'exact', head: true }).gte('checked_in_at', start).lte('checked_in_at', end),
    ])
    if (p.error) setError(p.error.message)
    setRows(p.data || [])
    setCheckins(a.count ?? 0)
  }
  useEffect(() => { load(date) }, [date])

  const total = rows.reduce((s, r) => s + Number(r.amount), 0)
  const byMethod: Record<string, number> = {}
  rows.forEach((r) => { byMethod[r.method] = (byMethod[r.method] || 0) + Number(r.amount) })

  return (
    <>
      <h1>Daily Sales Report</h1>
      <div className="card no-print">
        <div className="toolbar" style={{ marginBottom: 0 }}>
          <label>Report date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
          <button style={{ alignSelf: 'end' }} onClick={() => window.print()}>Print report</button>
        </div>
      </div>
      {error && <div className="msg err">{error}</div>}

      <div className="stats">
        <div className="stat"><div className="label">Total sales for {date}</div><div className="value">{peso(total)}</div></div>
        <div className="stat"><div className="label">Transactions</div><div className="value">{rows.length}</div></div>
        <div className="stat"><div className="label">Check-ins</div><div className="value">{checkins}</div></div>
        {Object.entries(byMethod).map(([m, v]) => (
          <div className="stat" key={m}><div className="label">{m.toUpperCase()}</div><div className="value">{peso(v)}</div></div>
        ))}
      </div>

      <div className="card">
        <h2>Transactions</h2>
        {rows.length === 0 ? <div className="empty">No sales recorded on this date.</div> : (
          <table>
            <thead><tr><th>Time</th><th>Member</th><th>Method</th><th>Notes</th><th>Amount</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{fmtDateTime(r.paid_at)}</td><td>{r.members?.full_name}</td>
                  <td>{r.method}</td><td>{r.notes}</td><td>{peso(r.amount)}</td>
                </tr>
              ))}
              <tr><td colSpan={4}><strong>Total</strong></td><td><strong>{peso(total)}</strong></td></tr>
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
