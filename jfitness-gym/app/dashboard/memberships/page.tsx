'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { todayManila, addDays, peso } from '@/lib/format'

export default function MembershipsPage() {
  const supabase = createClient()
  const [rows, setRows] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [memberId, setMemberId] = useState('')
  const [planId, setPlanId] = useState('')
  const [startDate, setStartDate] = useState(todayManila())
  const [recordPayment, setRecordPayment] = useState(true)
  const [method, setMethod] = useState('cash')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function load() {
    await supabase.rpc('expire_memberships')
    const [m, p, ms] = await Promise.all([
      supabase.from('members').select('id, full_name').order('full_name'),
      supabase.from('membership_plans').select('*').eq('is_active', true).order('price'),
      supabase.from('memberships').select('*, members(full_name), membership_plans(name, price)').order('created_at', { ascending: false }),
    ])
    setMembers(m.data || [])
    setPlans(p.data || [])
    setRows(ms.data || [])
    if (ms.error) setMsg({ ok: false, text: ms.error.message })
  }
  useEffect(() => { load() }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    const plan = plans.find((p) => p.id === planId)
    if (!plan || !memberId) return setMsg({ ok: false, text: 'Choose a member and a plan.' })

    // Automation: end date and session count come from the plan
    const endDate = addDays(startDate, plan.duration_days)
    const { data: ms, error } = await supabase
      .from('memberships')
      .insert({
        member_id: memberId,
        plan_id: planId,
        start_date: startDate,
        end_date: endDate,
        sessions_remaining: plan.session_limit,
        status: 'active',
      })
      .select()
      .single()
    if (error) return setMsg({ ok: false, text: error.message })

    if (recordPayment) {
      const { data: { user } } = await supabase.auth.getUser()
      const pay = await supabase.from('payments').insert({
        member_id: memberId,
        membership_id: ms.id,
        amount: plan.price,
        method,
        notes: `Membership: ${plan.name}`,
        recorded_by: user?.id,
      })
      if (pay.error) return setMsg({ ok: false, text: 'Membership saved, but payment failed: ' + pay.error.message })
    }
    setMsg({ ok: true, text: `Membership assigned (valid until ${endDate})${recordPayment ? ' and payment recorded.' : '.'}` })
    setMemberId('')
    setPlanId('')
    load()
  }

  async function setStatus(r: any, status: string) {
    const { error } = await supabase.from('memberships').update({ status }).eq('id', r.id)
    if (error) return setMsg({ ok: false, text: error.message })
    setMsg({ ok: true, text: `Membership marked ${status}.` })
    load()
  }

  async function remove(r: any) {
    if (!confirm('Delete this membership record?')) return
    const { error } = await supabase.from('memberships').delete().eq('id', r.id)
    if (error) return setMsg({ ok: false, text: error.message })
    setMsg({ ok: true, text: 'Membership deleted.' })
    load()
  }

  return (
    <>
      <h1>Memberships</h1>
      <div className="card">
        <h2>Assign a plan to a member</h2>
        <form className="grid" onSubmit={save}>
          <label>Member
            <select required value={memberId} onChange={(e) => setMemberId(e.target.value)}>
              <option value="">Select member</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
            </select>
          </label>
          <label>Plan
            <select required value={planId} onChange={(e) => setPlanId(e.target.value)}>
              <option value="">Select plan</option>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.name} - {peso(p.price)}</option>)}
            </select>
          </label>
          <label>Start date<input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} /></label>
          <label>Payment method
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="cash">Cash</option>
              <option value="gcash">GCash</option>
              <option value="card">Card</option>
            </select>
          </label>
          <label className="check"><input type="checkbox" checked={recordPayment} onChange={(e) => setRecordPayment(e.target.checked)} /> Record payment now</label>
          <button>Assign</button>
        </form>
        {msg && <div className={`msg ${msg.ok ? 'ok' : 'err'}`}>{msg.text}</div>}
      </div>

      <div className="card">
        <h2>All memberships</h2>
        {rows.length === 0 ? <div className="empty">No memberships yet.</div> : (
          <table>
            <thead><tr><th>Member</th><th>Plan</th><th>Start</th><th>End</th><th>Sessions left</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.members?.full_name}</td>
                  <td>{r.membership_plans?.name}</td>
                  <td>{r.start_date}</td><td>{r.end_date}</td>
                  <td>{r.sessions_remaining ?? 'Unlimited'}</td>
                  <td><span className={`badge ${r.status}`}>{r.status}</span></td>
                  <td><div className="row-actions">
                    {r.status !== 'active' && <button className="small secondary" onClick={() => setStatus(r, 'active')}>Activate</button>}
                    {r.status === 'active' && <button className="small secondary" onClick={() => setStatus(r, 'cancelled')}>Cancel</button>}
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
