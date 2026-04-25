import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const habits = await db.habit.findMany({
      include: {
        logs: {
          orderBy: { date: 'desc' },
          take: 14,
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(habits)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch habits' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, icon, color, frequency } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Habit name is required' }, { status: 400 })
    }

    const habit = await db.habit.create({
      data: {
        name: name.trim(),
        icon: icon || '✨',
        color: color || '#7C9A82',
        frequency: frequency || 'daily',
      },
    })

    return NextResponse.json(habit, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create habit' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { habitId, date } = body

    if (!habitId || !date) {
      return NextResponse.json({ error: 'habitId and date are required' }, { status: 400 })
    }

    const dateObj = new Date(date)
    const existing = await db.habitLog.findUnique({
      where: { habitId_date: { habitId, date: dateObj } },
    })

    if (existing) {
      const updated = await db.habitLog.update({
        where: { id: existing.id },
        data: { completed: !existing.completed },
      })
      return NextResponse.json(updated)
    }

    const log = await db.habitLog.create({
      data: {
        habitId,
        date: dateObj,
        completed: true,
      },
    })

    return NextResponse.json(log, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to toggle habit' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { habitId } = body

    if (!habitId) {
      return NextResponse.json({ error: 'habitId is required' }, { status: 400 })
    }

    await db.habitLog.deleteMany({ where: { habitId } })
    await db.habit.delete({ where: { id: habitId } })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete habit' }, { status: 500 })
  }
}
