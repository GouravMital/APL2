'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { useState, useEffect, useCallback } from 'react'
import { Moon, Star, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface SleepLog {
  id: string
  hours: number
  quality: number
  bedtime: string | null
  wakeTime: string | null
  note: string | null
  date: string
}

export function SleepTracker() {
  const [hours, setHours] = useState([7])
  const [quality, setQuality] = useState([3])
  const [bedtime, setBedtime] = useState('22:30')
  const [wakeTime, setWakeTime] = useState('06:30')
  const [note, setNote] = useState('')
  const [entries, setEntries] = useState<SleepLog[]>([])
  const [saving, setSaving] = useState(false)

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/sleep')
      if (res.ok) setEntries(await res.json())
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/sleep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hours: hours[0],
          quality: quality[0],
          bedtime,
          wakeTime,
          note: note || null,
        }),
      })
      if (res.ok) {
        setNote('')
        fetchEntries()
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false)
    }
  }

  const qualityLabels = ['Poor', 'Fair', 'Average', 'Good', 'Excellent']
  const qualityEmojis = ['😫', '😔', '😐', '😊', '😴']

  const avgHours = entries.length > 0
    ? (entries.reduce((sum, e) => sum + e.hours, 0) / entries.length).toFixed(1)
    : '—'
  const avgQuality = entries.length > 0
    ? (entries.reduce((sum, e) => sum + e.quality, 0) / entries.length).toFixed(1)
    : '—'

  const chartData = entries.slice(0, 7).reverse().map((e) => ({
    date: new Date(e.date).toLocaleDateString('en', { weekday: 'short' }),
    hours: e.hours,
  }))

  const sleepTips = [
    'Keep a consistent sleep schedule, even on weekends.',
    'Avoid screens 30 minutes before bedtime.',
    'Keep your bedroom cool, dark, and quiet.',
    'Limit caffeine after 2 PM.',
    'Try a relaxing wind-down routine each night.',
    'Use your bed only for sleep and intimacy.',
  ]
  const [tipIndex] = useState(Math.floor(Math.random() * sleepTips.length))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Moon className="h-6 w-6 text-primary" /> Sleep Support
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">Rest well, live well</p>
      </div>

      {/* Log Sleep */}
      <Card className="bg-card/50">
        <CardContent className="pt-6 space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Hours Slept</label>
              <span className="text-lg font-semibold text-primary">{hours[0]}h</span>
            </div>
            <Slider value={hours} onValueChange={setHours} min={0} max={14} step={0.5} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Sleep Quality</label>
              <span className="text-lg">{qualityEmojis[quality[0] - 1]} {qualityLabels[quality[0] - 1]}</span>
            </div>
            <Slider value={quality} onValueChange={setQuality} min={1} max={5} step={1} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1">Bedtime</label>
              <input
                type="time"
                value={bedtime}
                onChange={(e) => setBedtime(e.target.value)}
                className="w-full rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Wake Time</label>
              <input
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="w-full rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <Textarea
            placeholder="How did you sleep? (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-[60px] resize-none bg-background/50"
          />

          <Button onClick={handleSave} disabled={saving} className="w-full bg-primary hover:bg-primary/90">
            {saving ? 'Saving...' : 'Log Sleep'}
          </Button>
        </CardContent>
      </Card>

      {/* Sleep Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Sleep Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 14]} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: 'oklch(0.98 0.01 155)',
                      border: '1px solid oklch(0.92 0.02 155)',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="hours" fill="oklch(0.62 0.08 155 / 0.6)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-semibold text-primary">{avgHours}</p>
            <p className="text-xs text-muted-foreground">Avg Hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-semibold text-primary">{avgQuality}/5</p>
            <p className="text-xs text-muted-foreground">Avg Quality</p>
          </CardContent>
        </Card>
      </div>

      {/* Sleep Tip */}
      <Card className="bg-wellness-light/30 border-wellness/20">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-2">
            <Star className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-foreground/80">{sleepTips[tipIndex]}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
