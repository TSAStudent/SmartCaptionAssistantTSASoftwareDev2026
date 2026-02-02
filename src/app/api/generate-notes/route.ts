import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GeneratedNotes } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { transcript, selectedTopic } = await request.json();

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      );
    }

    const openaiApiKey = process.env.OPENAI_API_KEY?.trim();

    // Debug logging - this WILL show in terminal
    console.log('\n=== OPENAI API REQUEST ===');
    console.log('OpenAI API Key check:', {
      hasKey: !!openaiApiKey,
      keyLength: openaiApiKey?.length || 0,
      keyPrefix: openaiApiKey ? openaiApiKey.substring(0, 7) + '...' : 'none',
    });
    console.log('Transcript length:', transcript.length);
    console.log('==========================\n');

    if (!openaiApiKey || openaiApiKey.length === 0) {
      // Fallback to local generation if API key is not set
      console.error('\n❌ ERROR: OpenAI API key not found in environment variables');
      console.error('Please create .env.local in SoftwareDev2026/ folder');
      console.error('Add: OPENAI_API_KEY=sk-your-key-here');
      console.error('Then restart the server with: npm run dev\n');
      return NextResponse.json({
        useLocal: true,
        message: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file and restart the server.',
      });
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    // Build the prompt for OpenAI
    const topicContext = selectedTopic
      ? `The lecture is about: ${selectedTopic.name}. Focus on terms related to this topic: ${selectedTopic.terms.map((t: { term: string }) => t.term).join(', ')}.`
      : '';

    const systemPrompt = `You are an expert academic note-taking assistant. Your task is to analyze lecture transcripts and generate ORIGINAL, SYNTHESIZED study notes. 

CRITICAL RULES - YOU MUST FOLLOW THESE:
1. DO NOT copy-paste any text directly from the transcript
2. DO NOT use exact quotes or verbatim sentences from the lecture
3. DO NOT simply rephrase sentences from the transcript
4. YOU MUST synthesize, analyze, and create original content based on the concepts discussed

FOR EACH SECTION:

**SUMMARY:**
- Write 2-4 ORIGINAL sentences that synthesize the main topic
- Capture the core concepts and key takeaways in your own words
- Do NOT copy any sentences from the transcript
- Example: If lecture says "Today we're talking about photosynthesis which is when plants make food", write: "This lecture covers photosynthesis, the biological process by which plants convert light energy into chemical energy to produce glucose."

**KEY POINTS:**
- Generate 5-10 ORIGINAL bullet points that capture the most important concepts
- Each point should be a synthesized concept, not a copied sentence
- Write in your own words, focusing on what was learned, not what was said
- Example: Instead of "The teacher said photosynthesis needs sunlight", write: "Photosynthesis requires sunlight as the primary energy source"

**KEY TERMS & DEFINITIONS:**
- Identify important terms mentioned in the lecture
- Write ORIGINAL, clear definitions in your own words
- Do NOT copy definitions word-for-word from the transcript
- Base definitions on the concepts explained, but express them freshly
- Example: If lecture says "Photosynthesis is when plants use sunlight to make food", write: {"term": "Photosynthesis", "definition": "A metabolic process in plants that converts light energy into chemical energy, enabling the production of glucose from carbon dioxide and water"}

**FORMULAS:**
- Only include actual mathematical formulas or equations if explicitly stated
- Write them clearly and accurately

${topicContext}

You MUST respond with valid JSON only, using this exact structure:
{
  "summary": "Your original synthesized summary in 2-4 sentences",
  "bulletPoints": ["Original key point 1", "Original key point 2", ...],
  "keyTerms": [{"term": "Term name", "definition": "Your original definition"}, ...],
  "formulas": ["Formula if mentioned", ...]
}`;

    const userPrompt = `Analyze this lecture transcript and generate ORIGINAL study notes. 

IMPORTANT: 
- DO NOT copy any text from the transcript
- DO NOT use exact phrases or sentences from what was said
- Synthesize the information and write everything in your own words
- Create notes that explain the CONCEPTS, not repeat the DIALOGUE
- Think about what a student should learn from this lecture, then write original notes explaining those concepts

LECTURE TRANSCRIPT:
${transcript}

Generate comprehensive, original study notes that synthesize the key concepts discussed.`;

    // Call OpenAI API using the SDK
    console.log('🤖 Calling OpenAI API...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using the more cost-effective model
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });
    console.log('✅ OpenAI API response received');

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: 'No content received from OpenAI', useLocal: true },
        { status: 500 }
      );
    }

    // Parse the JSON response
    let notes: GeneratedNotes;
    try {
      notes = JSON.parse(content);
      
      // Validate and ensure all required fields exist
      notes = {
        summary: notes.summary || 'No summary available.',
        bulletPoints: Array.isArray(notes.bulletPoints) ? notes.bulletPoints : [],
        keyTerms: Array.isArray(notes.keyTerms) ? notes.keyTerms : [],
        formulas: Array.isArray(notes.formulas) ? notes.formulas : [],
      };
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse notes from OpenAI', useLocal: true },
        { status: 500 }
      );
    }

    console.log('✅ Successfully generated AI-powered notes!');
    console.log('Summary length:', notes.summary.length);
    console.log('Key points:', notes.bulletPoints.length);
    console.log('Key terms:', notes.keyTerms.length);
    console.log('Formulas:', notes.formulas.length);
    return NextResponse.json({ notes, useLocal: false });
  } catch (error) {
    console.error('Error generating notes:', error);
    
    // Handle OpenAI-specific errors
    if (error && typeof error === 'object' && 'status' in error) {
      const apiError = error as { status?: number; message?: string };
      const errorMessage = apiError.message || 'Unknown API error';
      console.error('OpenAI API Error:', errorMessage);
      return NextResponse.json(
        { 
          error: 'OpenAI API error',
          details: errorMessage,
          useLocal: true,
        },
        { status: apiError.status || 500 }
      );
    }
    
    // Log the full error for debugging
    const errorDetails = error instanceof Error ? error.message : String(error);
    console.error('Unexpected error:', errorDetails);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: errorDetails,
        useLocal: true,
      },
      { status: 500 }
    );
  }
}

