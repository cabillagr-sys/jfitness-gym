'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LogoutButton() {
  const router = useRouter()
  async function logout() {
    await createClient().auth.signOut()
    router.push('/login')
    router.refresh()
  }
  return (
    <button className="secondary" onClick={logout} style={{ margin: '8px 10px' }}>
      Log out
    </button>
  )
}
