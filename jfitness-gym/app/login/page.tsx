'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('registered')) {
      setInfo('Account created! You can now log in.')
    }
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={onSubmit}>
        <div className="brand">JFITNESS GYM</div>
        <div className="sub">Gym Management & Monitoring System</div>
        <h1>Log in</h1>
        <div style={{ display: 'grid', gap: 12 }}>
          <label>Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {info && <div className="msg ok">{info}</div>}
          {error && <div className="msg err">{error}</div>}
          <button disabled={loading}>{loading ? 'Logging in...' : 'Log in'}</button>
          <div className="sub" style={{ marginBottom: 0 }}>
            No account yet? <Link href="/register">Register</Link>
          </div>
        </div>
      </form>
    </div>
  )
}
