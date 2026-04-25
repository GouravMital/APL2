'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { useState, useEffect, useCallback } from 'react'
import { ListChecks, Plus, Check, X } from 'lucide-react'

interface Habit {
  id: string
  name: string
  icon: string
  color: string
  frequency: string
  logs: { id: string; completed: boolean; date: string }[]
}

const habitIcons = ['✨', '🏃', '📚', '🧘', '💧', '🥗', '😴', '🎯', '💪', '🎨', '🌱', '🙏']
const habitColors = ['#7C9A82', '#9B8EC4', '#D4A574', '#C97B84', '#8BA7B6', '#A3B18A', '#B5838D', '#6D9DC5']

export function HabitTracker() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState('✨')
  const [newColor, setNewColor] = useState('#7C9A82')
  const [saving, setSaving] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const fetchHabits = useCallback(async () => {
    try {
      const res = await fetch('/api/habits')
      if (res.ok) {
        const data = await res.json()
        setHabits(data)
      }
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    fetchHabits()
  }, [fetchHabits])

  const handleAddHabit = async () => {
    if (!newName.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, icon: newIcon, color: newColor, frequency: 'daily' }),
      })
      if (res.ok) {
        setNewName('')
        setNewIcon('✨')
        setNewColor('#7C9A82')
        setIsOpen(false)
        fetchHabits()
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false)
    }
  }

  const toggleHabit = async (habitId: string) => {
    try {
      await fetch('/api/habits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitId, date: today }),
      })
      fetchHabits()
    } catch {
      // silently fail
    }
  }

  const deleteHabit = async (habitId: string) => {
    try {
      await fetch('/api/habits', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitId }),
      })
      fetchHabits()
    } catch {
      // silently fail
    }
  }

  const isCompletedToday = (habit: Habit) => {
    return habit.logs?.some((log) => log.date.split('T')[0] === today && log.completed)
  }

  const completedCount = habits.filter(isCompletedToday).length
  const totalHabits = habits.length
  const progressPct = totalHabits > 0 ? (completedCount / totalHabits) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <ListChecks className="h-6 w-6 text-primary" /> Habits
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">Build healthy routines</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 gap-2">
              <Plus className="h-4 w-4" /> Add Habit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Habit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <Input
                placeholder="Habit name (e.g., Morning Walk)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <div>
                <label className="text-sm font-medium block mb-2">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {habitIcons.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setNewIcon(icon)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg wellness-transition ${
                        newIcon === icon ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted hover:bg-accent'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Color</label>
                <div className="flex flex-wrap gap-2">
                  {habitColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewColor(color)}
                      className={`w-8 h-8 rounded-full wellness-transition ${
                        newColor === color ? 'ring-2 ring-offset-2 ring-primary' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <Button
                onClick={handleAddHabit}
                disabled={saving || !newName.trim()}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {saving ? 'Creating...' : 'Create Habit'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Today's Progress */}
      {totalHabits > 0 && (
        <Card className="bg-wellness-light/30 border-wellness/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Today&apos;s Progress</span>
              <span className="text-sm text-primary font-semibold">{completedCount}/{totalHabits}</span>
            </div>
            <Progress value={progressPct} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Habit List */}
      {habits.length === 0 ? (
        <Card className="bg-card/50">
          <CardContent className="pt-6 pb-6 text-center">
            <ListChecks className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No habits yet. Start building healthy routines by adding your first habit.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {habits.map((habit) => {
            const completed = isCompletedToday(habit)
            return (
              <Card key={habit.id} className={`wellness-card ${completed ? 'bg-wellness-light/20' : 'bg-card/50'}`}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleHabit(habit.id)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 wellness-transition ${
                        completed
                          ? 'text-white shadow-sm'
                          : 'bg-muted border border-border/50'
                      }`}
                      style={completed ? { backgroundColor: habit.color } : undefined}
                    >
                      {completed ? <Check className="h-4 w-4" /> : <span className="text-lg">{habit.icon}</span>}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${completed ? 'line-through text-muted-foreground' : ''}`}>
                        {habit.name}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteHabit(habit.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 wellness-transition"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Tip */}
      <Card className="bg-warm-light/30 border-warm/20">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm text-foreground/80">
            💡 <strong>Tip:</strong> Start with just 2-3 habits. Once they become automatic, add more. 
            Consistency beats intensity every time.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
