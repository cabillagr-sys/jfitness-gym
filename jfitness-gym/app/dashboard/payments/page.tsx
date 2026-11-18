'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { peso, fmtDateTime } from '@/lib/format'

const empty = { member_id: '', amount: '', method: 'cash', notes: '' }

export default function PaymentsPage() {
  const supabase = createClient()
  const [rows, setRows] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [form, setForm] = useState<any>(empty)
  const [editId, setEditId] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function load() {
    const [m, p] = await Promise.all([
      supabase.from('members').select('id, full_name').order('full_name'),
      supabase.from('payments').select('*, members(full_name)').order('paid_at', { ascending: false }).limit(200),
    ])
    setMembers(m.data || [])
    setRows(p.data || [])
    if (p.error) setMsg({ ok: false, text: p.error.message })
  }
  useEffect(() => { load() }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    const payload: any = { member_id: form.member_id, amount: Number(form.amount), method: form.method, notes: form.notes }
    let res
    if (editId) {
      res = await supabase.from('payments').update(payload).eq('id', editId)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      res = await supabase.from('payments').insert({ ...payload, recorded_by: user?.id })
    }
    if (res.error) return setMsg({ ok: false, text: res.error.message })
    setMsg({ ok: true, text: editId ? 'Payment updated.' : 'Payment recorded.' })
    setForm(empty)
    setEditId(null)
    load()
  }

  function edit(r: any) {
    setEditId(r.id)
    setForm({ member_id: r.member_id, amount: r.amount, method: r.method, notes: r.notes || '' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function remove(r: any) {
    if (!confirm('Delete this payment?')) return
    const { error } = await supabase.from('payments').delete().eq('id', r.id)
    if (error) return setMsg({ ok: false, text: error.message })
    setMsg({ ok: true, text: 'Payment deleted.' })
    load()
  }

  return (
    <>
      <h1>Payments</h1>
      <div className="card">
        <h2>{editId ? 'Edit payment' : 'Record payment'}</h2>
        <form className="grid" onSubmit={save}>
          <label>Member
            <select required value={form.member_id} onChange={(e) => setForm({ ...form, member_id: e.target.value })}>
              <option value="">Select member</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
            </select>
          </label>
          <label>Amount (₱)<input type="number" min="0" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label>
          <label>Method
            <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
              <option value="cash">Cash</option>
              <option value="gcash">GCash</option>
              <option value="card">Card</option>
            </select>
          </label>
          <label>Notes<input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
          <div className="row-actions">
            <button>{editId ? 'Update' : 'Save'}</button>
            {editId && <button type="button" className="secondary" onClick={() => { setEditId(null); setForm(empty) }}>Cancel</button>}
          </div>
        </form>
        {msg && <div className={`msg ${msg.ok ? 'ok' : 'err'}`}>{msg.text}</div>}
      </div>

      <div className="card">
        <h2>Recent payments</h2>
        {rows.length === 0 ? <div className="empty">No payments yet.</div> : (
          <table>
            <thead><tr><th>Date</th><th>Member</th><th>Amount</th><th>Method</th><th>Notes</th><th></th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{fmtDateTime(r.paid_at)}</td><td>{r.members?.full_name}</td><td>{peso(r.amount)}</td>
                  <td>{r.method}</td><td>{r.notes}</td>
                  <td><div className="row-actions">
                    <button className="small secondary" onClick={() => edit(r)}>Edit</button>
                    <button className="small danger" onClick={() => remove(r)}>Delete</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
