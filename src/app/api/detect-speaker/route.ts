import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { SpeakerType } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { text, previousSpeaker } = await request.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { speaker: previousSpeaker || 'unknown' },
        { status: 200 }
      );
    }

    const openaiApiKey = process.env.OPENAI_API_KEY?.trim();

    // If no API key, return unknown (will fallback to pattern matching)
    if (!openaiApiKey) {
      return NextResponse.json(
        { speaker: 'unknown', usePatternMatching: true },
        { status: 200 }
      );
    }

    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    const systemPrompt = `You are an expert at identifying whether speech is from a teacher/instructor or a student in a classroom setting.

Analyze the text and determine if it's from:
- "teacher": Instructional, authoritative, explaining concepts, asking questions to test knowledge, giving assignments
- "student": Asking questions, responding to teacher, expressing confusion, giving answers, informal language
- "unknown": Cannot determine with confidence

Respond with ONLY one word: "teacher", "student", or "unknown"`;

    const userPrompt = `Determine the speaker type for this classroom dialogue:

"${text}"

Previous speaker was: ${previousSpeaker || 'none'}

Respond with only: teacher, student, or unknown`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 10,
    });

    const response = completion.choices[0]?.message?.content?.trim().toLowerCase();
    
    if (response === 'teacher' || response === 'student' || response === 'unknown') {
      return NextResponse.json({ speaker: response as SpeakerType });
    }

    return NextResponse.json({ speaker: previousSpeaker || 'unknown' });
  } catch (error) {
    console.error('Error detecting speaker with AI:', error);
    return NextResponse.json(
      { speaker: 'unknown', error: 'AI detection failed' },
      { status: 200 }
    );
  }
}

