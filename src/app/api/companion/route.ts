import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// ===== RATE LIMITING =====
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 10 // 10 messages per minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false
  }

  entry.count++
  return true
}

// ===== CRISIS DETECTION =====
const crisisPatterns = [
  /\b(kill\s+myself|suicide|suicidal|end\s+my\s+life|don'?t\s+want\s+to\s+live|want\s+to\s+die)\b/i,
  /\b(self\s*-?\s*harm|hurt\s+myself|cut\s+myself|cutting)\b/i,
  /\b(abuse|abused|assault|raped|domestic\s+violence)\b/i,
  /\b(overdose|pills\s+to\s+die|ending\s+it\s+all|no\s+reason\s+to\s+live)\b/i,
  /\b(can'?t\s+go\s+on|give\s+up\s+on\s+life|world\s+would\s+be\s+better\s+without)\b/i,
]

const crisisResponse = `I can hear that you're going through something really difficult right now, and I want you to know that your feelings matter and you deserve support.

**Please reach out for help now:**

🆘 **National Suicide Prevention Lifeline**: Call or text **988** (US)
📱 **Crisis Text Line**: Text **HOME** to **741741**
🌍 **International**: [IASP Crisis Centres](https://www.iasp.info/resources/Crisis_Centres/)

You don't have to face this alone. A trained professional can help you right now. Please reach out to one of these resources — they're free, confidential, and available 24/7.

I care about your safety. Please connect with someone who can support you through this moment. 💚`

// ===== CONTEXT ENGINEERING =====
async function buildWellnessContext(): Promise<string> {
  try {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Recent mood entries
    const recentMoods = await db.moodEntry.findMany({
      where: { date: { gte: weekAgo } },
      orderBy: { date: 'desc' },
      take: 5,
    })

    // Recent journal entries
    const recentJournals = await db.journalEntry.findMany({
      where: { date: { gte: weekAgo } },
      orderBy: { date: 'desc' },
      take: 3,
    })

    // Recent sleep logs
    const recentSleep = await db.sleepLog.findMany({
      where: { date: { gte: weekAgo } },
      orderBy: { date: 'desc' },
      take: 3,
    })

    // Recent hydration
    const recentHydration = await db.hydrationLog.findMany({
      where: { date: { gte: weekAgo } },
      orderBy: { date: 'desc' },
      take: 3,
    })

    // Habits
    const habits = await db.habit.findMany({
      include: { logs: { orderBy: { date: 'desc' }, take: 7 } },
    })

    // User profile
    const profile = await db.userProfile.findFirst()

    // Meditation sessions
    const recentMeditation = await db.meditationSession.findMany({
      where: { date: { gte: weekAgo } },
      orderBy: { date: 'desc' },
      take: 3,
    })

    // Build context string
    let context = ''

    if (profile) {
      context += `\nUSER PROFILE: Name: ${profile.name}, Wellness Goals: ${profile.wellnessGoals}`
    }

    if (recentMoods.length > 0) {
      const moodSummary = recentMoods.map(m => `${m.emoji} (${m.mood}/5) ${m.note ? `- ${m.note}` : ''}`).join('; ')
      const avgMood = (recentMoods.reduce((s, m) => s + m.mood, 0) / recentMoods.length).toFixed(1)
      context += `\nRECENT MOOD: Average ${avgMood}/5. Recent entries: ${moodSummary}`
    } else {
      context += '\nRECENT MOOD: No recent mood entries logged.'
    }

    if (recentJournals.length > 0) {
      const journalSummary = recentJournals.map(j => `"${j.title}" (${j.tags || 'no tags'})`).join('; ')
      context += `\nRECENT JOURNAL: ${journalSummary}`
    }

    if (recentSleep.length > 0) {
      const avgSleep = (recentSleep.reduce((s, l) => s + l.hours, 0) / recentSleep.length).toFixed(1)
      const avgQuality = (recentSleep.reduce((s, l) => s + l.quality, 0) / recentSleep.length).toFixed(1)
      context += `\nSLEEP: Average ${avgSleep}h, quality ${avgQuality}/5`
    }

    if (recentHydration.length > 0) {
      const avgWater = (recentHydration.reduce((s, h) => s + h.glasses, 0) / recentHydration.length).toFixed(1)
      context += `\nHYDRATION: Average ${avgWater} glasses/day`
    }

    if (habits.length > 0) {
      const habitSummary = habits.map(h => {
        const completed = h.logs.filter(l => l.completed).length
        return `${h.icon} ${h.name} (${completed}/${h.logs.length} recent completions)`
      }).join('; ')
      context += `\nHABITS: ${habitSummary}`
    }

    if (recentMeditation.length > 0) {
      const totalMin = recentMeditation.reduce((s, m) => s + m.duration, 0)
      context += `\nMEDITATION: ${recentMeditation.length} sessions recently, ${totalMin} total minutes`
    }

    return context
  } catch {
    return '\nCONTEXT: Unable to load wellness data.'
  }
}

// ===== SYSTEM PROMPT =====
function buildSystemPrompt(context: string): string {
  return `You are Serenity, a warm, supportive, and structured AI wellness companion. Your role is to help users reflect, build healthy habits, and feel emotionally supported.

CRITICAL SAFETY BOUNDARIES:
- You are NOT a therapist, doctor, or medical professional. Never diagnose or prescribe.
- If the user expresses thoughts of self-harm, suicide, abuse, or crisis, immediately respond with safety-first guidance and crisis resources.
- Always prioritize the user's safety above all else.
- Use supportive, non-judgmental language.
- If you suspect a crisis, be direct and provide helpline information.

YOUR APPROACH:
- Be warm, empathetic, and validating.
- Use structured, actionable suggestions.
- Reference the user's wellness context when relevant (mood, habits, sleep, etc.).
- Celebrate progress, however small.
- Encourage professional help when appropriate.
- Keep responses concise (2-4 paragraphs max) unless the user asks for detailed guidance.
- Use gentle emoji sparingly to convey warmth (🌿💚✨).
- Adapt your tone: be more gentle if the user seems distressed, more upbeat if they're celebrating.

WELLNESS CONTEXT (consider this in your response):
${context}

RESPONSE GUIDELINES:
1. Acknowledge the user's feelings first.
2. Provide supportive, structured guidance.
3. Reference their wellness data when relevant (e.g., "I notice you've been sleeping less this week...").
4. Suggest specific, small actionable steps.
5. End with an encouraging note.`
}

// ===== ZAI SDK INSTANCE =====
let zaiInstance: InstanceType<typeof ZAI> | null = null

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

// ===== FALLBACK RESPONSES =====
const fallbackResponses = [
  "I'm here for you. While I'm having a brief moment of difficulty connecting, I want you to know that your feelings are valid. Take a deep breath, and we can continue shortly. 🌿",
  "I'm experiencing a moment of pause. In the meantime, remember: you've already taken a positive step by reaching out. That takes courage. 💚",
  "I'm having a brief technical moment. While I reconnect, try taking three slow breaths — inhale for 4, hold for 4, exhale for 6. I'll be right with you. ✨",
]

// ===== API ROUTES =====
export async function GET() {
  try {
    const messages = await db.chatMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    // Return in chronological order
    return NextResponse.json(messages.reverse())
  } catch {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Please slow down. Take a moment to breathe, then try again. 🌿' },
        { status: 429 }
      )
    }

    // Validate request
    const body = await request.json()
    const { message } = body

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    if (message.length > 2000) {
      return NextResponse.json({ error: 'Message too long. Please keep it under 2000 characters.' }, { status: 400 })
    }

    // Check for crisis language
    const isCrisis = crisisPatterns.some(pattern => pattern.test(message))

    if (isCrisis) {
      // Save user message
      await db.chatMessage.create({
        data: { role: 'user', content: message.trim(), context: 'crisis-detected' },
      })

      // Save crisis response
      const savedResponse = await db.chatMessage.create({
        data: {
          role: 'assistant',
          content: crisisResponse,
          context: 'safety-escalation',
        },
      })

      console.log('[COMPANION] Crisis detected - safety escalation triggered')

      return NextResponse.json({
        id: savedResponse.id,
        content: crisisResponse,
        safety: true,
      })
    }

    // Build wellness context
    const context = await buildWellnessContext()

    // Fetch recent conversation history
    const recentMessages = await db.chatMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    // Build messages array for AI
    const systemPrompt = buildSystemPrompt(context)
    const chatMessages = [
      { role: 'assistant' as const, content: systemPrompt },
      ...recentMessages.reverse().map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message.trim() },
    ]

    // Save user message
    await db.chatMessage.create({
      data: { role: 'user', content: message.trim() },
    })

    // Call AI
    let aiResponse: string
    try {
      const zai = await getZAI()
      const completion = await zai.chat.completions.create({
        messages: chatMessages,
        thinking: { type: 'disabled' },
      })

      aiResponse = completion.choices[0]?.message?.content || ''

      if (!aiResponse.trim()) {
        throw new Error('Empty response from AI')
      }
    } catch (aiError) {
      console.error('[COMPANION] AI Error:', aiError)
      aiResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]
    }

    // Save AI response
    const savedResponse = await db.chatMessage.create({
      data: {
        role: 'assistant',
        content: aiResponse,
        context: context.substring(0, 500), // Store truncated context for logging
      },
    })

    return NextResponse.json({
      id: savedResponse.id,
      content: aiResponse,
      safety: false,
    })
  } catch (error) {
    console.error('[COMPANION] Error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please take a deep breath and try again. 🌿' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    await db.chatMessage.deleteMany()
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to clear messages' }, { status: 500 })
  }
}
