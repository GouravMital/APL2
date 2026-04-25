/**
 * Agentic AI Engine — ReAct (Reason + Act) loop with wellness tools.
 * The AI can autonomously decide to call tools to interact with the user's
 * wellness data, log entries, create habits, fetch insights, etc.
 */

import { db } from '@/lib/db'
import { createCompletion, type ToolDefinition, type ToolCall, type ChatMessage } from '@/lib/openrouter'

// ===== TOOL DEFINITIONS =====
export const wellnessTools: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'log_mood',
      description: 'Log the user\'s current mood. Use when the user expresses how they\'re feeling or asks to record their mood.',
      parameters: {
        type: 'object',
        properties: {
          mood: {
            type: 'integer',
            description: 'Mood level from 1 (very low) to 5 (great)',
          },
          emoji: {
            type: 'string',
            description: 'Emoji representing the mood: 😢(1), 😔(2), 😐(3), 😊(4), 😄(5)',
          },
          note: {
            type: 'string',
            description: 'Optional note about why they feel this way',
          },
        },
        required: ['mood', 'emoji'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'log_hydration',
      description: 'Log or update the user\'s water intake for today. Use when user mentions drinking water or asks to track hydration.',
      parameters: {
        type: 'object',
        properties: {
          glasses: {
            type: 'integer',
            description: 'Total number of glasses of water consumed today',
          },
        },
        required: ['glasses'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'log_sleep',
      description: 'Log the user\'s sleep data. Use when the user mentions their sleep or asks to track it.',
      parameters: {
        type: 'object',
        properties: {
          hours: {
            type: 'number',
            description: 'Hours of sleep',
          },
          quality: {
            type: 'integer',
            description: 'Sleep quality from 1 (poor) to 5 (excellent)',
          },
          note: {
            type: 'string',
            description: 'Optional note about their sleep',
          },
        },
        required: ['hours', 'quality'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_habit',
      description: 'Create a new wellness habit for the user. Use when the user wants to start a new healthy routine.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the habit (e.g., "Morning Walk", "Read 10 Pages", "Meditate")',
          },
          icon: {
            type: 'string',
            description: 'A single emoji icon for the habit',
          },
        },
        required: ['name', 'icon'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_journal_entry',
      description: 'Create a journal entry for the user. Use when the user wants to write or reflect on something.',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Title of the journal entry',
          },
          content: {
            type: 'string',
            description: 'The journal content/reflection',
          },
          tags: {
            type: 'string',
            description: 'Comma-separated tags (e.g., "gratitude,reflection,selfcare")',
          },
        },
        required: ['title', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'log_meditation',
      description: 'Log a completed meditation session. Use when the user mentions they meditated or completed a mindfulness exercise.',
      parameters: {
        type: 'object',
        properties: {
          duration: {
            type: 'integer',
            description: 'Duration in minutes',
          },
          type: {
            type: 'string',
            description: 'Type of meditation (mindfulness, body-scan, loving-kindness, gratitude, walking, sleep)',
          },
        },
        required: ['duration', 'type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_wellness_summary',
      description: 'Get a comprehensive summary of the user\'s recent wellness data. Use when you need current data to provide personalized advice or the user asks about their progress.',
      parameters: {
        type: 'object',
        properties: {
          days: {
            type: 'integer',
            description: 'Number of days to look back (default: 7)',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'suggest_breathing_exercise',
      description: 'Recommend a specific breathing exercise pattern. Use when the user is stressed, anxious, or wants to calm down.',
      parameters: {
        type: 'object',
        properties: {
          pattern: {
            type: 'string',
            description: 'The breathing pattern to suggest',
            enum: ['4-7-8 Relaxing', 'Box Breathing', 'Calm Breath', 'Energizing'],
          },
          reason: {
            type: 'string',
            description: 'Why this pattern is recommended for the user right now',
          },
        },
        required: ['pattern', 'reason'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_wellness_goal',
      description: 'Update the user\'s wellness goals. Use when the user expresses a desire to work on specific areas of their health.',
      parameters: {
        type: 'object',
        properties: {
          goals: {
            type: 'string',
            description: 'Description of the user\'s wellness goals',
          },
        },
        required: ['goals'],
      },
    },
  },
]

// ===== TOOL EXECUTORS =====
interface ToolResult {
  success: boolean
  data: unknown
  message: string
}

async function executeTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
  try {
    switch (name) {
      case 'log_mood': {
        const mood = args.mood as number
        const emoji = args.emoji as string
        const note = args.note as string | undefined
        if (mood < 1 || mood > 5) {
          return { success: false, data: null, message: 'Mood must be between 1 and 5' }
        }
        const entry = await db.moodEntry.create({
          data: { mood, emoji, note: note || null, date: new Date() },
        })
        return { success: true, data: entry, message: `Mood logged: ${emoji} (${mood}/5)${note ? ` — ${note}` : ''}` }
      }

      case 'log_hydration': {
        const glasses = args.glasses as number
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const existing = await db.hydrationLog.findFirst({
          where: { date: { gte: today } },
        })
        if (existing) {
          const updated = await db.hydrationLog.update({
            where: { id: existing.id },
            data: { glasses },
          })
          return { success: true, data: updated, message: `Hydration updated: ${glasses} glasses today` }
        }
        const log = await db.hydrationLog.create({
          data: { glasses, goal: 8, date: new Date() },
        })
        return { success: true, data: log, message: `Hydration logged: ${glasses} glasses today` }
      }

      case 'log_sleep': {
        const hours = args.hours as number
        const quality = args.quality as number
        const note = args.note as string | undefined
        const log = await db.sleepLog.create({
          data: {
            hours,
            quality: Math.max(1, Math.min(5, quality)),
            note: note || null,
            date: new Date(),
          },
        })
        return { success: true, data: log, message: `Sleep logged: ${hours}h, quality ${quality}/5` }
      }

      case 'create_habit': {
        const habitName = args.name as string
        const icon = args.icon as string
        const habit = await db.habit.create({
          data: { name: habitName, icon, color: '#7C9A82', frequency: 'daily' },
        })
        return { success: true, data: habit, message: `Habit created: ${icon} ${habitName}` }
      }

      case 'create_journal_entry': {
        const title = args.title as string
        const content = args.content as string
        const tags = args.tags as string | undefined
        const entry = await db.journalEntry.create({
          data: { title, content, tags: tags || '', date: new Date() },
        })
        return { success: true, data: entry, message: `Journal entry created: "${title}"` }
      }

      case 'log_meditation': {
        const duration = args.duration as number
        const type = args.type as string
        const session = await db.meditationSession.create({
          data: { duration, type, date: new Date() },
        })
        return { success: true, data: session, message: `Meditation logged: ${duration} min ${type}` }
      }

      case 'get_wellness_summary': {
        const days = (args.days as number) || 7
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

        const [moods, sleepLogs, hydrationLogs, habits, journals, meditations, profile] = await Promise.all([
          db.moodEntry.findMany({ where: { date: { gte: since } }, orderBy: { date: 'desc' }, take: 7 }),
          db.sleepLog.findMany({ where: { date: { gte: since } }, orderBy: { date: 'desc' }, take: 7 }),
          db.hydrationLog.findMany({ where: { date: { gte: since } }, orderBy: { date: 'desc' }, take: 7 }),
          db.habit.findMany({ include: { logs: { orderBy: { date: 'desc' }, take: 7 } } }),
          db.journalEntry.findMany({ where: { date: { gte: since } }, orderBy: { date: 'desc' }, take: 3 }),
          db.meditationSession.findMany({ where: { date: { gte: since } }, orderBy: { date: 'desc' }, take: 5 }),
          db.userProfile.findFirst(),
        ])

        const avgMood = moods.length > 0 ? (moods.reduce((s, m) => s + m.mood, 0) / moods.length).toFixed(1) : null
        const avgSleep = sleepLogs.length > 0 ? (sleepLogs.reduce((s, l) => s + l.hours, 0) / sleepLogs.length).toFixed(1) : null
        const avgHydration = hydrationLogs.length > 0 ? (hydrationLogs.reduce((s, h) => s + h.glasses, 0) / hydrationLogs.length).toFixed(1) : null
        const totalMeditationMin = meditations.reduce((s, m) => s + m.duration, 0)

        return {
          success: true,
          data: {
            profile,
            period: `Last ${days} days`,
            moodEntries: moods.length,
            avgMood,
            avgSleep,
            avgHydration,
            habitCount: habits.length,
            journalEntries: journals.length,
            meditationSessions: meditations.length,
            totalMeditationMin,
          },
          message: `Summary: ${moods.length} moods (avg ${avgMood || '—'}), avg sleep ${avgSleep || '—'}h, avg water ${avgHydration || '—'} glasses, ${habits.length} habits, ${totalMeditationMin} min meditation`,
        }
      }

      case 'suggest_breathing_exercise': {
        const pattern = args.pattern as string
        const reason = args.reason as string
        const patterns: Record<string, { inhale: number; hold: number; exhale: number; desc: string }> = {
          '4-7-8 Relaxing': { inhale: 4, hold: 7, exhale: 8, desc: 'Inhale 4s → Hold 7s → Exhale 8s. Best for calming down and sleep preparation.' },
          'Box Breathing': { inhale: 4, hold: 4, exhale: 4, desc: 'Inhale 4s → Hold 4s → Exhale 4s → Hold 4s. Great for focus and balance.' },
          'Calm Breath': { inhale: 4, hold: 2, exhale: 6, desc: 'Inhale 4s → Hold 2s → Exhale 6s. Simple and soothing for any moment.' },
          'Energizing': { inhale: 6, hold: 0, exhale: 2, desc: 'Inhale 6s → Exhale 2s. Quick energy boost when you need it.' },
        }
        const p = patterns[pattern]
        return {
          success: true,
          data: { pattern, reason, ...p },
          message: `Recommended: ${pattern} — ${p?.desc || ''}. Reason: ${reason}`,
        }
      }

      case 'set_wellness_goal': {
        const goals = args.goals as string
        let profile = await db.userProfile.findFirst()
        if (profile) {
          profile = await db.userProfile.update({
            where: { id: profile.id },
            data: { wellnessGoals: goals },
          })
        } else {
          profile = await db.userProfile.create({
            data: { name: 'Friend', wellnessGoals: goals },
          })
        }
        return { success: true, data: profile, message: `Wellness goals updated: "${goals}"` }
      }

      default:
        return { success: false, data: null, message: `Unknown tool: ${name}` }
    }
  } catch (error) {
    console.error(`[Agent] Tool execution error for ${name}:`, error)
    return { success: false, data: null, message: `Error executing ${name}` }
  }
}

// ===== AGENTIC LOOP =====
export interface AgentAction {
  tool: string
  args: Record<string, unknown>
  result: ToolResult
}

export interface AgentResponse {
  content: string
  actions: AgentAction[]
  safety: boolean
  model: string
}

const MAX_TOOL_ROUNDS = 3 // Prevent infinite loops

export async function runAgenticLoop(
  systemPrompt: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[],
  userMessage: string,
): Promise<AgentResponse> {
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ]

  const actions: AgentAction[] = []
  let finalContent = ''
  let model = ''

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const result = await createCompletion(messages, wellnessTools)
    model = result.model

    // If no tool calls, we're done — the model gave a direct response
    if (!result.tool_calls || result.tool_calls.length === 0) {
      finalContent = result.content || "I'm here for you. Could you tell me more about how you're feeling?"
      break
    }

    // If there's content alongside tool calls, note it
    if (result.content) {
      finalContent = result.content
    }

    // Add assistant message with tool calls to conversation
    const assistantMsg: ChatMessage = {
      role: 'assistant',
      content: result.content || '',
      tool_calls: result.tool_calls,
    }
    messages.push(assistantMsg)

    // Execute each tool call
    for (const toolCall of result.tool_calls) {
      let args: Record<string, unknown>
      try {
        args = JSON.parse(toolCall.function.arguments)
      } catch {
        args = {}
      }

      const toolResult = await executeTool(toolCall.function.name, args)

      actions.push({
        tool: toolCall.function.name,
        args,
        result: toolResult,
      })

      // Add tool result to conversation
      messages.push({
        role: 'tool',
        content: JSON.stringify(toolResult),
        tool_call_id: toolCall.id,
      })
    }
  }

  // If we went through tool rounds but didn't get a final text response,
  // make one more call to synthesize
  if (!finalContent && actions.length > 0) {
    const synthesisResult = await createCompletion(messages)
    model = synthesisResult.model
    finalContent = synthesisResult.content || "I've taken care of that for you. Is there anything else you'd like to work on? 🌿"
  }

  return {
    content: finalContent,
    actions,
    safety: false,
    model,
  }
}
