import { SpeakerType } from '@/types';

/**
 * Detects if the speaker is likely a teacher or student based on text patterns
 */
export function detectSpeaker(text: string, previousSpeaker?: SpeakerType): SpeakerType {
  const lowerText = text.toLowerCase().trim();
  
  // Teacher indicators (authoritative, instructional language)
  const teacherPatterns = [
    // Instructional phrases
    /\b(class|students|everyone|let's|we're going to|today we|in this|the answer is|remember that|important to note|key point|definition|formula|equation|theorem|concept)\b/i,
    // Question patterns (teachers ask questions)
    /\b(what is|who can|does anyone|can someone|who knows|tell me|explain|describe|define)\b/i,
    // Instructional commands
    /\b(take notes|write down|pay attention|look at|notice that|observe|study|learn|understand)\b/i,
    // Explanatory language
    /\b(this means|in other words|for example|such as|specifically|essentially|basically|in summary)\b/i,
    // Academic terms
    /\b(lecture|lesson|chapter|section|topic|subject|curriculum|syllabus|assignment|homework|exam|test|quiz)\b/i,
  ];

  // Student indicators (questioning, responding, informal)
  const studentPatterns = [
    // Questions (students ask questions)
    /\b(what|why|how|when|where|can you|could you|i don't understand|i'm confused|what does|how do)\b/i,
    // Responses
    /\b(i think|i believe|i guess|maybe|probably|i'm not sure|i don't know|sorry|excuse me)\b/i,
    // Informal language
    /\b(yeah|yep|nope|uh|um|like|so|okay|ok|cool|awesome|thanks|thank you)\b/i,
    // Personal statements
    /\b(i have|i did|i was|i am|i'm|my|mine|i feel|i think)\b/i,
  ];

  // Count matches
  let teacherScore = 0;
  let studentScore = 0;

  teacherPatterns.forEach(pattern => {
    if (pattern.test(lowerText)) {
      teacherScore += 1;
    }
  });

  studentPatterns.forEach(pattern => {
    if (pattern.test(lowerText)) {
      studentScore += 1;
    }
  });

  // Length-based heuristics (teachers tend to speak longer)
  if (text.length > 100) {
    teacherScore += 1;
  } else if (text.length < 30) {
    studentScore += 0.5;
  }

  // Context-based: if previous speaker was teacher, next might be student (and vice versa)
  // But don't switch too quickly - use a threshold
  if (previousSpeaker === 'teacher' && studentScore > 0) {
    studentScore += 0.5;
  } else if (previousSpeaker === 'student' && teacherScore > 0) {
    teacherScore += 0.5;
  }

  // Decision logic
  if (teacherScore > studentScore && teacherScore > 0) {
    return 'teacher';
  } else if (studentScore > teacherScore && studentScore > 0) {
    return 'student';
  }

  // Default to previous speaker if available, otherwise unknown
  return previousSpeaker || 'unknown';
}

/**
 * Enhanced speaker detection using OpenAI API (optional, more accurate)
 */
export async function detectSpeakerWithAI(
  text: string,
  previousSpeaker?: SpeakerType,
  apiKey?: string
): Promise<SpeakerType> {
  if (!apiKey) {
    // Fallback to pattern matching
    return detectSpeaker(text, previousSpeaker);
  }

  try {
    const response = await fetch('/api/detect-speaker', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        previousSpeaker,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.speaker as SpeakerType;
    }
  } catch (error) {
    console.error('Error detecting speaker with AI:', error);
  }

  // Fallback to pattern matching
  return detectSpeaker(text, previousSpeaker);
}

