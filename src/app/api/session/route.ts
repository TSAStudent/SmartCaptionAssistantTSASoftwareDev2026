import { NextRequest, NextResponse } from 'next/server';
import { Caption, Bookmark } from '@/types';

interface SessionData {
  id: string;
  code: string;
  hostId: string;
  createdAt: number;
  isActive: boolean;
  captions: Caption[];
  bookmarks: Bookmark[];
  lastClearedAt?: number;
}

// Persist sessions across Next.js hot reloads (dev) and reuse in serverless
const globalForSession = globalThis as unknown as { sessions: Map<string, SessionData> };
if (!globalForSession.sessions) {
  globalForSession.sessions = new Map<string, SessionData>();
}
const sessions = globalForSession.sessions;

function normalizeCode(code: string | undefined): string {
  if (!code || typeof code !== 'string') return '';
  return code.toUpperCase().trim().replace(/\s/g, '');
}

function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sessionCode, hostId, caption, bookmark } = body;
    const codeParam = normalizeCode(sessionCode);

    if (action === 'create') {
      const code = generateSessionCode();
      const id = generateId();
      const newHostId = hostId || generateId();
      
      const session: SessionData = {
        id,
        code,
        hostId: newHostId,
        createdAt: Date.now(),
        isActive: true,
        captions: [],
        bookmarks: [],
      };
      
      sessions.set(code, session);
      
      return NextResponse.json({
        success: true,
        session: {
          id: session.id,
          code: session.code,
          hostId: session.hostId,
          createdAt: session.createdAt,
          isActive: session.isActive,
        },
      });
    }

    if (action === 'join') {
      if (!codeParam) {
        return NextResponse.json(
          { success: false, error: 'Please enter a session code' },
          { status: 400 }
        );
      }
      const session = sessions.get(codeParam);
      if (!session || !session.isActive) {
        return NextResponse.json(
          { success: false, error: 'Session not found or inactive. Check the code and try again.' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        session: {
          id: session.id,
          code: session.code,
          createdAt: session.createdAt,
          isActive: session.isActive,
        },
        captions: session.captions,
        bookmarks: session.bookmarks,
      });
    }

    if (action === 'addCaption') {
      const session = codeParam ? sessions.get(codeParam) : undefined;
      if (!session || !session.isActive) {
        return NextResponse.json(
          { success: false, error: 'Session not found or inactive' },
          { status: 404 }
        );
      }
      
      if (caption) {
        session.captions.push(caption);
        if (session.captions.length > 500) {
          session.captions = session.captions.slice(-500);
        }
      }
      
      return NextResponse.json({ success: true });
    }

    if (action === 'addBookmark') {
      const session = codeParam ? sessions.get(codeParam) : undefined;
      if (!session || !session.isActive) {
        return NextResponse.json(
          { success: false, error: 'Session not found or inactive' },
          { status: 404 }
        );
      }
      
      if (bookmark) {
        session.bookmarks.push(bookmark);
      }
      
      return NextResponse.json({ success: true });
    }

    if (action === 'end') {
      const session = codeParam ? sessions.get(codeParam) : undefined;
      if (session) {
        session.isActive = false;
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'clear') {
      const session = codeParam ? sessions.get(codeParam) : undefined;
      if (session) {
        session.captions = [];
        session.lastClearedAt = Date.now();
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Session API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionCode = normalizeCode(searchParams.get('code') ?? '');
  const since = searchParams.get('since');

  if (!sessionCode) {
    return NextResponse.json(
      { success: false, error: 'Session code required' },
      { status: 400 }
    );
  }

  const session = sessions.get(sessionCode);
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Session not found' },
      { status: 404 }
    );
  }

  let captions = session.captions;
  if (since) {
    const sinceTime = parseInt(since, 10);
    captions = captions.filter(c => c.timestamp > sinceTime);
  }

  return NextResponse.json({
    success: true,
    isActive: session.isActive,
    captions,
    bookmarks: session.bookmarks,
    lastClearedAt: session.lastClearedAt,
  });
}
