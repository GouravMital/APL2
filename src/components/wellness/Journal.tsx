'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useState, useEffect, useCallback } from 'react'
import { BookOpen, Plus, Sparkles } from 'lucide-react'

const journalPrompts = [
  "What are three things you're grateful for today?",
  "How did you take care of yourself today?",
  "What challenged you today and how did you handle it?",
  "Describe a moment of joy you experienced recently.",
  "What would you tell your younger self right now?",
  "What boundary do you need to set or maintain?",
  "What does self-compassion look like for you today?",
  "Name one thing you're proud of this week.",
  "What emotions are you sitting with right now?",
  "How can you be kinder to yourself tomorrow?",
]

const tagColors: Record<string, string> = {
  gratitude: 'bg-wellness-light text-primary',
  reflection: 'bg-lavender-light text-lavender',
  goals: 'bg-warm-light text-warm',
  selfcare: 'bg-sage-light text-sage',
  feelings: 'bg-rose-light text-rose',
  growth: 'bg-wellness-light text-primary',
}

interface JournalEntry {
  id: string
  title: string
  content: string
  tags: string
  date: string
}

export function Journal() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [prompt, setPrompt] = useState('')
  const [saving, setSaving] = useState(false)
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null)

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/journal')
      if (res.ok) setEntries(await res.json())
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    fetchEntries()
    setPrompt(journalPrompts[Math.floor(Math.random() * journalPrompts.length)])
  }, [fetchEntries])

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, tags }),
      })
      if (res.ok) {
        setTitle('')
        setContent('')
        setTags('')
        setIsOpen(false)
        fetchEntries()
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false)
    }
  }

  const applyPrompt = (p: string) => {
    setContent(p + '\n\n')
    setIsOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" /> Journal
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">Express yourself freely</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 gap-2">
              <Plus className="h-4 w-4" /> New Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Journal Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <Input
                placeholder="Give your entry a title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-background/50"
              />
              <Textarea
                placeholder="Write your thoughts..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px] resize-none bg-background/50"
              />
              <Input
                placeholder="Tags (comma separated: gratitude, reflection, selfcare)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="bg-background/50"
              />
              <Button
                onClick={handleSave}
                disabled={saving || !title.trim() || !content.trim()}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {saving ? 'Saving...' : 'Save Entry'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Writing Prompt */}
      <Card className="bg-gradient-to-br from-lavender-light/50 to-warm-light/50 border-lavender/20">
        <CardContent className="pt-5">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-lavender mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-lavender">Writing Prompt</p>
              <p className="text-sm mt-1">{prompt}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 border-lavender/30 text-lavender hover:bg-lavender/10"
                onClick={() => applyPrompt(prompt)}
              >
                Use This Prompt
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entries List */}
      {entries.length === 0 ? (
        <Card className="bg-card/50">
          <CardContent className="pt-6 pb-6 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Your journal is empty. Start writing to capture your thoughts and reflections.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const tagList = entry.tags ? entry.tags.split(',').map(t => t.trim()).filter(Boolean) : []
            return (
              <Card key={entry.id} className="wellness-card cursor-pointer" onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}>
                <CardContent className="py-4 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm">{entry.title}</h4>
                      <p className={`text-xs text-muted-foreground mt-1 ${expandedEntry === entry.id ? '' : 'line-clamp-2'}`}>
                        {entry.content}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(entry.date).toLocaleDateString()}
                    </span>
                  </div>
                  {tagList.length > 0 && (
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {tagList.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className={`text-[10px] px-2 py-0 ${tagColors[tag.toLowerCase()] || 'bg-muted text-muted-foreground'}`}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
