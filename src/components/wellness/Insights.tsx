'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, SmilePlus, Droplets, Moon, ListChecks, BookOpen } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface InsightData {
  moodEntries: { id: string; mood: number; emoji: string; note: string | null; date: string }[]
  hydrationLogs: { id: string; glasses: number; goal: number; date: string }[]
  sleepLogs: { id: string; hours: number; quality: number; date: string }[]
  habitCount: number
  completedHabitsToday: number
  journalCount: number
  meditationCount: number
}

const PIE_COLORS = ['oklch(0.62 0.08 155)', 'oklch(0.72 0.08 300)', 'oklch(0.78 0.06 65)', 'oklch(0.72 0.1 15)', 'oklch(0.55 0.06 200)']

export function Insights() {
  const [data, setData] = useState<InsightData | null>(null)

  useEffect(() => {
    fetch('/api/insights')
      .then(res => res.ok ? res.json() : null)
      .then(setData)
      .catch(() => {})
  }, [])

  if (!data) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" /> Progress Insights
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">Your wellness journey at a glance</p>
        </div>
        <Card className="bg-card/50"><CardContent className="pt-8 pb-8 text-center">
          <p className="text-sm text-muted-foreground">Loading insights...</p>
        </CardContent></Card>
      </div>
    )
  }

  // Mood chart data
  const moodData = data.moodEntries.slice(0, 14).reverse().map((e) => ({
    date: new Date(e.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    mood: e.mood,
  }))

  // Sleep chart data
  const sleepData = data.sleepLogs.slice(0, 14).reverse().map((e) => ({
    date: new Date(e.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    hours: e.hours,
  }))

  // Hydration chart data
  const hydrationData = data.hydrationLogs.slice(0, 14).reverse().map((e) => ({
    date: new Date(e.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    glasses: e.glasses,
  }))

  // Activity distribution
  const activityData = [
    { name: 'Mood', value: data.moodEntries.length, icon: SmilePlus },
    { name: 'Journal', value: data.journalCount, icon: BookOpen },
    { name: 'Hydration', value: data.hydrationLogs.length, icon: Droplets },
    { name: 'Sleep', value: data.sleepLogs.length, icon: Moon },
    { name: 'Habits', value: data.habitCount, icon: ListChecks },
  ].filter(d => d.value > 0)

  const avgMood = data.moodEntries.length > 0
    ? (data.moodEntries.reduce((sum, e) => sum + e.mood, 0) / data.moodEntries.length).toFixed(1)
    : '—'
  const avgSleep = data.sleepLogs.length > 0
    ? (data.sleepLogs.reduce((sum, e) => sum + e.hours, 0) / data.sleepLogs.length).toFixed(1)
    : '—'
  const avgHydration = data.hydrationLogs.length > 0
    ? (data.hydrationLogs.reduce((sum, e) => sum + e.glasses, 0) / data.hydrationLogs.length).toFixed(1)
    : '—'

  const totalActivities = data.moodEntries.length + data.journalCount + data.hydrationLogs.length + data.sleepLogs.length + data.meditationCount

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" /> Progress Insights
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">Your wellness journey at a glance</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <SmilePlus className="h-4 w-4 text-lavender mx-auto mb-1" />
            <p className="text-2xl font-semibold text-primary">{avgMood}</p>
            <p className="text-xs text-muted-foreground">Avg Mood</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Moon className="h-4 w-4 text-wellness mx-auto mb-1" />
            <p className="text-2xl font-semibold text-primary">{avgSleep}h</p>
            <p className="text-xs text-muted-foreground">Avg Sleep</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Droplets className="h-4 w-4 text-sage mx-auto mb-1" />
            <p className="text-2xl font-semibold text-primary">{avgHydration}</p>
            <p className="text-xs text-muted-foreground">Avg Glasses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <TrendingUp className="h-4 w-4 text-warm mx-auto mb-1" />
            <p className="text-2xl font-semibold text-primary">{totalActivities}</p>
            <p className="text-xs text-muted-foreground">Total Activities</p>
          </CardContent>
        </Card>
      </div>

      {/* Mood Trend */}
      {moodData.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Mood Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={moodData}>
                  <defs>
                    <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.72 0.08 300)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="oklch(0.72 0.08 300)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: 'oklch(0.98 0.01 155)', border: '1px solid oklch(0.92 0.02 155)', borderRadius: '12px', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="mood" stroke="oklch(0.72 0.08 300)" fill="url(#moodGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sleep Trend */}
      {sleepData.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sleep Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sleepData}>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 14]} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: 'oklch(0.98 0.01 155)', border: '1px solid oklch(0.92 0.02 155)', borderRadius: '12px', fontSize: '12px' }} />
                  <Bar dataKey="hours" fill="oklch(0.62 0.08 155 / 0.5)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hydration Trend */}
      {hydrationData.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Hydration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hydrationData}>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 12]} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: 'oklch(0.98 0.01 155)', border: '1px solid oklch(0.92 0.02 155)', borderRadius: '12px', fontSize: '12px' }} />
                  <Bar dataKey="glasses" fill="oklch(0.75 0.05 155 / 0.5)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Distribution */}
      {activityData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Activity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {activityData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'oklch(0.98 0.01 155)', border: '1px solid oklch(0.92 0.02 155)', borderRadius: '12px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {activityData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-muted-foreground">{d.name}: {d.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Reflection */}
      <Card className="bg-gradient-to-br from-lavender-light/30 to-rose-light/30 border-lavender/20">
        <CardContent className="pt-5 pb-5">
          <p className="text-sm font-medium text-lavender mb-1">Weekly Reflection</p>
          <p className="text-sm text-foreground/80">
            {totalActivities > 20
              ? "You've been very consistent this week! Your dedication to wellness is inspiring. Keep going! 🌟"
              : totalActivities > 10
              ? "Good progress this week! You're building momentum. Try to add one more small habit next week. 🌱"
              : totalActivities > 0
              ? "You've started your wellness journey! Every step counts. Focus on consistency over perfection. 🌿"
              : "This is your fresh start! Begin with one small action today — even logging your mood makes a difference. 🍃"}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
