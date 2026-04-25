'use client'

import { useWellnessStore } from '@/lib/store'
import { WellnessNav } from '@/components/wellness/WellnessNav'
import { Dashboard } from '@/components/wellness/Dashboard'
import { MoodTracker } from '@/components/wellness/MoodTracker'
import { Journal } from '@/components/wellness/Journal'
import { BreathingExercise } from '@/components/wellness/BreathingExercise'
import { Meditation } from '@/components/wellness/Meditation'
import { SleepTracker } from '@/components/wellness/SleepTracker'
import { HydrationTracker } from '@/components/wellness/HydrationTracker'
import { HabitTracker } from '@/components/wellness/HabitTracker'
import { Insights } from '@/components/wellness/Insights'
import { AICompanion } from '@/components/wellness/AICompanion'
import { useEffect } from 'react'
import { useSyncExternalStore } from 'react'

const emptySubscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

const tabComponents: Record<string, React.ComponentType> = {
  home: Dashboard,
  mood: MoodTracker,
  journal: Journal,
  breathe: BreathingExercise,
  meditate: Meditation,
  sleep: SleepTracker,
  hydrate: HydrationTracker,
  habits: HabitTracker,
  insights: Insights,
  companion: AICompanion,
}

export default function Home() {
  const { activeTab } = useWellnessStore()
  const ActiveComponent = tabComponents[activeTab] || Dashboard
  const mounted = useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot)

  useEffect(() => {
    fetch('/api/profile').catch(() => {})
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 animate-pulse-soft">
            <span className="text-2xl">🌿</span>
          </div>
          <p className="text-sm text-muted-foreground">Loading Serenity...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1">
        <WellnessNav />
        <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8 pb-40 md:pb-8 overflow-y-auto max-h-screen">
          <div className="max-w-3xl mx-auto">
            <ActiveComponent key={activeTab} />
          </div>
        </main>
      </div>
    </div>
  )
}
