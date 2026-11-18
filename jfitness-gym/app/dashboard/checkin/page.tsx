'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { todayManila, dayRange, fmtDateTime } from '@/lib/format'

export default function CheckinPage() {
  const supabase = createClient()
  const [members, setMembers] = useState<any[]>([])
  const [memberId, setMemberId] = useState('')
  const [q, setQ] = useState('')
  const [today, setToday] = useState<any[]>([])
  const [info, setInfo] = useState<any[]>([])
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function load() {
    await supabase.rpc('expire_memberships')
    const [start, end] = dayRange(todayManila())
    const [m, a] = await Promise.all([
      supabase.from('members').select('id, full_name, phone').order('full_name'),
      supabase.from('attendance').select('id, checked_in_at, members(full_name)').gte('checked_in_at', start).lte('checked_in_at', end).order('checked_in_at', { ascending: false }),
    ])
    setMembers(m.data || [])
    setToday(a.data || [])
  }
  useEffect(() => { load() }, [])

  // Show the selected member's membership so staff can see what they're checking in
  useEffect(() => {
    if (!memberId) return setInfo([])
    supabase.from('memberships').select('*, membership_plans(name)').eq('member_id', memberId).order('end_date', { ascending: false })
      .then(({ data }) => setInfo(data || []))
  }, [memberId])

  async function checkin() {
    setMsg(null)
    if (!memberId) return setMsg({ ok: false, text: 'Select a member first.' })
    const { data, error } = await supabase.rpc('checkin_member', { p_member_id: memberId })
    if (error) return setMsg({ ok: false, text: error.message })
    const left = data.sessions_remaining
    setMsg({ ok: data.ok, text: data.message + (data.ok && left !== null ? ` Sessions remaining: ${left}.` : '') })
    load()
    supabase.from('memberships').select('*, membership_plans(name)').eq('member_id', memberId).order('end_date', { ascending: false })
      .then(({ data }) => setInfo(data || []))
  }

  async function removeCheckin(id: string) {
    if (!confirm('Delete this check-in record? (Sessions are not refunded automatically.)')) return
    const { error } = await supabase.from('attendance').delete().eq('id', id)
    if (error) return setMsg({ ok: false, text: error.message })
    load()
  }

  const filtered = members.filter((m) => `${m.full_name} ${m.phone}`.toLowerCase().includes(q.toLowerCase()))

  return (
    <>
      <h1>Member Check-in</h1>
      <div className="card">
        <form className="grid" onSubmit={(e) => { e.preventDefault(); checkin() }}>
          <label>Search member<input placeholder="Type a name or phone" value={q} onChange={(e) => setQ(e.target.value)} /></label>
          <label>Member
            <select value={memberId} onChange={(e) => setMemberId(e.target.value)}>
              <option value="">Select member</option>
              {filtered.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
            </select>
          </label>
          <button>Check in</button>
        </form>
        {msg && <div className={`msg ${msg.ok ? 'ok' : 'err'}`}>{msg.text}</div>}
        {memberId && (
          <div style={{ marginTop: 12 }}>
            <h2>Membership status</h2>
            {info.length === 0 ? <div className="empty">This member has no membership yet.</div> : (
              <table>
                <thead><tr><th>Plan</th><th>Valid until</th><th>Sessions left</th><th>Status</th></tr></thead>
                <tbody>
                  {info.map((r) => (
                    <tr key={r.id}>
                      <td>{r.membership_plans?.name}</td><td>{r.end_date}</td>
                      <td>{r.sessions_remaining ?? 'Unlimited'}</td>
                      <td><span className={`badge ${r.status}`}>{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <h2>Today's check-ins ({today.length})</h2>
        {today.length === 0 ? <div className="empty">No check-ins yet today.</div> : (
          <table>
            <thead><tr><th>Member</th><th>Time</th><th></th></tr></thead>
            <tbody>
              {today.map((a) => (
                <tr key={a.id}>
                  <td>{a.members?.full_name}</td><td>{fmtDateTime(a.checked_in_at)}</td>
                  <td><button className="small danger" onClick={() => removeCheckin(a.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
