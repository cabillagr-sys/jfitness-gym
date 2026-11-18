'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const supabase = createClient()
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 6) return setError('Password must be at least 6 characters.')
    if (password !== confirm) return setError('Passwords do not match.')
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    // Sign out so the demo shows a separate login step with the new account
    await supabase.auth.signOut()
    router.push('/login?registered=1')
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={onSubmit}>
        <div className="brand">JFITNESS GYM</div>
        <div className="sub">Malaybalay City</div>
        <h1>Create an account</h1>
        <div style={{ display: 'grid', gap: 12 }}>
          <label>Full name
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </label>
          <label>Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <label>Confirm password
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </label>
          {error && <div className="msg err">{error}</div>}
          <button disabled={loading}>{loading ? 'Creating account...' : 'Register'}</button>
          <div className="sub" style={{ marginBottom: 0 }}>
            Already have an account? <Link href="/login">Log in</Link>
          </div>
        </div>
      </form>
    </div>
  )
}
