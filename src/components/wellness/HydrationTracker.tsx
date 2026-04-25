'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useState, useEffect, useCallback } from 'react'
import { Droplets, Plus, Minus } from 'lucide-react'

export function HydrationTracker() {
  const [glasses, setGlasses] = useState(0)
  const [goal, setGoal] = useState(8)
  const [todayLog, setTodayLog] = useState<{ id: string; glasses: number; goal: number } | null>(null)
  const [streak, setStreak] = useState(0)

  const fetchToday = useCallback(async () => {
    try {
      const res = await fetch('/api/hydration')
      if (res.ok) {
        const data = await res.json()
        if (data.today) {
          setTodayLog(data.today)
          setGlasses(data.today.glasses)
          setGoal(data.today.goal)
        }
        if (data.streak !== undefined) setStreak(data.streak)
      }
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    fetchToday()
  }, [fetchToday])

  const handleUpdate = async (newGlasses: number) => {
    const clamped = Math.max(0, Math.min(newGlasses, 20))
    setGlasses(clamped)
    try {
      await fetch('/api/hydration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ glasses: clamped, goal }),
      })
      fetchToday()
    } catch {
      // silently fail
    }
  }

  const progressPct = Math.min((glasses / goal) * 100, 100)
  const isGoalMet = glasses >= goal

  const waterFacts = [
    'Water helps carry nutrients and oxygen to your cells.',
    'Staying hydrated can improve your mood and energy levels.',
    'Drinking water helps maintain the balance of body fluids.',
    'Hydration supports healthy brain function and focus.',
    'Water helps regulate your body temperature.',
  ]
  const [factIndex] = useState(Math.floor(Math.random() * waterFacts.length))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Droplets className="h-6 w-6 text-primary" /> Hydration
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">Stay hydrated, stay healthy</p>
      </div>

      {/* Main Tracker */}
      <Card className={`wellness-transition ${isGoalMet ? 'bg-gradient-to-br from-wellness-light/50 to-sage-light/50 border-wellness/30' : 'bg-card/50'}`}>
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col items-center">
            {/* Water glass visualization */}
            <div className="relative w-40 h-48 mb-6">
              <div className="absolute inset-0 rounded-2xl border-2 border-primary/30 overflow-hidden">
                <div
                  className="absolute bottom-0 left-0 right-0 wellness-transition duration-500 ease-out"
                  style={{
                    height: `${progressPct}%`,
                    background: 'linear-gradient(to top, oklch(0.62 0.08 155 / 0.4), oklch(0.62 0.08 155 / 0.15))',
                  }}
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Droplets className={`h-8 w-8 mx-auto mb-1 ${isGoalMet ? 'text-primary animate-pulse-soft' : 'text-primary/40'}`} />
                  <p className="text-3xl font-bold text-primary">{glasses}</p>
                  <p className="text-xs text-muted-foreground">of {goal} glasses</p>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-xs mb-4">
              <Progress value={progressPct} className="h-3" />
            </div>

            {isGoalMet && (
              <p className="text-sm font-medium text-primary mb-3 animate-in fade-in">
                🎉 Goal reached! Great job staying hydrated!
              </p>
            )}

            {/* Controls */}
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleUpdate(glasses - 1)}
                disabled={glasses <= 0}
                className="h-12 w-12 rounded-full"
              >
                <Minus className="h-5 w-5" />
              </Button>
              <Button
                onClick={() => handleUpdate(glasses + 1)}
                className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90"
              >
                <Plus className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-semibold text-primary">{Math.round(progressPct)}%</p>
            <p className="text-xs text-muted-foreground">Daily Goal</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-semibold text-primary">{streak}</p>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </CardContent>
        </Card>
      </div>

      {/* Water Fact */}
      <Card className="bg-sage-light/30 border-sage/20">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-2">
            <Droplets className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-foreground/80">{waterFacts[factIndex]}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
