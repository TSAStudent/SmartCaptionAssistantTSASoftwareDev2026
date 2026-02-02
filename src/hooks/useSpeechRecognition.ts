'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Caption, SpeakerType, Bookmark } from '@/types';
import { DeepgramClient, getDeepgramApiKey } from '@/lib/deepgramClient';

export function useSpeechRecognition(teacherOnlyMode: boolean = false) {
  
  const [isListening, setIsListening] = useState(false);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported] = useState(true);
  const [currentSpeaker, setCurrentSpeaker] = useState<SpeakerType>('teacher');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [detectedSpeaker, setDetectedSpeaker] = useState<SpeakerType>('unknown');
  const [isConnected, setIsConnected] = useState(false);
  
  const deepgramClientRef = useRef<DeepgramClient | null>(null);
  const captionIdRef = useRef(0);
  const bookmarkIdRef = useRef(0);
  const isListeningRef = useRef(false);
  const currentSpeakerRef = useRef<SpeakerType>('teacher');

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    currentSpeakerRef.current = currentSpeaker;
  }, [currentSpeaker]);

  const handleTranscript = useCallback((transcript: string, speaker: SpeakerType, isFinal: boolean) => {
    // Override speaker to 'teacher' if teacherOnlyMode is enabled
    const finalSpeaker = teacherOnlyMode ? 'teacher' : speaker;
    
    if (isFinal) {
      const trimmedText = transcript.trim();
      if (trimmedText) {
        if (teacherOnlyMode) {
          // In teacher only mode, append to the last caption if it's a teacher caption
          setCaptions(prev => {
            const lastCaption = prev[prev.length - 1];
            if (lastCaption && lastCaption.speaker === 'teacher') {
              // Append to existing teacher caption
              return prev.map((caption, index) => 
                index === prev.length - 1
                  ? { ...caption, text: `${caption.text} ${trimmedText}` }
                  : caption
              );
            } else {
              // Create new teacher caption
              return [...prev, {
                id: `caption-${captionIdRef.current++}`,
                text: trimmedText,
                timestamp: Date.now(),
                isFinal: true,
                speaker: 'teacher' as SpeakerType,
              }];
            }
          });
        } else {
          // Normal mode: create new caption
          const newCaption: Caption = {
            id: `caption-${captionIdRef.current++}`,
            text: trimmedText,
            timestamp: Date.now(),
            isFinal: true,
            speaker: finalSpeaker,
          };
          setCaptions(prev => [...prev, newCaption]);
        }
        setDetectedSpeaker(finalSpeaker);
        currentSpeakerRef.current = finalSpeaker;
      }
      setCurrentTranscript('');
    } else {
      // Only set current transcript if it has meaningful content (more than 1 character)
      // This prevents showing "Speaking..." bubble with just single characters like "I"
      if (transcript.trim().length > 1) {
        setCurrentTranscript(transcript);
        if (finalSpeaker !== 'unknown') {
          setDetectedSpeaker(finalSpeaker);
        }
      }
    }
  }, [teacherOnlyMode]);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setIsListening(false);
  }, []);

  const handleConnectionChange = useCallback((connected: boolean) => {
    setIsConnected(connected);
    if (!connected && isListeningRef.current) {
      setIsListening(false);
    }
  }, []);

  const startListening = useCallback(async () => {
    if (isListening) return;

    const apiKey = getDeepgramApiKey();

    setError(null);
    
    try {
      deepgramClientRef.current = new DeepgramClient({
        apiKey,
        onTranscript: handleTranscript,
        onError: handleError,
        onConnectionChange: handleConnectionChange,
      });

      await deepgramClientRef.current.start();
      setIsListening(true);
    } catch (err: unknown) {
      const error = err as Error;
      let errorMessage = 'Failed to start speech recognition';
      if (error?.message?.includes('permission') || error?.name === 'NotAllowedError') {
        errorMessage = 'Microphone permission denied. Please allow microphone access in your browser settings.';
      } else if (error?.message) {
        errorMessage = `Failed to start: ${error.message}`;
      }
      setError(errorMessage);
      setIsListening(false);
      console.error('Speech recognition start error:', err);
    }
  }, [isListening, handleTranscript, handleError, handleConnectionChange]);

  const stopListening = useCallback(() => {
    if (deepgramClientRef.current) {
      deepgramClientRef.current.stop();
      deepgramClientRef.current = null;
    }
    setIsListening(false);
    setCurrentTranscript('');
    setIsConnected(false);
  }, []);

  const clearCaptions = useCallback(() => {
    setCaptions([]);
    setCurrentTranscript('');
    if (deepgramClientRef.current) {
      deepgramClientRef.current.resetTeacherSpeaker();
    }
  }, []);

  const loadCaptionsFromTranscript = useCallback((transcript: string) => {
    if (!transcript || !transcript.trim()) return;
    
    // Split transcript into sentences (by periods, exclamation marks, question marks)
    const sentences = transcript
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    // Create captions from sentences
    const loadedCaptions: Caption[] = sentences.map((sentence, index) => ({
      id: `loaded-caption-${Date.now()}-${index}`,
      text: sentence,
      timestamp: Date.now() - (sentences.length - index) * 1000, // Stagger timestamps
      isFinal: true,
      speaker: 'unknown' as SpeakerType, // Default to unknown since we don't have speaker info
    }));
    
    setCaptions(loadedCaptions);
    setCurrentTranscript('');
  }, []);

  const loadCaptions = useCallback((captionsToLoad: Caption[]) => {
    if (!captionsToLoad || captionsToLoad.length === 0) return;
    
    // Load captions directly, preserving all information including speaker
    setCaptions(captionsToLoad);
    setCurrentTranscript('');
  }, []);

  const getRecentCaptions = useCallback((seconds: number = 10) => {
    const cutoffTime = Date.now() - (seconds * 1000);
    return captions.filter(caption => caption.timestamp >= cutoffTime);
  }, [captions]);

  const getAllText = useCallback(() => {
    return captions.map(c => c.text).join(' ');
  }, [captions]);

  const updateCaptionSpeaker = useCallback((captionId: string, speaker: SpeakerType) => {
    setCaptions(prev => 
      prev.map(caption => 
        caption.id === captionId 
          ? { ...caption, speaker }
          : caption
      )
    );
  }, []);

  const editCaption = useCallback((captionId: string, newText: string) => {
    setCaptions(prev => prev.map(caption => {
      if (caption.id === captionId) {
        return {
          ...caption,
          text: newText,
          isEdited: true,
          originalText: caption.originalText || caption.text,
        };
      }
      return caption;
    }));
  }, []);

  const addBookmark = useCallback((note?: string) => {
    const recentCaptions = getRecentCaptions(20);
    if (recentCaptions.length === 0) return null;
    
    const newBookmark: Bookmark = {
      id: `bookmark-${bookmarkIdRef.current++}`,
      timestamp: Date.now(),
      captions: recentCaptions,
      note,
    };
    setBookmarks(prev => [...prev, newBookmark]);
    return newBookmark;
  }, [getRecentCaptions]);

  const removeBookmark = useCallback((bookmarkId: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
  }, []);

  const clearBookmarks = useCallback(() => {
    setBookmarks([]);
  }, []);

  const changeSpeaker = useCallback((speaker: SpeakerType) => {
    setCurrentSpeaker(speaker);
  }, []);

  useEffect(() => {
    return () => {
      if (deepgramClientRef.current) {
        deepgramClientRef.current.stop();
      }
    };
  }, []);

  return {
    isListening,
    captions,
    currentTranscript,
    error,
    isSupported,
    currentSpeaker,
    detectedSpeaker,
    bookmarks,
    isConnected,
    startListening,
    stopListening,
    clearCaptions,
    getRecentCaptions,
    getAllText,
    updateCaptionSpeaker,
    editCaption,
    addBookmark,
    removeBookmark,
    clearBookmarks,
    changeSpeaker,
    loadCaptionsFromTranscript,
    loadCaptions,
  };
}
