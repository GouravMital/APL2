'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useWellnessStore, type TabId } from '@/lib/store'
import { useEffect, useState, useMemo } from 'react'
import {
  SmilePlus,
  BookOpen,
  Wind,
  Droplets,
  Moon,
  ListChecks,
  MessageCircleHeart,
  TrendingUp,
  Sparkles,
} from 'lucide-react'

interface QuickStat {
  label: string
  value: string
  icon: React.ElementType
  tab: TabId
  color: string
}

const quickStats: QuickStat[] = [
  { label: 'Mood', value: '—', icon: SmilePlus, tab: 'mood', color: 'text-lavender' },
  { label: 'Journal', value: '—', icon: BookOpen, tab: 'journal', color: 'text-warm' },
  { label: 'Hydration', value: '0/8', icon: Droplets, tab: 'hydrate', color: 'text-sage' },
  { label: 'Sleep', value: '—', icon: Moon, tab: 'sleep', color: 'text-wellness' },
]

const dailyAffirmations = [
  "You are worthy of care and kindness. 🌱",
  "Every breath is a new beginning. 🍃",
  "Your feelings are valid, always. 💚",
  "Progress, not perfection. 🌿",
  "You deserve rest and restoration. 🌙",
  "Small steps lead to big changes. 🦋",
  "Be gentle with yourself today. 🌸",
  "You are enough, just as you are. ✨",
  "Healing happens one moment at a time. 🌊",
  "Your well-being matters. 🌻",
]

export function Dashboard() {
  const { setActiveTab } = useWellnessStore()
  const [stats, setStats] = useState<Record<string, string>>({
    mood: '—',
    journal: '—',
    hydration: '0/8',
    sleep: '—',
  })

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }, [])

  const affirmation = useMemo(() => {
    return dailyAffirmations[Math.floor(Math.random() * dailyAffirmations.length)]
  }, [])

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/insights')
        if (res.ok) {
          const data = await res.json()
          setStats({
            mood: data.todayMood ? data.todayMood.emoji : '—',
            journal: data.todayJournal ? '✓' : '—',
            hydration: `${data.todayHydration || 0}/8`,
            sleep: data.todaySleep ? `${data.todaySleep.hours}h` : '—',
          })
        }
      } catch {
        // silently fail
      }
    }
    fetchStats()
  }, [])

  const quickActions = [
    { label: 'Log Mood', icon: SmilePlus, tab: 'mood' as TabId, desc: 'How are you feeling?' },
    { label: 'Breathe', icon: Wind, tab: 'breathe' as TabId, desc: 'Guided breathing' },
    { label: 'Journal', icon: BookOpen, tab: 'journal' as TabId, desc: 'Write your thoughts' },
    { label: 'Chat', icon: MessageCircleHeart, tab: 'companion' as TabId, desc: 'AI wellness companion' },
  ]

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-semibold">{greeting} 🌿</h2>
        <p className="text-muted-foreground mt-1 text-sm">{affirmation}</p>
      </div>

      {/* Affirmation Card */}
      <Card className="bg-gradient-to-br from-wellness-light to-sage-light border-wellness/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-primary">Daily Affirmation</p>
              <p className="text-lg font-medium mt-1">{affirmation}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {quickStats.map((stat) => (
          <Card
            key={stat.label}
            className="wellness-card cursor-pointer"
            onClick={() => setActiveTab(stat.tab)}
          >
            <CardContent className="pt-4 pb-4 px-4">
              <div className="flex items-center justify-between">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <TrendingUp className="h-3 w-3 text-muted-foreground" />
              </div>
              <p className="text-2xl font-semibold mt-2">{stats[stat.label.toLowerCase()] || stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <Card
              key={action.label}
              className="wellness-card cursor-pointer group"
              onClick={() => setActiveTab(action.tab)}
            >
              <CardContent className="pt-4 pb-4 px-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 group-hover:bg-primary/20 wellness-transition">
                    <action.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{action.label}</p>
                    <p className="text-xs text-muted-foreground">{action.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Wellness Tips */}
      <Card className="bg-lavender-light/50 border-lavender/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-lavender">Wellness Tip</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground/80">
            Try taking 3 deep breaths right now. Inhale for 4 counts, hold for 4, exhale for 6. 
            Even a minute of conscious breathing can shift your nervous system into a calmer state.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 border-lavender/30 text-lavender hover:bg-lavender/10"
            onClick={() => setActiveTab('breathe')}
          >
            Start Breathing Exercise
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
