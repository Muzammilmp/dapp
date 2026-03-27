'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Heart, ArrowLeft, Upload, X, CheckCircle } from 'lucide-react'

export default function DetailsPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [previews, setPreviews] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])

  const [form, setForm] = useState({
    name: '', age: '', gender: '', height: '', weight: '',
    bio: '', relation_type: 'full_time',
  })

  // Pre-fill if profile exists
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
      if (p) {
        setForm({
          name: p.name || '', age: p.age?.toString() || '', gender: p.gender || '',
          height: p.height?.toString() || '', weight: p.weight?.toString() || '',
          bio: p.bio || '', relation_type: p.relation_type || 'full_time',
        })
        if (p.photos?.length) setPreviews(p.photos)
      }
    })
  }, [router, supabase])

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []).slice(0, 5 - files.length)
    setFiles(prev => [...prev, ...selected].slice(0, 5))
    selected.forEach(f => {
      const reader = new FileReader()
      reader.onload = ev => setPreviews(prev => [...prev, ev.target?.result as string].slice(0, 5))
      reader.readAsDataURL(f)
    })
  }

  const removePhoto = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx))
    setPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      // Upload photos
      const photoUrls: string[] = previews.filter(p => p.startsWith('http'))
      for (const file of files) {
        const ext = file.name.split('.').pop()
        const path = `${user.id}/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from('photos').upload(path, file, { upsert: true })
        if (upErr) throw upErr
        const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(path)
        photoUrls.push(publicUrl)
      }

      const profileData = {
        id: user.id,
        name: form.name,
        age: parseInt(form.age) || null,
        gender: form.gender,
        height: parseFloat(form.height) || null,
        weight: parseFloat(form.weight) || null,
        bio: form.bio,
        relation_type: form.relation_type,
        photos: photoUrls,
        updated_at: new Date().toISOString(),
      }

      const { error: dbErr } = await supabase.from('profiles').upsert(profileData)
      if (dbErr) throw dbErr
      setSaved(true)
      setTimeout(() => router.push('/welcome'), 1500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setLoading(false)
    }
  }

  const field = (id: string, label: string, type = 'text', placeholder = '') => (
    <div>
      <label className="form-label" htmlFor={id}>{label}</label>
      <input id={id} type={type} placeholder={placeholder} className="input-field"
        value={form[id as keyof typeof form]}
        onChange={e => setForm(prev => ({ ...prev, [id]: e.target.value }))} />
    </div>
  )

  return (
    <div className="romantic-bg" style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative glows */}
      <div style={{ position: 'fixed', top: '-5%', left: '50%', transform: 'translateX(-50%)', width: 700, height: 400, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(244,63,94,0.1), transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

      {/* Navbar */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.1rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', background: 'rgba(15,10,26,0.6)' }}>
        <button onClick={() => router.push('/welcome')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Heart size={20} fill="#f43f5e" color="#f43f5e" />
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 700 }} className="gradient-text">Your Profile</span>
        </div>
      </nav>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '2.5rem 1.5rem 5rem', position: 'relative', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }} className="animate-fade-up">
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Tell us about <span className="gradient-text">yourself</span> ✨
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.95rem' }}>Your details help us find your perfect match</p>
        </div>

        <form onSubmit={handleSubmit} className="glass animate-fade-up" style={{ padding: '2.5rem', animationDelay: '0.1s', opacity: 0 }}>
          {/* Basic Info Section */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: '1.25rem' }}>Basic Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {field('name', 'Full Name', 'text', 'Your name')}
              {field('age', 'Age', 'number', '25')}
              <div>
                <label className="form-label" htmlFor="gender">Gender</label>
                <select id="gender" className="select-field" value={form.gender} onChange={e => setForm(prev => ({ ...prev, gender: e.target.value }))}>
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non_binary">Non-binary</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="form-label" htmlFor="relation_type">Looking for…</label>
                <select id="relation_type" className="select-field" value={form.relation_type} onChange={e => setForm(prev => ({ ...prev, relation_type: e.target.value }))}>
                  <option value="full_time">Full-time relationship 💍</option>
                  <option value="part_time">Part-time / casual 🌸</option>
                  <option value="friendship">Friendship first 🤝</option>
                </select>
              </div>
            </div>
          </div>

          {/* Body Info */}
          <div style={{ marginBottom: '2rem', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '2rem' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: '1.25rem' }}>Body Stats</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {field('height', 'Height (cm)', 'number', '170')}
              {field('weight', 'Weight (kg)', 'number', '65')}
            </div>
          </div>

          {/* Bio */}
          <div style={{ marginBottom: '2rem', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '2rem' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: '1.25rem' }}>About You</h3>
            <div>
              <label className="form-label" htmlFor="bio">Bio</label>
              <textarea id="bio" rows={3} placeholder="Tell potential matches a little about yourself..." className="input-field" style={{ resize: 'vertical' }}
                value={form.bio} onChange={e => setForm(prev => ({ ...prev, bio: e.target.value }))} />
            </div>
          </div>

          {/* Photos */}
          <div style={{ marginBottom: '2.5rem', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '2rem' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: '1.25rem' }}>Your Photos <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 400 }}>(up to 5)</span></h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.75rem' }}>
              {previews.map((src, idx) => (
                <div key={idx} style={{ position: 'relative', aspectRatio: '1', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button type="button" onClick={() => removePhoto(idx)} style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <X size={12} />
                  </button>
                </div>
              ))}
              {previews.length < 5 && (
                <button type="button" onClick={() => fileRef.current?.click()} style={{ aspectRatio: '1', borderRadius: '0.75rem', border: '1px dashed rgba(244,63,94,0.35)', background: 'rgba(244,63,94,0.05)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: 'rgba(255,255,255,0.35)', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(244,63,94,0.6)'; e.currentTarget.style.color = '#f9a8d4' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(244,63,94,0.35)'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}>
                  <Upload size={20} />
                  <span style={{ fontSize: '0.7rem' }}>Add Photo</span>
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: 'none' }} />
          </div>

          {/* Error */}
          {error && <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '0.6rem', padding: '0.7rem 1rem', marginBottom: '1rem', color: '#fda4af', fontSize: '0.85rem' }}>{error}</div>}

          {/* Submit */}
          <button id="save-profile" type="submit" className="btn-primary" style={{ width: '100%', fontSize: '1rem', padding: '0.875rem' }} disabled={loading || saved}>
            {saved ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <CheckCircle size={18} /> Profile Saved! Redirecting…
              </span>
            ) : loading ? 'Saving…' : 'Save My Profile 💕'}
          </button>
        </form>
      </div>
    </div>
  )
}
