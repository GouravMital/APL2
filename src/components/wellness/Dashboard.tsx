'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useWellnessStore, type TabId } from '@/lib/store'
import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  SmilePlus,
  BookOpen,
  Wind,
  Droplets,
  Moon,
  MessageCircleHeart,
  TrendingUp,
  Sparkles,
  Settings2,
  Flower2,
  ListChecks,
  BarChart3,
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
  const [profileName, setProfileName] = useState('Friend')
  const [profileGoals, setProfileGoals] = useState('general well-being')
  const [editName, setEditName] = useState('')
  const [editGoals, setEditGoals] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }, [])

  const affirmation = useMemo(() => {
    return dailyAffirmations[Math.floor(Math.random() * dailyAffirmations.length)]
  }, [])

  const fetchStats = useCallback(async () => {
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
  }, [])

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/profile')
      if (res.ok) {
        const data = await res.json()
        setProfileName(data.name || 'Friend')
        setProfileGoals(data.wellnessGoals || 'general well-being')
      }
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    fetchStats()
    fetchProfile()
  }, [fetchStats, fetchProfile])

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, wellnessGoals: editGoals }),
      })
      setProfileName(editName)
      setProfileGoals(editGoals)
      setProfileOpen(false)
    } catch {
      // silently fail
    } finally {
      setSaving(false)
    }
  }

  const openProfileEdit = () => {
    setEditName(profileName)
    setEditGoals(profileGoals)
    setProfileOpen(true)
  }

  const quickActions = [
    { label: 'Log Mood', icon: SmilePlus, tab: 'mood' as TabId, desc: 'How are you feeling?' },
    { label: 'Breathe', icon: Wind, tab: 'breathe' as TabId, desc: 'Guided breathing' },
    { label: 'Journal', icon: BookOpen, tab: 'journal' as TabId, desc: 'Write your thoughts' },
    { label: 'AI Companion', icon: MessageCircleHeart, tab: 'companion' as TabId, desc: 'Agentic wellness AI' },
  ]

  const featureCards = [
    { label: 'Meditation', icon: Flower2, tab: 'meditate' as TabId, desc: '6 guided sessions' },
    { label: 'Sleep', icon: Moon, tab: 'sleep' as TabId, desc: 'Track & improve' },
    { label: 'Habits', icon: ListChecks, tab: 'habits' as TabId, desc: 'Build routines' },
    { label: 'Insights', icon: BarChart3, tab: 'insights' as TabId, desc: 'See your progress' },
  ]

  return (
    <div className="space-y-6">
      {/* Greeting with Profile Edit */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{greeting}, {profileName} 🌿</h2>
          <p className="text-muted-foreground mt-1 text-sm">{affirmation}</p>
        </div>
        <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={openProfileEdit}>
              <Settings2 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Your Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-sm font-medium block mb-1">Name</label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Your name" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Wellness Goals</label>
                <Input value={editGoals} onChange={(e) => setEditGoals(e.target.value)} placeholder="e.g., sleep better, reduce stress" />
              </div>
              <Button onClick={handleSaveProfile} disabled={saving} className="w-full bg-primary hover:bg-primary/90">
                {saving ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Goals Banner */}
      <Card className="bg-gradient-to-br from-wellness-light to-sage-light border-wellness/20">
        <CardContent className="pt-5">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="flex-1">
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

      {/* More Features */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Explore</h3>
        <div className="grid grid-cols-2 gap-3">
          {featureCards.map((card) => (
            <Card
              key={card.label}
              className="wellness-card cursor-pointer group"
              onClick={() => setActiveTab(card.tab)}
            >
              <CardContent className="pt-4 pb-4 px-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-accent group-hover:bg-accent/80 wellness-transition">
                    <card.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{card.label}</p>
                    <p className="text-xs text-muted-foreground">{card.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Wellness Goals */}
      <Card className="bg-lavender-light/50 border-lavender/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-lavender">Your Wellness Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground/80">{profileGoals}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 border-lavender/30 text-lavender hover:bg-lavender/10"
            onClick={openProfileEdit}
          >
            Update Goals
          </Button>
        </CardContent>
      </Card>

      {/* Breathing Tip */}
      <Card className="bg-warm-light/30 border-warm/20">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm text-foreground/80">
            💡 <strong>Quick tip:</strong> Try taking 3 deep breaths right now. Inhale for 4 counts, hold for 4, exhale for 6.
            Even a minute of conscious breathing can shift your nervous system into a calmer state.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 border-warm/30 text-warm hover:bg-warm/10"
            onClick={() => setActiveTab('breathe')}
          >
            Start Breathing Exercise
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
