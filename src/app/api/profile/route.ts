import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const profile = await db.userProfile.findFirst()
    if (!profile) {
      // Create default profile
      const newProfile = await db.userProfile.create({
        data: { name: 'Friend', wellnessGoals: 'general well-being' },
      })
      return NextResponse.json(newProfile)
    }
    return NextResponse.json(profile)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { name, wellnessGoals } = body

    let profile = await db.userProfile.findFirst()

    if (profile) {
      profile = await db.userProfile.update({
        where: { id: profile.id },
        data: {
          ...(name && { name }),
          ...(wellnessGoals && { wellnessGoals }),
        },
      })
    } else {
      profile = await db.userProfile.create({
        data: {
          name: name || 'Friend',
          wellnessGoals: wellnessGoals || 'general well-being',
        },
      })
    }

    return NextResponse.json(profile)
  } catch {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
