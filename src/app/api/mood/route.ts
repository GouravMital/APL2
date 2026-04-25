import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const entries = await db.moodEntry.findMany({
      orderBy: { date: 'desc' },
      take: 30,
    })
    return NextResponse.json(entries)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch mood entries' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { mood, emoji, note } = body

    if (!mood || mood < 1 || mood > 5) {
      return NextResponse.json({ error: 'Invalid mood value' }, { status: 400 })
    }

    const entry = await db.moodEntry.create({
      data: {
        mood,
        emoji: emoji || '😊',
        note: note || null,
        date: new Date(),
      },
    })

    return NextResponse.json(entry, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create mood entry' }, { status: 500 })
  }
}
