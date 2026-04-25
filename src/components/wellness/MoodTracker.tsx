'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useState, useEffect, useCallback } from 'react'
import { SmilePlus, TrendingUp } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const moodOptions = [
  { value: 1, emoji: '😢', label: 'Very Low', color: 'bg-rose-light' },
  { value: 2, emoji: '😔', label: 'Low', color: 'bg-lavender-light' },
  { value: 3, emoji: '😐', label: 'Neutral', color: 'bg-warm-light' },
  { value: 4, emoji: '😊', label: 'Good', color: 'bg-sage-light' },
  { value: 5, emoji: '😄', label: 'Great', color: 'bg-wellness-light' },
]

interface MoodEntry {
  id: string
  mood: number
  emoji: string
  note: string | null
  date: string
}

export function MoodTracker() {
  const [selectedMood, setSelectedMood] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [entries, setEntries] = useState<MoodEntry[]>([])
  const [saving, setSaving] = useState(false)
  const [chartData, setChartData] = useState<{ date: string; mood: number }[]>([])

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/mood')
      if (res.ok) {
        const data = await res.json()
        setEntries(data)
        const last7 = data.slice(0, 7).reverse().map((e: MoodEntry) => ({
          date: new Date(e.date).toLocaleDateString('en', { weekday: 'short' }),
          mood: e.mood,
        }))
        setChartData(last7)
      }
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  const handleSave = async () => {
    if (!selectedMood) return
    setSaving(true)
    try {
      const moodOpt = moodOptions.find((m) => m.value === selectedMood)!
      const res = await fetch('/api/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood: selectedMood, emoji: moodOpt.emoji, note: note || null }),
      })
      if (res.ok) {
        setSelectedMood(null)
        setNote('')
        fetchEntries()
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false)
    }
  }

  const avgMood = entries.length > 0
    ? (entries.reduce((sum, e) => sum + e.mood, 0) / entries.length).toFixed(1)
    : '—'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <SmilePlus className="h-6 w-6 text-primary" /> Mood Tracker
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">How are you feeling right now?</p>
      </div>

      {/* Mood Selection */}
      <Card className="bg-card/80">
        <CardContent className="pt-6">
          <div className="flex justify-center gap-3 sm:gap-4 mb-6">
            {moodOptions.map((mood) => (
              <button
                key={mood.value}
                onClick={() => setSelectedMood(mood.value)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl wellness-transition ${
                  selectedMood === mood.value
                    ? 'bg-primary text-primary-foreground shadow-md scale-110'
                    : `${mood.color} hover:scale-105`
                }`}
              >
                <span className="text-2xl sm:text-3xl">{mood.emoji}</span>
                <span className="text-[10px] sm:text-xs font-medium">{mood.label}</span>
              </button>
            ))}
          </div>

          {selectedMood && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Textarea
                placeholder="What's on your mind? (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-[80px] resize-none bg-background/50 border-border/50"
              />
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {saving ? 'Saving...' : 'Log Mood'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mood Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Recent Mood Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.62 0.08 155)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="oklch(0.62 0.08 155)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: 'oklch(0.98 0.01 155)',
                      border: '1px solid oklch(0.92 0.02 155)',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="mood"
                    stroke="oklch(0.62 0.08 155)"
                    fill="url(#moodGradient)"
                    strokeWidth={2}
                    dot={{ fill: 'oklch(0.62 0.08 155)', strokeWidth: 0, r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-semibold text-primary">{entries.length}</p>
            <p className="text-xs text-muted-foreground">Entries Logged</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-semibold text-primary">{avgMood}</p>
            <p className="text-xs text-muted-foreground">Average Mood</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Entries */}
      {entries.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recent Entries</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {entries.slice(0, 10).map((entry) => (
              <Card key={entry.id} className="wellness-card">
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{entry.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{moodOptions.find(m => m.value === entry.mood)?.label}</p>
                      {entry.note && <p className="text-xs text-muted-foreground truncate">{entry.note}</p>}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(entry.date).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
