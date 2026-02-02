import { NextResponse } from 'next/server';

export async function GET() {
  const openaiApiKey = process.env.OPENAI_API_KEY?.trim();
  
  return NextResponse.json({
    hasApiKey: !!openaiApiKey,
    keyLength: openaiApiKey?.length || 0,
    keyPrefix: openaiApiKey ? openaiApiKey.substring(0, 7) + '...' : 'none',
    message: openaiApiKey 
      ? 'API key is configured! ✅' 
      : 'API key not found. Please add OPENAI_API_KEY to .env.local',
    envFileLocation: 'Should be in: SoftwareDev2026/.env.local',
  });
}

