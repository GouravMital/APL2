import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const sessions = await db.meditationSession.findMany({
      orderBy: { date: 'desc' },
      take: 30,
    })
    return NextResponse.json(sessions)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch meditation sessions' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { duration, type, note } = body

    if (typeof duration !== 'number' || duration < 1) {
      return NextResponse.json({ error: 'Invalid duration' }, { status: 400 })
    }

    const session = await db.meditationSession.create({
      data: {
        duration,
        type: type || 'mindfulness',
        note: note || null,
        date: new Date(),
      },
    })

    return NextResponse.json(session, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create meditation session' }, { status: 500 })
  }
}
