'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Heart, ArrowLeft, Send } from 'lucide-react'
import type { RealtimePostgresInsertPayload } from '@supabase/supabase-js'

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
}

interface Profile {
  id: string
  name: string
  photos: string[]
}

export default function ChatPage() {
  const router = useRouter()
  const params = useParams()
  const otherId = params.userId as string
  const supabase = createClient()

  const [myId, setMyId] = useState('')
  const [otherProfile, setOtherProfile] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })

  const loadMessages = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true })
    if (data) setMessages(data as Message[])
  }, [supabase, otherId])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setMyId(data.user.id)

      // Load other user profile
      const { data: p } = await supabase.from('profiles').select('id,name,photos').eq('id', otherId).single()
      if (p) setOtherProfile(p as Profile)

      // Load messages
      await loadMessages(data.user.id)
      scrollToBottom()

      // Subscribe to realtime
      const channel = supabase
        .channel('messages-channel')
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'messages',
        }, (payload: RealtimePostgresInsertPayload<Message>) => {
          const msg = payload.new
          if (
            (msg.sender_id === data.user!.id && msg.receiver_id === otherId) ||
            (msg.sender_id === otherId && msg.receiver_id === data.user!.id)
          ) {
            setMessages(prev => {
              // prevent duplicate if we already appended it in sendMessage
              if (prev.some(m => m.id === msg.id)) return prev
              setTimeout(scrollToBottom, 100)
              return [...prev, msg]
            })
          }
        })
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    })
  }, [router, supabase, otherId, loadMessages])

  useEffect(() => { scrollToBottom() }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !myId) return
    setSending(true)
    const { data: newMsg, error } = await supabase.from('messages').insert({
      sender_id: myId, receiver_id: otherId, content: text.trim(),
    }).select().single()
    
    if (!error && newMsg) {
      setText('')
      // Message will be appended via the Realtime listener
    }
    setSending(false)
  }

  const formatTime = (ts: string) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="romantic-bg" style={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      {/* Ambient */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 600, height: 300, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(244,63,94,0.08), transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

      {/* Header */}
      <header style={{ position: 'relative', zIndex: 20, display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', background: 'rgba(15,10,26,0.75)', flexShrink: 0 }}>
        <button onClick={() => router.push('/matches')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} />
        </button>

        {/* Avatar */}
        <div style={{ width: 42, height: 42, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(244,63,94,0.4)', background: 'rgba(244,63,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {otherProfile?.photos?.[0] ? (
            <img src={otherProfile.photos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : <span style={{ fontSize: '1.2rem' }}>👤</span>}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '1rem', color: 'white' }}>{otherProfile?.name || 'Loading…'}</div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Heart size={10} fill="#f43f5e" color="#f43f5e" /> Online
          </div>
        </div>
      </header>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative', zIndex: 10 }}>
        {messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💌</div>
            <p>Say hello to {otherProfile?.name || 'them'}!</p>
            <p style={{ fontSize: '0.8rem', marginTop: '0.3rem' }}>Be the first to start the conversation</p>
          </div>
        )}
        {messages.map(msg => {
          const isMine = msg.sender_id === myId
          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '70%',
                padding: '0.65rem 1rem',
                borderRadius: isMine ? '1.25rem 1.25rem 0.25rem 1.25rem' : '1.25rem 1.25rem 1.25rem 0.25rem',
                background: isMine
                  ? 'linear-gradient(135deg, #f43f5e, #ec4899)'
                  : 'rgba(255,255,255,0.07)',
                border: isMine ? 'none' : '1px solid rgba(255,255,255,0.09)',
                boxShadow: isMine ? '0 4px 15px rgba(244,63,94,0.25)' : 'none',
              }}>
                <p style={{ fontSize: '0.9rem', color: 'white', lineHeight: 1.5, wordBreak: 'break-word' }}>{msg.content}</p>
                <div style={{ fontSize: '0.65rem', color: isMine ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.3)', marginTop: '0.25rem', textAlign: isMine ? 'right' : 'left' }}>
                  {formatTime(msg.created_at)}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} style={{ position: 'relative', zIndex: 20, display: 'flex', gap: '0.75rem', padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', background: 'rgba(15,10,26,0.75)', flexShrink: 0 }}>
        <input
          id="chat-input"
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Write a sweet message… 💕"
          className="input-field"
          style={{ flex: 1 }}
          maxLength={500}
          disabled={sending}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e) } }}
        />
        <button type="submit" disabled={!text.trim() || sending}
          style={{ width: 46, height: 46, borderRadius: '50%', background: text.trim() ? 'linear-gradient(135deg, #f43f5e, #ec4899)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', cursor: text.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0, transition: 'all 0.2s', boxShadow: text.trim() ? '0 4px 15px rgba(244,63,94,0.35)' : 'none' }}>
          <Send size={18} />
        </button>
      </form>
    </div>
  )
}
