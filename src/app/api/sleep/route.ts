import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const logs = await db.sleepLog.findMany({
      orderBy: { date: 'desc' },
      take: 30,
    })
    return NextResponse.json(logs)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch sleep logs' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { hours, quality, bedtime, wakeTime, note } = body

    if (typeof hours !== 'number' || hours < 0 || hours > 24) {
      return NextResponse.json({ error: 'Invalid hours value' }, { status: 400 })
    }

    const log = await db.sleepLog.create({
      data: {
        hours,
        quality: quality || 3,
        bedtime: bedtime || null,
        wakeTime: wakeTime || null,
        note: note || null,
        date: new Date(),
      },
    })

    return NextResponse.json(log, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create sleep log' }, { status: 500 })
  }
}
