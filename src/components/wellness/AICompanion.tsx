'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageCircleHeart, Send, Sparkles, Shield, Trash2, Bot, Wrench, CheckCircle2, XCircle, Zap } from 'lucide-react'

interface AgentAction {
  tool: string
  args: Record<string, unknown>
  success: boolean
  message: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  isSafety?: boolean
  actions?: AgentAction[]
  model?: string
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
  "I'm feeling stressed today 😔",
  "Log my mood as great 😄",
  "I just drank 3 glasses of water",
  "Help me create a morning routine",
  "I slept 7 hours and feel rested",
  "I need a breathing exercise",
  "What's my wellness summary?",
  "I want to set a goal to sleep better",
]

const toolIcons: Record<string, string> = {
  log_mood: '😊',
  log_hydration: '💧',
  log_sleep: '😴',
  create_habit: '✨',
  create_journal_entry: '📝',
  log_meditation: '🧘',
  get_wellness_summary: '📊',
  suggest_breathing_exercise: '🌬️',
  set_wellness_goal: '🎯',
}

const toolLabels: Record<string, string> = {
  log_mood: 'Mood Logged',
  log_hydration: 'Hydration Updated',
  log_sleep: 'Sleep Recorded',
  create_habit: 'Habit Created',
  create_journal_entry: 'Journal Entry Created',
  log_meditation: 'Meditation Logged',
  get_wellness_summary: 'Wellness Summary',
  suggest_breathing_exercise: 'Breathing Suggested',
  set_wellness_goal: 'Goal Updated',
}

export function AICompanion() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSafety, setShowSafety] = useState(false)
  const [thinkingText, setThinkingText] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/companion')
      if (res.ok) {
        const data = await res.json()
        setMessages(data.map((m: { id: string; role: string; content: string; createdAt: string; context: string | null }) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          createdAt: m.createdAt,
          isSafety: m.context === 'safety-escalation',
          actions: [],
        })))
      }
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
  }, [messages, loading])

  const handleSend = async (message?: string) => {
    const content = message || input.trim()
    if (!content || loading) return

    setInput('')
    setLoading(true)
    setThinkingText('Thinking...')

    const userMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])

    // Animate thinking states
    const thinkingInterval = setInterval(() => {
      const states = ['Understanding your message...', 'Considering your wellness context...', 'Preparing a thoughtful response...', 'Taking action if needed...']
      setThinkingText(states[Math.floor(Math.random() * states.length)])
    }, 2000)

    try {
      const res = await fetch('/api/companion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content }),
      })

      clearInterval(thinkingInterval)
      const data = await res.json()

      if (data.safety) {
        setShowSafety(true)
      }

      const assistantMsg: ChatMessage = {
        id: data.id || `resp-${Date.now()}`,
        role: 'assistant',
        content: data.content || "I'm here for you. Could you tell me more?",
        createdAt: new Date().toISOString(),
        isSafety: data.safety,
        actions: data.actions || [],
        model: data.model,
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch {
      clearInterval(thinkingInterval)
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: "I'm having trouble connecting right now. Please try again in a moment. Remember, I'm always here when you need me. 💚",
          createdAt: new Date().toISOString(),
          actions: [],
        },
      ])
    } finally {
      setLoading(false)
      setThinkingText('')
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
            <Bot className="h-6 w-6 text-primary" /> Wellness Companion
          </h2>
          <p className="text-muted-foreground mt-1 text-sm flex items-center gap-1.5">
            Agentic AI with tool-use capabilities
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-primary/10 text-primary">
              <Zap className="h-2.5 w-2.5 mr-0.5" /> Agentic
            </Badge>
          </p>
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
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Welcome, friend 🌿</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                I&apos;m Serenity, your agentic wellness companion. I don&apos;t just chat — I can
                <strong> log your moods, track hydration, create habits, write journal entries,</strong> and more.
              </p>
              <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/10 max-w-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold text-primary">Agentic Capabilities</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground text-left">
                  <span>😊 Log moods</span>
                  <span>💧 Track water</span>
                  <span>😴 Record sleep</span>
                  <span>✨ Create habits</span>
                  <span>📝 Write journals</span>
                  <span>🧘 Log meditation</span>
                  <span>🌬️ Suggest breathing</span>
                  <span>🎯 Set goals</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3 max-w-xs">
                ⚠️ I&apos;m not a therapist or medical professional. If you&apos;re in crisis, please reach out to a professional.
              </p>
              <div className="flex flex-wrap gap-2 mt-4 justify-center max-w-md">
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
                  <div className={`max-w-[90%] sm:max-w-[80%]`}>
                    <div
                      className={`rounded-2xl px-4 py-2.5 ${
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
                          {msg.model && (
                            <span className="text-[9px] text-muted-foreground ml-1">via {msg.model.split('/').pop()}</span>
                          )}
                        </div>
                      )}
                      {msg.role === 'assistant' && msg.isSafety && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <Shield className="h-3 w-3 text-rose" />
                          <span className="text-[10px] font-medium text-rose">Safety Notice</span>
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      <p className="text-[10px] mt-1 opacity-40">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    {/* Agent Action Cards */}
                    {msg.role === 'assistant' && msg.actions && msg.actions.length > 0 && (
                      <div className="mt-1.5 space-y-1">
                        {msg.actions.map((action, i) => (
                          <div
                            key={`${msg.id}-action-${i}`}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs wellness-transition animate-in fade-in slide-in-from-left-2 ${
                              action.success
                                ? 'bg-primary/5 border border-primary/10'
                                : 'bg-destructive/5 border border-destructive/10'
                            }`}
                            style={{ animationDelay: `${i * 100}ms` }}
                          >
                            <span className="text-sm">{toolIcons[action.tool] || '🔧'}</span>
                            <span className="font-medium text-foreground/80">{toolLabels[action.tool] || action.tool}</span>
                            {action.success ? (
                              <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                            ) : (
                              <XCircle className="h-3 w-3 text-destructive shrink-0" />
                            )}
                            <span className="text-muted-foreground truncate text-[10px]">{action.message}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-xs text-muted-foreground ml-1">{thinkingText}</span>
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
          placeholder="Tell me how you're feeling, or ask me to log something..."
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
        Agentic AI wellness companion — not a substitute for professional medical or mental health care.
      </p>
    </div>
  )
}
