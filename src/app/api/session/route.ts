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
}

const sessions = new Map<string, SessionData>();

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
      const session = sessions.get(sessionCode);
      if (!session || !session.isActive) {
        return NextResponse.json(
          { success: false, error: 'Session not found or inactive' },
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
      const session = sessions.get(sessionCode);
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
      const session = sessions.get(sessionCode);
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
      const session = sessions.get(sessionCode);
      if (session) {
        session.isActive = false;
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'clear') {
      const session = sessions.get(sessionCode);
      if (session) {
        session.captions = [];
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
  const sessionCode = searchParams.get('code');
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
  });
}
