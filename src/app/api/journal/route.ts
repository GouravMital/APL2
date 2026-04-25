import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const entries = await db.journalEntry.findMany({
      orderBy: { date: 'desc' },
      take: 30,
    })
    return NextResponse.json(entries)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch journal entries' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, content, tags } = body

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    const entry = await db.journalEntry.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        tags: tags || '',
        date: new Date(),
      },
    })

    return NextResponse.json(entry, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create journal entry' }, { status: 500 })
  }
}
