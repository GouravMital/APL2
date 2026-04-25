'use client'

import { useWellnessStore, type TabId } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  Home,
  SmilePlus,
  BookOpen,
  Wind,
  Flower2,
  Moon,
  Droplets,
  ListChecks,
  BarChart3,
  MessageCircleHeart,
} from 'lucide-react'

const navItems: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'mood', label: 'Mood', icon: SmilePlus },
  { id: 'journal', label: 'Journal', icon: BookOpen },
  { id: 'breathe', label: 'Breathe', icon: Wind },
  { id: 'meditate', label: 'Meditate', icon: Flower2 },
  { id: 'sleep', label: 'Sleep', icon: Moon },
  { id: 'hydrate', label: 'Hydrate', icon: Droplets },
  { id: 'habits', label: 'Habits', icon: ListChecks },
  { id: 'insights', label: 'Insights', icon: BarChart3 },
  { id: 'companion', label: 'Companion', icon: MessageCircleHeart },
]

export function WellnessNav() {
  const { activeTab, setActiveTab } = useWellnessStore()

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden md:flex flex-col w-64 border-r border-border bg-card/50 backdrop-blur-sm h-full py-6 px-3">
        <div className="px-3 mb-8">
          <h1 className="text-xl font-semibold text-primary flex items-center gap-2">
            <span className="text-2xl">🌿</span> Serenity
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Your wellness companion</p>
        </div>
        <div className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium wellness-transition',
                activeTab === item.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>
        <div className="px-3 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">Take care of yourself 💚</p>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-t border-border safe-area-bottom">
        <div className="flex justify-around items-center py-2 px-1">
          {navItems.slice(0, 5).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg wellness-transition min-w-[48px]',
                activeTab === item.id
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
        {/* Second row for remaining items */}
        <div className="flex justify-around items-center py-2 px-1 border-t border-border/50">
          {navItems.slice(5).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg wellness-transition min-w-[48px]',
                activeTab === item.id
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  )
}
