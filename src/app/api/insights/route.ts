import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Today's mood
    const todayMood = await db.moodEntry.findFirst({
      where: { date: { gte: today } },
      orderBy: { date: 'desc' },
    })

    // Today's journal
    const todayJournal = await db.journalEntry.findFirst({
      where: { date: { gte: today } },
    })

    // Today's hydration
    const todayHydrationLog = await db.hydrationLog.findFirst({
      where: { date: { gte: today } },
    })

    // Today's sleep
    const todaySleep = await db.sleepLog.findFirst({
      where: { date: { gte: today } },
      orderBy: { date: 'desc' },
    })

    // Recent data for charts
    const moodEntries = await db.moodEntry.findMany({
      orderBy: { date: 'desc' },
      take: 14,
    })

    const hydrationLogs = await db.hydrationLog.findMany({
      orderBy: { date: 'desc' },
      take: 14,
    })

    const sleepLogs = await db.sleepLog.findMany({
      orderBy: { date: 'desc' },
      take: 14,
    })

    // Habit stats
    const habits = await db.habit.findMany()
    const todayHabitLogs = await db.habitLog.findMany({
      where: { date: { gte: today }, completed: true },
    })

    // Journal count
    const journalCount = await db.journalEntry.count()

    // Meditation count
    const meditationCount = await db.meditationSession.count()

    return NextResponse.json({
      todayMood,
      todayJournal,
      todayHydration: todayHydrationLog?.glasses || 0,
      todaySleep,
      moodEntries,
      hydrationLogs,
      sleepLogs,
      habitCount: habits.length,
      completedHabitsToday: todayHabitLogs.length,
      journalCount,
      meditationCount,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 })
  }
}
