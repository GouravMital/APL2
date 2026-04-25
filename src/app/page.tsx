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

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1">
        <WellnessNav />
        <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8 pb-32 md:pb-8 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            <ActiveComponent />
          </div>
        </main>
      </div>
    </div>
  )
}
