'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Heart, LogOut, Star, Users, Camera } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

export default function WelcomePage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<{ name?: string } | null>(null)
  const [hearts, setHearts] = useState<{ id: number; left: number; size: number; delay: number; speed: number }[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setUser(data.user)
      // Load profile name
      supabase.from('profiles').select('name').eq('id', data.user.id).single().then(({ data: p }) => setProfile(p))
    })
    // floating hearts
    setHearts(Array.from({ length: 18 }, (_, i) => ({
      id: i, left: Math.random() * 100, size: 12 + Math.random() * 18,
      delay: Math.random() * 10, speed: 6 + Math.random() * 6,
    })))
  }, [router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const displayName = profile?.name || user?.email?.split('@')[0] || 'there'

  const actions = [
    { label: 'Enter Your Details', emoji: '✍️', icon: Star, href: '/details', desc: 'Tell us about yourself', delay: '0.2s', color: '#f43f5e' },
    { label: 'Your Matches', emoji: '💞', icon: Users, href: '/matches', desc: 'See who likes you back', delay: '0.35s', color: '#ec4899' },
    { label: 'Rate My Face', emoji: '📸', icon: Camera, href: '/rate', desc: 'Get your attraction score', delay: '0.5s', color: '#a855f7' },
  ]

  return (
    <div className="romantic-bg" style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Floating hearts */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        {hearts.map(h => (
          <div key={h.id} style={{
            position: 'absolute', bottom: '-60px', left: `${h.left}%`,
            fontSize: `${h.size}px`, opacity: 0.25,
            animation: `floatUp ${h.speed}s ease-in infinite`,
            animationDelay: `${h.delay}s`,
          }}>❤️</div>
        ))}
      </div>

      {/* Large ambient glows */}
      <div style={{ position: 'fixed', top: '-10%', right: '-5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.12), transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-10%', left: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(244,63,94,0.12), transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

      {/* Navbar */}
      <nav style={{ position: 'relative', zIndex: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #f43f5e, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Heart size={18} fill="white" color="white" />
          </div>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 700 }} className="gradient-text">Dapp</span>
        </div>
        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '9999px', padding: '0.45rem 1rem', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s' }}>
          <LogOut size={14} /> Sign out
        </button>
      </nav>

      {/* Hero */}
      <main style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 73px)', padding: '3rem 1.5rem', textAlign: 'center' }}>
        {/* Welcome text */}
        <div className="animate-fade-up" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'inline-block', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: '9999px', padding: '0.35rem 1rem', fontSize: '0.8rem', color: '#fda4af', marginBottom: '1.5rem' }}>
            💕 Welcome back to Dapp
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 700, lineHeight: 1.1, marginBottom: '1.25rem' }}>
            Hello, <span className="gradient-text">{displayName}</span> 🌹
          </h1>
          <p style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: 'rgba(255,255,255,0.55)', maxWidth: 500, margin: '0 auto 3rem', lineHeight: 1.7 }}>
            Love is just around the corner. Complete your profile, discover your matches, and let fate do the rest.
          </p>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', width: '100%', maxWidth: 840 }}>
          {actions.map(action => (
            <button key={action.href} id={`btn-${action.href.slice(1)}`} onClick={() => router.push(action.href)}
              className="glass animate-fade-up"
              style={{
                opacity: 0,
                animationDelay: action.delay,
                padding: '2rem 1.5rem',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget
                el.style.transform = 'translateY(-6px)'
                el.style.borderColor = action.color + '60'
                el.style.boxShadow = `0 20px 40px ${action.color}25`
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.transform = 'translateY(0)'
                el.style.borderColor = 'rgba(255,255,255,0.1)'
                el.style.boxShadow = 'none'
              }}
            >
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: `linear-gradient(135deg, ${action.color}33, ${action.color}15)`, border: `1px solid ${action.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
                {action.emoji}
              </div>
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 600, color: 'white', marginBottom: '0.3rem' }}>
                  {action.label}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)' }}>{action.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Bottom love quote */}
        <div style={{ marginTop: '4rem', color: 'rgba(255,255,255,0.2)', fontSize: '0.82rem', fontStyle: 'italic' }}>
          "The best love is the kind that awakens the soul." — Nicholas Sparks
        </div>
      </main>
    </div>
  )
}
