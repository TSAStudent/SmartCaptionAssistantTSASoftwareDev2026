'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Caption, Bookmark, Session } from '@/types';

interface UseSessionReturn {
  session: Session | null;
  isHost: boolean;
  isConnected: boolean;
  error: string | null;
  clearError: () => void;
  remoteCaptions: Caption[];
  remoteBookmarks: Bookmark[];
  createSession: () => Promise<Session | null>;
  joinSession: (code: string) => Promise<boolean>;
  endSession: () => Promise<void>;
  broadcastCaption: (caption: Caption) => Promise<void>;
  broadcastBookmark: (bookmark: Bookmark) => Promise<void>;
  broadcastClear: () => Promise<void>;
}

export function useSession(): UseSessionReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remoteCaptions, setRemoteCaptions] = useState<Caption[]>([]);
  const [remoteBookmarks, setRemoteBookmarks] = useState<Bookmark[]>([]);
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const lastTimestampRef = useRef<number>(0);
  const lastClearedAtRef = useRef<number>(0);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const startPolling = useCallback((code: string) => {
    stopPolling();
    
    const poll = async () => {
      try {
        const response = await fetch(
          `/api/session?code=${code}&since=${lastTimestampRef.current}`
        );
        const data = await response.json();
        
        if (data.success) {
          if (!data.isActive) {
            setError('Session has ended');
            setIsConnected(false);
            stopPolling();
            return;
          }
          
          // If host cleared, clear our remote captions
          const clearedAt = data.lastClearedAt as number | undefined;
          if (clearedAt != null && clearedAt > lastClearedAtRef.current) {
            lastClearedAtRef.current = clearedAt;
            setRemoteCaptions([]);
          }
          
          if (data.captions && data.captions.length > 0) {
            setRemoteCaptions(prev => {
              const existingIds = new Set(prev.map(c => c.id));
              const newCaptions = data.captions.filter(
                (c: Caption) => !existingIds.has(c.id)
              );
              if (newCaptions.length > 0) {
                lastTimestampRef.current = Math.max(
                  ...newCaptions.map((c: Caption) => c.timestamp)
                );
                return [...prev, ...newCaptions];
              }
              return prev;
            });
          }
          
          if (data.bookmarks) {
            setRemoteBookmarks(data.bookmarks);
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    poll();
    pollingRef.current = setInterval(poll, 1000);
  }, [stopPolling]);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  const createSession = useCallback(async (): Promise<Session | null> => {
    try {
      setError(null);
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create' }),
      });
      
      const data = await response.json();
      
      if (data.success && data.session) {
        const newSession: Session = {
          id: data.session.id,
          code: data.session.code,
          hostId: data.session.hostId,
          createdAt: data.session.createdAt,
          isActive: true,
        };
        setSession(newSession);
        setIsHost(true);
        setIsConnected(true);
        return newSession;
      } else {
        setError(data.error || 'Failed to create session');
        return null;
      }
    } catch (err) {
      setError('Failed to create session');
      console.error('Create session error:', err);
      return null;
    }
  }, []);

  const joinSession = useCallback(async (code: string): Promise<boolean> => {
    try {
      setError(null);
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', sessionCode: code.toUpperCase() }),
      });
      
      const data = await response.json();
      
      if (data.success && data.session) {
        const joinedSession: Session = {
          id: data.session.id,
          code: data.session.code,
          hostId: '',
          createdAt: data.session.createdAt,
          isActive: true,
        };
        setSession(joinedSession);
        setIsHost(false);
        setIsConnected(true);
        setRemoteCaptions(data.captions || []);
        setRemoteBookmarks(data.bookmarks || []);
        
        if (data.lastClearedAt != null) {
          lastClearedAtRef.current = data.lastClearedAt;
        }
        if (data.captions && data.captions.length > 0) {
          lastTimestampRef.current = Math.max(
            ...data.captions.map((c: Caption) => c.timestamp)
          );
        }
        
        startPolling(code.toUpperCase());
        return true;
      } else {
        setError(data.error || 'Failed to join session');
        return false;
      }
    } catch (err) {
      setError('Failed to join session');
      console.error('Join session error:', err);
      return false;
    }
  }, [startPolling]);

  const endSession = useCallback(async () => {
    if (!session) return;
    
    try {
      await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end', sessionCode: session.code }),
      });
    } catch (err) {
      console.error('End session error:', err);
    }
    
    stopPolling();
    setSession(null);
    setIsHost(false);
    setIsConnected(false);
    setRemoteCaptions([]);
    setRemoteBookmarks([]);
    lastClearedAtRef.current = 0;
  }, [session, stopPolling]);

  const broadcastCaption = useCallback(async (caption: Caption) => {
    if (!session || !isHost) return;
    
    try {
      await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addCaption',
          sessionCode: session.code,
          caption,
        }),
      });
    } catch (err) {
      console.error('Broadcast caption error:', err);
    }
  }, [session, isHost]);

  const broadcastBookmark = useCallback(async (bookmark: Bookmark) => {
    if (!session || !isHost) return;
    
    try {
      await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addBookmark',
          sessionCode: session.code,
          bookmark,
        }),
      });
    } catch (err) {
      console.error('Broadcast bookmark error:', err);
    }
  }, [session, isHost]);

  const broadcastClear = useCallback(async () => {
    if (!session || !isHost) return;
    
    try {
      await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'clear',
          sessionCode: session.code,
        }),
      });
    } catch (err) {
      console.error('Broadcast clear error:', err);
    }
  }, [session, isHost]);

  const clearError = useCallback(() => setError(null), []);

  return {
    session,
    isHost,
    isConnected,
    error,
    clearError,
    remoteCaptions,
    remoteBookmarks,
    createSession,
    joinSession,
    endSession,
    broadcastCaption,
    broadcastBookmark,
    broadcastClear,
  };
}
