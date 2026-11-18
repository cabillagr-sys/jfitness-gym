'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const empty = { full_name: '', phone: '', email: '', address: '', emergency_contact: '' }

export default function MembersPage() {
  const supabase = createClient()
  const [rows, setRows] = useState<any[]>([])
  const [form, setForm] = useState<any>(empty)
  const [editId, setEditId] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [q, setQ] = useState('')

  async function load() {
    const { data, error } = await supabase.from('members').select('*').order('created_at', { ascending: false })
    if (error) setMsg({ ok: false, text: error.message })
    else setRows(data || [])
  }
  useEffect(() => { load() }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    const res = editId
      ? await supabase.from('members').update(form).eq('id', editId)
      : await supabase.from('members').insert(form)
    if (res.error) return setMsg({ ok: false, text: res.error.message })
    setMsg({ ok: true, text: editId ? 'Member updated.' : 'Member added.' })
    setForm(empty)
    setEditId(null)
    load()
  }

  function edit(r: any) {
    setEditId(r.id)
    setForm({
      full_name: r.full_name || '', phone: r.phone || '', email: r.email || '',
      address: r.address || '', emergency_contact: r.emergency_contact || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function remove(r: any) {
    if (!confirm(`Delete ${r.full_name}? Their memberships, attendance and payments will also be deleted.`)) return
    const { error } = await supabase.from('members').delete().eq('id', r.id)
    if (error) return setMsg({ ok: false, text: error.message })
    setMsg({ ok: true, text: 'Member deleted.' })
    load()
  }

  const shown = rows.filter((r) => `${r.full_name} ${r.phone} ${r.email}`.toLowerCase().includes(q.toLowerCase()))

  return (
    <>
      <h1>Members</h1>
      <div className="card">
        <h2>{editId ? 'Edit member' : 'Add member'}</h2>
        <form className="grid" onSubmit={save}>
          <label>Full name<input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></label>
          <label>Phone<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
          <label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label>Address<input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
          <label>Emergency contact<input value={form.emergency_contact} onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })} /></label>
          <div className="row-actions">
            <button>{editId ? 'Update' : 'Add'}</button>
            {editId && <button type="button" className="secondary" onClick={() => { setEditId(null); setForm(empty) }}>Cancel</button>}
          </div>
        </form>
        {msg && <div className={`msg ${msg.ok ? 'ok' : 'err'}`}>{msg.text}</div>}
      </div>

      <div className="card">
        <div className="toolbar">
          <h2 style={{ margin: 0 }}>All members ({shown.length})</h2>
          <input placeholder="Search name, phone, email" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {shown.length === 0 ? <div className="empty">No members found.</div> : (
          <table>
            <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Address</th><th>Emergency contact</th><th></th></tr></thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id}>
                  <td>{r.full_name}</td><td>{r.phone}</td><td>{r.email}</td><td>{r.address}</td><td>{r.emergency_contact}</td>
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
