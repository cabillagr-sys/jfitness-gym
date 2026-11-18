import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from '@/components/LogoutButton'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single()

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">JFITNESS GYM</div>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/dashboard/members">Members</Link>
        <Link href="/dashboard/plans">Membership Plans</Link>
        <Link href="/dashboard/memberships">Memberships</Link>
        <Link href="/dashboard/checkin">Check-in</Link>
        <Link href="/dashboard/payments">Payments</Link>
        <Link href="/dashboard/reports">Daily Sales Report</Link>
        <div className="user">
          Signed in as<br />
          <strong>{profile?.full_name || user.email}</strong>
          <br />
          {user.email}
        </div>
        <LogoutButton />
      </aside>
      <main className="content">{children}</main>
    </div>
  )
}
