import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export async function GET() {
  try {
    const today = startOfDay(new Date())
    const todayLog = await db.hydrationLog.findFirst({
      where: { date: { gte: today } },
      orderBy: { date: 'desc' },
    })

    const allLogs = await db.hydrationLog.findMany({
      orderBy: { date: 'desc' },
      take: 30,
    })

    // Calculate streak
    let streak = 0
    const checkDate = new Date()
    for (let i = 0; i < 30; i++) {
      const dayStart = startOfDay(checkDate)
      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayEnd.getDate() + 1)

      const log = await db.hydrationLog.findFirst({
        where: { date: { gte: dayStart, lt: dayEnd } },
      })

      if (log && log.glasses >= log.goal) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }

    return NextResponse.json({
      today: todayLog,
      logs: allLogs,
      streak,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch hydration data' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { glasses, goal } = body

    if (typeof glasses !== 'number' || glasses < 0) {
      return NextResponse.json({ error: 'Invalid glasses value' }, { status: 400 })
    }

    const today = startOfDay(new Date())
    const existing = await db.hydrationLog.findFirst({
      where: { date: { gte: today } },
    })

    if (existing) {
      const updated = await db.hydrationLog.update({
        where: { id: existing.id },
        data: { glasses, goal: goal || existing.goal },
      })
      return NextResponse.json(updated)
    }

    const log = await db.hydrationLog.create({
      data: {
        glasses,
        goal: goal || 8,
        date: new Date(),
      },
    })

    return NextResponse.json(log, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to update hydration' }, { status: 500 })
  }
}
