'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Heart, Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [hearts, setHearts] = useState<{ id: number; left: number; size: number; delay: number }[]>([])

  useEffect(() => {
    // Generate floating hearts
    const h = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 10 + Math.random() * 20,
      delay: Math.random() * 8,
    }))
    setHearts(h)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setSuccess('Account created! Please check your email to confirm, then log in.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/welcome')
        router.refresh()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="romantic-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      {/* Floating hearts */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {hearts.map(h => (
          <div key={h.id} style={{
            position: 'absolute',
            bottom: '-50px',
            left: `${h.left}%`,
            fontSize: `${h.size}px`,
            animation: `floatUp ${6 + h.delay}s ease-in infinite`,
            animationDelay: `${h.delay}s`,
            opacity: 0.4,
          }}>❤️</div>
        ))}
      </div>

      {/* Glow circles */}
      <div style={{ position: 'absolute', top: '10%', left: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(244,63,94,0.15), transparent 70%)', filter: 'blur(40px)' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.15), transparent 70%)', filter: 'blur(40px)' }} />

      <div style={{ width: '100%', maxWidth: 440, padding: '0 1.5rem', zIndex: 10 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }} className="animate-fade-up">
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #f43f5e, #a855f7)', marginBottom: '1rem', boxShadow: '0 8px 32px rgba(244,63,94,0.4)' }}>
            <Heart size={36} fill="white" color="white" />
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.02em' }} className="gradient-text">
            Dapp
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '0.4rem', fontSize: '0.9rem' }}>
            Find your perfect match ✨
          </p>
        </div>

        {/* Card */}
        <div className="glass animate-fade-up" style={{ padding: '2.5rem', animationDelay: '0.1s', opacity: 0 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '0.75rem', padding: '0.25rem', marginBottom: '2rem' }}>
            {(['login', 'signup'] as const).map(tab => (
              <button key={tab} onClick={() => { setMode(tab); setError(''); setSuccess('') }} style={{
                flex: 1,
                padding: '0.6rem',
                borderRadius: '0.6rem',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
                transition: 'all 0.2s',
                background: mode === tab ? 'linear-gradient(135deg, #f43f5e, #ec4899)' : 'transparent',
                color: mode === tab ? 'white' : 'rgba(255,255,255,0.45)',
                boxShadow: mode === tab ? '0 4px 15px rgba(244,63,94,0.3)' : 'none',
              }}>
                {tab === 'login' ? 'Log In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)' }} />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-field"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)' }} />
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field"
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error / Success */}
            {error && (
              <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '0.6rem', padding: '0.7rem 1rem', marginBottom: '1rem', color: '#fda4af', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '0.6rem', padding: '0.7rem 1rem', marginBottom: '1rem', color: '#86efac', fontSize: '0.85rem', display:'flex', gap:'0.5rem', alignItems:'center' }}>
                <Sparkles size={14} /> {success}
              </div>
            )}

            <button id="auth-submit" type="submit" className="btn-primary" style={{ width: '100%', fontSize: '1rem', padding: '0.875rem' }} disabled={loading}>
              {loading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg style={{ animation: 'spin 1s linear infinite', width: 18, height: 18 }} viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
                  </svg>
                  {mode === 'login' ? 'Logging in…' : 'Creating account…'}
                </span>
              ) : (
                mode === 'login' ? 'Log In to Dapp 💕' : 'Join Dapp 🌹'
              )}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f9a8d4', fontWeight: 600 }}>
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>
          Made with ❤️ — find love, find Dapp
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
