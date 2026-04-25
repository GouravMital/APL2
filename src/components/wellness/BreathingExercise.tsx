'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Wind, Play, Pause, RotateCcw } from 'lucide-react'

type BreathPhase = 'idle' | 'inhale' | 'hold' | 'exhale' | 'complete'

interface BreathingPattern {
  name: string
  inhale: number
  hold: number
  exhale: number
  holdAfterExhale: number
  description: string
}

const patterns: BreathingPattern[] = [
  { name: '4-7-8 Relaxing', inhale: 4, hold: 7, exhale: 8, holdAfterExhale: 0, description: 'Calms the nervous system, ideal for sleep' },
  { name: 'Box Breathing', inhale: 4, hold: 4, exhale: 4, holdAfterExhale: 4, description: 'Balances and focuses the mind' },
  { name: 'Calm Breath', inhale: 4, hold: 2, exhale: 6, holdAfterExhale: 0, description: 'Simple and soothing for any moment' },
  { name: 'Energizing', inhale: 6, hold: 0, exhale: 2, holdAfterExhale: 0, description: 'Quick energy boost' },
]

const phaseLabels: Record<BreathPhase, string> = {
  idle: 'Press play to begin',
  inhale: 'Breathe In',
  hold: 'Hold',
  exhale: 'Breathe Out',
  complete: 'Session Complete',
}

const phaseColors: Record<BreathPhase, string> = {
  idle: 'text-muted-foreground',
  inhale: 'text-primary',
  hold: 'text-lavender',
  exhale: 'text-sage',
  complete: 'text-warm',
}

