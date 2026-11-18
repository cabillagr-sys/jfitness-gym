import { createClient } from '@/lib/supabase/server'
import { todayManila, dayRange, peso } from '@/lib/format'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const today = todayManila()
  const [start, end] = dayRange(today)

  // Automation: mark memberships past their end date as expired
  await supabase.rpc('expire_memberships')

  const [members, active, checkins, sales, recent] = await Promise.all([
    supabase.from('members').select('*', { count: 'exact', head: true }),
    supabase.from('memberships').select('member_id').eq('status', 'active'),
    supabase.from('attendance').select('*', { count: 'exact', head: true }).gte('checked_in_at', start).lte('checked_in_at', end),
    supabase.from('payments').select('amount').gte('paid_at', start).lte('paid_at', end),
    supabase.from('attendance').select('id, checked_in_at, members(full_name)').order('checked_in_at', { ascending: false }).limit(8),
  ])

  const activeMembers = new Set((active.data || []).map((m: any) => m.member_id)).size
  const salesTotal = (sales.data || []).reduce((s: number, p: any) => s + Number(p.amount), 0)

  return (
    <>
      <h1>Dashboard</h1>
      <div className="stats">
        <div className="stat"><div className="label">Total members</div><div className="value">{members.count ?? 0}</div></div>
        <div className="stat"><div className="label">Active members</div><div className="value">{activeMembers}</div></div>
        <div className="stat"><div className="label">Today's check-ins</div><div className="value">{checkins.count ?? 0}</div></div>
        <div className="stat"><div className="label">Today's sales</div><div className="value">{peso(salesTotal)}</div></div>
      </div>
      <div className="card">
        <h2>Recent check-ins</h2>
        {(recent.data || []).length === 0 ? (
          <div className="empty">No check-ins yet.</div>
        ) : (
          <table>
            <thead><tr><th>Member</th><th>Time</th></tr></thead>
            <tbody>
              {(recent.data || []).map((a: any) => (
                <tr key={a.id}>
                  <td>{a.members?.full_name}</td>
                  <td>{new Date(a.checked_in_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
