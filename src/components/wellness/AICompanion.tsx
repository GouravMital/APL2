'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageCircleHeart, Send, Sparkles, Shield, Trash2 } from 'lucide-react'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  isSafety?: boolean
}

const safetyBanner = {
  title: 'Your safety matters',
  message: 'If you or someone you know is in crisis or experiencing thoughts of self-harm, please reach out for help now.',
  resources: [
    { name: 'National Suicide Prevention Lifeline', contact: '988 (US)' },
    { name: 'Crisis Text Line', contact: 'Text HOME to 741741' },
    { name: 'International Association for Suicide Prevention', contact: 'https://www.iasp.info/resources/Crisis_Centres/' },
  ],
}

const quickPrompts = [
  "I'm feeling stressed today",
  "Help me stay motivated",
  "I need a moment of calm",
  "Tips for better sleep",
  "How to build healthy habits",
  "I'm feeling overwhelmed",
]

export function AICompanion() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSafety, setShowSafety] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/companion')
      if (res.ok) setMessages(await res.json())
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async (message?: string) => {
    const content = message || input.trim()
    if (!content || loading) return

    setInput('')
    setLoading(true)

    const userMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])

    try {
      const res = await fetch('/api/companion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content }),
      })

      const data = await res.json()

      if (data.safety) {
        setShowSafety(true)
      }

      const assistantMsg: ChatMessage = {
        id: data.id || `resp-${Date.now()}`,
        role: 'assistant',
        content: data.content || data.response || 'I\'m here for you. Could you tell me more?',
        createdAt: new Date().toISOString(),
        isSafety: data.safety,
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: "I'm having trouble connecting right now. Please try again in a moment. Remember, I'm always here when you need me. 💚",
          createdAt: new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleClear = async () => {
    try {
      await fetch('/api/companion', { method: 'DELETE' })
      setMessages([])
    } catch {
      // silently fail
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="space-y-4 flex flex-col h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <MessageCircleHeart className="h-6 w-6 text-primary" /> Wellness Companion
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">Your supportive AI wellness guide</p>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClear} className="text-muted-foreground hover:text-destructive gap-1">
            <Trash2 className="h-3.5 w-3.5" /> Clear
          </Button>
        )}
      </div>

      {/* Safety Banner */}
      {showSafety && (
        <Card className="bg-rose-light/30 border-rose/30 animate-in fade-in">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-2">
              <Shield className="h-5 w-5 text-rose shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-rose">{safetyBanner.title}</p>
                <p className="text-xs text-foreground/80 mt-1">{safetyBanner.message}</p>
                <div className="mt-2 space-y-1">
                  {safetyBanner.resources.map((r) => (
                    <p key={r.name} className="text-xs text-muted-foreground">
                      <strong>{r.name}:</strong> {r.contact}
                    </p>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 text-xs border-rose/30 text-rose hover:bg-rose/10"
                  onClick={() => setShowSafety(false)}
                >
                  I understand
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col min-h-0 bg-card/30">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Welcome, friend 🌿</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                I&apos;m your wellness companion. I&apos;m here to listen, support, and guide you. 
                I consider your mood, habits, and goals when I respond.
              </p>
              <p className="text-xs text-muted-foreground mt-3 max-w-xs">
                ⚠️ I&apos;m not a therapist or medical professional. If you&apos;re in crisis, 
                please reach out to a professional or emergency service.
              </p>
              <div className="flex flex-wrap gap-2 mt-6 justify-center max-w-sm">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-accent wellness-transition"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : msg.isSafety
                        ? 'bg-rose-light/50 border border-rose/20 rounded-bl-md'
                        : 'bg-muted rounded-bl-md'
                    }`}
                  >
                    {msg.role === 'assistant' && !msg.isSafety && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <Sparkles className="h-3 w-3 text-primary" />
                        <span className="text-[10px] font-medium text-primary">Serenity</span>
                      </div>
                    )}
                    {msg.role === 'assistant' && msg.isSafety && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <Shield className="h-3 w-3 text-rose" />
                        <span className="text-[10px] font-medium text-rose">Safety Notice</span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    <p className="text-[10px] mt-1 opacity-50">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </Card>

      {/* Input */}
      <div className="flex gap-2 items-end">
        <Textarea
          ref={inputRef}
          placeholder="Share what's on your mind..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[44px] max-h-[120px] resize-none bg-card/50"
          rows={1}
          disabled={loading}
        />
        <Button
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          className="bg-primary hover:bg-primary/90 h-[44px] w-[44px] shrink-0 rounded-xl p-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-muted-foreground text-center">
        This is an AI wellness companion, not a substitute for professional medical or mental health care.
      </p>
    </div>
  )
}