export function BreathingExercise() {
  const [selectedPattern, setSelectedPattern] = useState(0)
  const [phase, setPhase] = useState<BreathPhase>('idle')
  const [timer, setTimer] = useState(0)
  const [cycleCount, setCycleCount] = useState(0)
  const [totalCycles, setTotalCycles] = useState(4)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const phaseRef = useRef<BreathPhase>('idle')
  const timerRef = useRef(0)

  const pattern = patterns[selectedPattern]

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const nextPhase = useCallback((currentPhase: BreathPhase): BreathPhase => {
    switch (currentPhase) {
      case 'inhale': return pattern.hold > 0 ? 'hold' : 'exhale'
      case 'hold': return 'exhale'
      case 'exhale': return pattern.holdAfterExhale > 0 ? 'hold' : 'inhale'
      default: return 'inhale'
    }
  }, [pattern])

  const getPhaseDuration = useCallback((p: BreathPhase): number => {
    switch (p) {
      case 'inhale': return pattern.inhale
      case 'hold': return phaseRef.current === 'inhale' ? pattern.hold : pattern.holdAfterExhale
      case 'exhale': return pattern.exhale
      default: return 0
    }
  }, [pattern])

  useEffect(() => {
    if (!isRunning) return

    phaseRef.current = phase
    timerRef.current = timer

    if (phase === 'complete' || phase === 'idle') return

    intervalRef.current = setInterval(() => {
      timerRef.current -= 1
      if (timerRef.current <= 0) {
        const next = nextPhase(phaseRef.current)
        if (next === 'inhale' && phaseRef.current === 'exhale') {
          setCycleCount((prev) => {
            const newCount = prev + 1
            if (newCount >= totalCycles) {
              setPhase('complete')
              setIsRunning(false)
              clearTimer()
              return newCount
            }
            return newCount
          })
          if (cycleCount + 1 >= totalCycles) return
        }
        phaseRef.current = next
        setPhase(next)
        timerRef.current = getPhaseDuration(next)
        setTimer(timerRef.current)
      } else {
        setTimer(timerRef.current)
      }
    }, 1000)

    return () => clearTimer()
  }, [isRunning, phase, cycleCount, totalCycles, nextPhase, getPhaseDuration, clearTimer])

  const handleStart = () => {
    clearTimer()
    setPhase('inhale')
    phaseRef.current = 'inhale'
    const dur = pattern.inhale
    timerRef.current = dur
    setTimer(dur)
    setCycleCount(0)
    setIsRunning(true)
  }

  const handlePause = () => {
    setIsRunning(false)
    clearTimer()
  }

  const handleReset = () => {
    setIsRunning(false)
    clearTimer()
    setPhase('idle')
    setTimer(0)
    setCycleCount(0)
  }

  const circleScale = phase === 'inhale' ? 'scale-125' : phase === 'exhale' ? 'scale-75' : phase === 'hold' ? 'scale-110' : 'scale-100'
  const circleOpacity = phase === 'idle' ? 'opacity-30' : phase === 'complete' ? 'opacity-50' : 'opacity-70'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Wind className="h-6 w-6 text-primary" /> Guided Breathing
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">Find your calm through conscious breathing</p>
      </div>

      {/* Pattern Selection */}
      <div className="grid grid-cols-2 gap-2">
        {patterns.map((p, i) => (
          <button
            key={p.name}
            onClick={() => { if (!isRunning) { handleReset(); setSelectedPattern(i) } }}
            className={`p-3 rounded-xl text-left wellness-transition ${
              selectedPattern === i
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card hover:bg-accent border border-border/50'
            }`}
          >
            <p className="text-sm font-medium">{p.name}</p>
            <p className={`text-xs mt-0.5 ${selectedPattern === i ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
              {p.inhale}-{p.hold}-{p.exhale}
            </p>
          </button>
        ))}
      </div>

      {/* Breathing Circle */}
      <Card className="bg-card/50">
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col items-center">
            {/* Animated circle */}
            <div className="relative flex items-center justify-center mb-8">
              {/* Ripple rings */}
              {isRunning && phase === 'inhale' && (
                <>
                  <div className="absolute w-48 h-48 rounded-full border-2 border-primary/20 animate-ripple" />
                  <div className="absolute w-48 h-48 rounded-full border-2 border-primary/10 animate-ripple" style={{ animationDelay: '1s' }} />
                </>
              )}
              <div
                className={`w-48 h-48 rounded-full ${circleOpacity} ${circleScale} wellness-transition duration-[4000ms] ease-in-out`}
                style={{
                  background: `radial-gradient(circle, oklch(0.62 0.08 155 / 0.3) 0%, oklch(0.62 0.08 155 / 0.05) 70%, transparent 100%)`,
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  {phase !== 'idle' && phase !== 'complete' && (
                    <p className="text-4xl font-bold text-primary">{timer}</p>
                  )}
                  <p className={`text-sm font-medium mt-1 ${phaseColors[phase]}`}>
                    {phaseLabels[phase]}
                  </p>
                </div>
              </div>
            </div>

            {/* Cycle counter */}
            <p className="text-sm text-muted-foreground mb-4">
              Cycle {Math.min(cycleCount + 1, totalCycles)} of {totalCycles}
            </p>

            {/* Controls */}
            <div className="flex gap-3">
              {!isRunning && phase !== 'complete' ? (
                <Button onClick={handleStart} className="bg-primary hover:bg-primary/90 gap-2">
                  <Play className="h-4 w-4" /> Start
                </Button>
              ) : isRunning ? (
                <Button onClick={handlePause} variant="outline" className="gap-2">
                  <Pause className="h-4 w-4" /> Pause
                </Button>
              ) : null}
              {(phase !== 'idle' || isRunning) && (
                <Button onClick={handleReset} variant="outline" className="gap-2">
                  <RotateCcw className="h-4 w-4" /> Reset
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pattern Info */}
      <Card className="bg-wellness-light/30 border-wellness/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-primary">About This Pattern</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground/80">{pattern.description}</p>
          <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
            <span>Inhale: {pattern.inhale}s</span>
            {pattern.hold > 0 && <span>Hold: {pattern.hold}s</span>}
            <span>Exhale: {pattern.exhale}s</span>
            {pattern.holdAfterExhale > 0 && <span>Hold: {pattern.holdAfterExhale}s</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
