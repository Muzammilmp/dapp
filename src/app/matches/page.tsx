'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Heart, ArrowLeft, MessageCircle, Eye, ChevronLeft, ChevronRight, X, Star } from 'lucide-react'

interface Profile {
  id: string
  name: string
  age: number
  gender: string
  relation_type: string
  photos: string[]
  face_score: number
  bio: string
  height: number
  weight: number
}

const PAGE_SIZE = 8

export default function MatchesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [myScore, setMyScore] = useState<number | null>(null)
  const [viewProfile, setViewProfile] = useState<Profile | null>(null)
  const [myId, setMyId] = useState<string>('')

  const loadMatches = useCallback(async (currentUserId: string, userScore: number | null, currentPage: number) => {
    setLoading(true)
    const from = (currentPage - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .neq('id', currentUserId)
      .not('name', 'is', null)
    
    // Improved proximity-based matching using a range filter if user has a score
    if (userScore !== null) {
      // Show people within +/- 2.0 of user's score first
      query = query
        .gte('face_score', userScore - 2)
        .lte('face_score', userScore + 2)
        .order('face_score', { ascending: true })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    query = query.range(from, to)

    const { data, count, error } = await query
    if (!error && data) {
      let sorted = data as Profile[]
      // Sort by nearest face score
      if (userScore !== null) {
        sorted = sorted.sort((a, b) =>
          Math.abs((a.face_score || 0) - userScore) - Math.abs((b.face_score || 0) - userScore)
        )
      }
      setProfiles(sorted)
      setTotal(count || 0)
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setMyId(data.user.id)
      const { data: p } = await supabase.from('profiles').select('face_score').eq('id', data.user.id).single()
      const score = p?.face_score ?? null
      setMyScore(score)
      await loadMatches(data.user.id, score, 1)
    })
  }, [router, supabase, loadMatches])

  const changePage = (p: number) => {
    setPage(p)
    loadMatches(myId, myScore, p)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const relationLabel = (r: string) => {
    if (r === 'full_time') return '💍 Full-time'
    if (r === 'part_time') return '🌸 Part-time'
    return '🤝 Friendship'
  }

  return (
    <div className="romantic-bg" style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Ambient */}
      <div style={{ position: 'fixed', top: '-5%', right: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(244,63,94,0.1), transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

      {/* Navbar */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.1rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', background: 'rgba(15,10,26,0.6)' }}>
        <button onClick={() => router.push('/welcome')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <Heart size={18} fill="#f43f5e" color="#f43f5e" />
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 700 }} className="gradient-text">Your Matches</span>
        <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem' }}>
          {total} people found
        </span>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2.5rem 1.5rem 5rem', position: 'relative', zIndex: 10 }}>
        {/* Score hint */}
        {myScore !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)', borderRadius: '0.75rem', padding: '0.75rem 1.25rem', marginBottom: '2rem', color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem' }}>
            <Star size={14} color="#f43f5e" fill="#f43f5e" />
            Showing users closest to your face score of <strong style={{ color: '#fda4af' }}>{myScore}/10</strong>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', color: 'rgba(255,255,255,0.4)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem', animation: 'pulse 1.5s ease-in-out infinite' }}>💕</div>
            Finding your matches…
          </div>
        ) : profiles.length === 0 ? (
          <div className="glass" style={{ padding: '4rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💔</div>
            <p style={{ color: 'rgba(255,255,255,0.5)' }}>No matches found yet. Check back soon!</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="glass" style={{ overflow: 'hidden', marginBottom: '1.5rem' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
                      {['Photo', 'Name', 'Age', 'Looking For', 'Score', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '1rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.map((profile, idx) => (
                      <tr key={profile.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(244,63,94,0.04)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        {/* Photo */}
                        <td style={{ padding: '0.875rem 1.25rem' }}>
                          <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {profile.photos?.length > 0 ? (
                              <img src={profile.photos[0]} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <span style={{ fontSize: '1.4rem' }}>👤</span>
                            )}
                          </div>
                        </td>
                        {/* Name */}
                        <td style={{ padding: '0.875rem 1.25rem' }}>
                          <div style={{ fontWeight: 600, color: 'white', fontSize: '0.95rem' }}>{profile.name}</div>
                          {profile.gender && <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.1rem', textTransform: 'capitalize' }}>{profile.gender}</div>}
                        </td>
                        {/* Age */}
                        <td style={{ padding: '0.875rem 1.25rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                          {profile.age || '—'}
                        </td>
                        {/* Relation */}
                        <td style={{ padding: '0.875rem 1.25rem' }}>
                          <span style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '9999px', padding: '0.25rem 0.7rem', fontSize: '0.78rem', color: '#fda4af' }}>
                            {relationLabel(profile.relation_type)}
                          </span>
                        </td>
                        {/* Score */}
                        <td style={{ padding: '0.875rem 1.25rem' }}>
                          {profile.face_score ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <Star size={13} fill="#f43f5e" color="#f43f5e" />
                              <span style={{ fontWeight: 600, color: '#fda4af' }}>{profile.face_score.toFixed(1)}</span>
                            </div>
                          ) : '—'}
                        </td>
                        {/* Actions */}
                        <td style={{ padding: '0.875rem 1.25rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => setViewProfile(profile)}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)', borderRadius: '9999px', padding: '0.35rem 0.75rem', color: '#c4b5fd', fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 500 }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(168,85,247,0.2)'; e.currentTarget.style.borderColor = 'rgba(168,85,247,0.4)' }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(168,85,247,0.1)'; e.currentTarget.style.borderColor = 'rgba(168,85,247,0.25)' }}>
                              <Eye size={13} /> View
                            </button>
                            <button onClick={() => router.push(`/chat/${profile.id}`)}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: '9999px', padding: '0.35rem 0.75rem', color: '#fda4af', fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 500 }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.2)'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.4)' }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.1)'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.25)' }}>
                              <MessageCircle size={13} /> Chat
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                <button onClick={() => changePage(Math.max(1, page - 1))} disabled={page === 1}
                  style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: page > 1 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === 1 ? 0.4 : 1, transition: 'all 0.2s' }}>
                  <ChevronLeft size={15} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => changePage(p)}
                    style={{ width: 36, height: 36, borderRadius: '50%', background: p === page ? 'linear-gradient(135deg, #f43f5e, #ec4899)' : 'rgba(255,255,255,0.05)', border: p === page ? 'none' : '1px solid rgba(255,255,255,0.1)', color: p === page ? 'white' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontWeight: p === page ? 700 : 400, fontSize: '0.85rem', boxShadow: p === page ? '0 4px 15px rgba(244,63,94,0.3)' : 'none', transition: 'all 0.2s' }}>
                    {p}
                  </button>
                ))}
                <button onClick={() => changePage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                  style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: page < totalPages ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === totalPages ? 0.4 : 1, transition: 'all 0.2s' }}>
                  <ChevronRight size={15} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Profile Modal */}
      {viewProfile && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={() => setViewProfile(null)}>
          <div className="glass" style={{ width: '100%', maxWidth: 420, padding: '2rem', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewProfile(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={14} />
            </button>

            {/* Photos carousel */}
            {viewProfile.photos?.length > 0 ? (
              <div style={{ borderRadius: '0.75rem', overflow: 'hidden', marginBottom: '1.25rem', height: 220 }}>
                <img src={viewProfile.photos[0]} alt={viewProfile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ) : (
              <div style={{ height: 120, background: 'rgba(244,63,94,0.08)', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', marginBottom: '1.25rem' }}>👤</div>
            )}

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>{viewProfile.name}</h2>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {viewProfile.age && `${viewProfile.age} yrs`}{viewProfile.gender && ` · ${viewProfile.gender}`}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              {[
                ['Relation', relationLabel(viewProfile.relation_type)],
                ['Score', viewProfile.face_score ? `⭐ ${viewProfile.face_score.toFixed(1)}/10` : '—'],
                viewProfile.height ? ['Height', `${viewProfile.height} cm`] : null,
                viewProfile.weight ? ['Weight', `${viewProfile.weight} kg`] : null,
              ].filter(Boolean).map(([label, value]) => (
                <div key={label as string} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '0.6rem', padding: '0.6rem 0.85rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginBottom: '0.15rem' }}>{label as string}</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 500, color: 'white' }}>{value as string}</div>
                </div>
              ))}
            </div>

            {viewProfile.bio && (
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1.25rem', fontStyle: 'italic' }}>
                "{viewProfile.bio}"
              </p>
            )}

            {/* Extra photos */}
            {viewProfile.photos?.length > 1 && (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', overflowX: 'auto' }}>
                {viewProfile.photos.slice(1).map((url, i) => (
                  <img key={i} src={url} alt="" style={{ width: 60, height: 60, borderRadius: '0.5rem', objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }} />
                ))}
              </div>
            )}

            <button onClick={() => { setViewProfile(null); router.push(`/chat/${viewProfile.id}`) }} className="btn-primary" style={{ width: '100%' }}>
              <MessageCircle size={16} style={{ marginRight: '0.5rem', display: 'inline' }} /> Start Chatting 💕
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.15); } }`}</style>
    </div>
  )
}
