'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { peso } from '@/lib/format'

const empty = { name: '', price: '', duration_days: '', session_limit: '', is_active: true }

export default function PlansPage() {
  const supabase = createClient()
  const [rows, setRows] = useState<any[]>([])
  const [form, setForm] = useState<any>(empty)
  const [editId, setEditId] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function load() {
    const { data, error } = await supabase.from('membership_plans').select('*').order('price')
    if (error) setMsg({ ok: false, text: error.message })
    else setRows(data || [])
  }
  useEffect(() => { load() }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    const payload = {
      name: form.name,
      price: Number(form.price),
      duration_days: Number(form.duration_days),
      session_limit: form.session_limit === '' ? null : Number(form.session_limit),
      is_active: form.is_active,
    }
    const res = editId
      ? await supabase.from('membership_plans').update(payload).eq('id', editId)
      : await supabase.from('membership_plans').insert(payload)
    if (res.error) return setMsg({ ok: false, text: res.error.message })
    setMsg({ ok: true, text: editId ? 'Plan updated.' : 'Plan added.' })
    setForm(empty)
    setEditId(null)
    load()
  }

  function edit(r: any) {
    setEditId(r.id)
    setForm({ name: r.name, price: r.price, duration_days: r.duration_days, session_limit: r.session_limit ?? '', is_active: r.is_active })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function remove(r: any) {
    if (!confirm(`Delete plan "${r.name}"?`)) return
    const { error } = await supabase.from('membership_plans').delete().eq('id', r.id)
    if (error) return setMsg({ ok: false, text: 'Cannot delete: this plan is used by existing memberships. Set it to inactive instead.' })
    setMsg({ ok: true, text: 'Plan deleted.' })
    load()
  }

  return (
    <>
      <h1>Membership Plans</h1>
      <div className="card">
        <h2>{editId ? 'Edit plan' : 'Add plan'}</h2>
        <form className="grid" onSubmit={save}>
          <label>Plan name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label>Price (₱)<input type="number" min="0" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></label>
          <label>Duration (days)<input type="number" min="1" required value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: e.target.value })} /></label>
          <label>Session limit (blank = unlimited)<input type="number" min="1" value={form.session_limit} onChange={(e) => setForm({ ...form, session_limit: e.target.value })} /></label>
          <label className="check"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
          <div className="row-actions">
            <button>{editId ? 'Update' : 'Add'}</button>
            {editId && <button type="button" className="secondary" onClick={() => { setEditId(null); setForm(empty) }}>Cancel</button>}
          </div>
        </form>
        {msg && <div className={`msg ${msg.ok ? 'ok' : 'err'}`}>{msg.text}</div>}
      </div>

      <div className="card">
        <h2>All plans</h2>
        {rows.length === 0 ? <div className="empty">No plans yet.</div> : (
          <table>
            <thead><tr><th>Name</th><th>Price</th><th>Duration</th><th>Sessions</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td><td>{peso(r.price)}</td><td>{r.duration_days} days</td>
                  <td>{r.session_limit ?? 'Unlimited'}</td>
                  <td><span className={`badge ${r.is_active ? 'active' : 'cancelled'}`}>{r.is_active ? 'active' : 'inactive'}</span></td>
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
