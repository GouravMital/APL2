'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Flower2, Play, Pause, RotateCcw, Clock } from 'lucide-react'

interface MeditationType {
  name: string
  emoji: string
  duration: number
  description: string
  color: string
}

const meditationTypes: MeditationType[] = [
  { name: 'Mindfulness', emoji: '🧘', duration: 5, description: 'Focus on the present moment', color: 'bg-wellness-light' },
  { name: 'Body Scan', emoji: '🫧', duration: 10, description: 'Relax each part of your body', color: 'bg-lavender-light' },
  { name: 'Loving-Kindness', emoji: '💗', duration: 7, description: 'Cultivate compassion and warmth', color: 'bg-rose-light' },
  { name: 'Gratitude', emoji: '🙏', duration: 5, description: 'Reflect on what you appreciate', color: 'bg-warm-light' },
  { name: 'Walking', emoji: '🚶', duration: 10, description: 'Mindful movement meditation', color: 'bg-sage-light' },
  { name: 'Sleep', emoji: '🌙', duration: 15, description: 'Gentle meditation for rest', color: 'bg-wellness-light' },
]

export function Meditation() {
  const [selectedType, setSelectedType] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const [completedSessions, setCompletedSessions] = useState<number>(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    fetch('/api/meditation')
      .then(res => res.ok ? res.json() : [])
      .then(data => setCompletedSessions(data.length))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!isPlaying || timeLeft <= 0) return

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimer()
          setIsPlaying(false)
          // Save session
          if (selectedType !== null) {
            fetch('/api/meditation', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                duration: meditationTypes[selectedType].duration,
                type: meditationTypes[selectedType].name.toLowerCase(),
                note: null,
              }),
            }).then(() => {
              setCompletedSessions((prev) => prev + 1)
            }).catch(() => {})
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearTimer()
  }, [isPlaying, timeLeft, selectedType, clearTimer])

  const handleStart = (typeIndex: number) => {
    const type = meditationTypes[typeIndex]
    setSelectedType(typeIndex)
    setTimeLeft(type.duration * 60)
    setTotalTime(type.duration * 60)
    setIsPlaying(true)
  }

  const handlePause = () => {
    setIsPlaying(false)
    clearTimer()
  }

  const handleResume = () => {
    setIsPlaying(true)
  }

  const handleReset = () => {
    setIsPlaying(false)
    clearTimer()
    setTimeLeft(0)
    setTotalTime(0)
    setSelectedType(null)
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0

  const meditationGuidance: Record<string, string> = {
    'mindfulness': 'Notice your thoughts without judgment. Let them pass like clouds in the sky...',
    'body scan': 'Starting from your toes... feel each part of your body relaxing... releasing tension...',
    'loving-kindness': 'May you be happy. May you be healthy. May you be safe. May you live with ease...',
    'gratitude': 'Think of someone who has made your life better. Feel the warmth of appreciation...',
    'walking': 'Feel the ground beneath your feet. Each step is intentional. Each breath is present...',
    'sleep': 'Let go of the day. Your body is heavy, relaxed. Drift into peaceful rest...',
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Flower2 className="h-6 w-6 text-primary" /> Meditation
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">Find stillness within</p>
      </div>

      {/* Active Session */}
      {selectedType !== null && (
        <Card className="bg-gradient-to-br from-wellness-light/30 to-lavender-light/30 border-wellness/20">
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center">
              <span className="text-5xl mb-4">{meditationTypes[selectedType].emoji}</span>
              <h3 className="text-lg font-semibold">{meditationTypes[selectedType].name} Meditation</h3>
              <p className="text-3xl font-bold text-primary mt-3 font-mono">
                {formatTime(timeLeft)}
              </p>
              <div className="w-full max-w-xs mt-4">
                <Progress value={progress} className="h-2" />
              </div>
              <p className="text-sm text-muted-foreground mt-4 text-center max-w-xs italic">
                {meditationGuidance[meditationTypes[selectedType].name.toLowerCase()] || ''}
              </p>
              <div className="flex gap-3 mt-6">
                {isPlaying ? (
                  <Button onClick={handlePause} variant="outline" className="gap-2">
                    <Pause className="h-4 w-4" /> Pause
                  </Button>
                ) : timeLeft > 0 ? (
                  <Button onClick={handleResume} className="bg-primary hover:bg-primary/90 gap-2">
                    <Play className="h-4 w-4" /> Resume
                  </Button>
                ) : null}
                <Button onClick={handleReset} variant="outline" className="gap-2">
                  <RotateCcw className="h-4 w-4" /> End
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Meditation Types */}
      {selectedType === null && (
        <div className="grid grid-cols-2 gap-3">
          {meditationTypes.map((type, i) => (
            <Card
              key={type.name}
              className="wellness-card cursor-pointer"
              onClick={() => handleStart(i)}
            >
              <CardContent className="pt-4 pb-4 px-4">
                <div className="text-center">
                  <span className="text-3xl">{type.emoji}</span>
                  <p className="text-sm font-medium mt-2">{type.name}</p>
                  <div className="flex items-center justify-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> {type.duration} min
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{type.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Session Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-semibold text-primary">{completedSessions}</p>
            <p className="text-xs text-muted-foreground">Sessions Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-semibold text-primary">{completedSessions * 7}</p>
            <p className="text-xs text-muted-foreground">Minutes Meditated</p>
          </CardContent>
        </Card>
      </div>

      {/* Tip */}
      <Card className="bg-lavender-light/30 border-lavender/20">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm text-foreground/80">
            💡 <strong>Tip:</strong> Start with just 5 minutes. Consistency matters more than duration. 
            Try to meditate at the same time each day to build a habit.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
