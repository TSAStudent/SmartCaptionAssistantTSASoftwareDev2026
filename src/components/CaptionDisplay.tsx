'use client';

import { Caption, SpeakerType } from '@/types';
import { useEffect, useRef, useState } from 'react';
import { Edit2, Check, X, GraduationCap, User, Users, HelpCircle } from 'lucide-react';
import { SpeakerSelector, getSpeakerStyle } from './SpeakerSelector';

interface CaptionDisplayProps {
  captions: Caption[];
  currentTranscript: string;
  highlightedTerms: string[];
  fontSize: 'normal' | 'large' | 'extra-large';
  showReplayHighlight: boolean;
  replayCaptions: Caption[];
  onSpeakerChange?: (captionId: string, speaker: SpeakerType) => void;
  onEditCaption?: (captionId: string, newText: string) => void;
  editMode?: boolean;
  teacherOnlyMode?: boolean;
}

export function CaptionDisplay({
  captions,
  currentTranscript,
  highlightedTerms,
  fontSize,
  showReplayHighlight,
  replayCaptions,
  onSpeakerChange,
  onEditCaption,
  editMode = false,
  teacherOnlyMode = false,
}: CaptionDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Auto-scroll to bottom as new captions or transcript appear (after DOM update)
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      bottomAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
    return () => cancelAnimationFrame(raf);
  }, [captions, currentTranscript]);

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'large':
        return 'text-2xl';
      case 'extra-large':
        return 'text-3xl';
      default:
        return 'text-xl';
    }
  };

  const highlightText = (text: string) => {
    if (highlightedTerms.length === 0) {
      return text;
    }

    const regex = new RegExp(`(${highlightedTerms.join('|')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
      const isHighlighted = highlightedTerms.some(
        term => term.toLowerCase() === part.toLowerCase()
      );
      if (isHighlighted) {
        return (
          <span
            key={index}
            className="bg-yellow-300 dark:bg-yellow-600 px-1 rounded font-semibold"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const isReplayCaption = (caption: Caption) => {
    return showReplayHighlight && replayCaptions.some(rc => rc.id === caption.id);
  };

  const startEditing = (caption: Caption) => {
    setEditingId(caption.id);
    setEditText(caption.text);
  };

  const saveEdit = () => {
    if (editingId && onEditCaption && editText.trim()) {
      onEditCaption(editingId, editText.trim());
    }
    setEditingId(null);
    setEditText('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const getSpeakerIcon = (speaker: SpeakerType | undefined) => {
    switch (speaker) {
      case 'teacher':
        return <GraduationCap size={14} />;
      case 'student':
        return <User size={14} />;
      default:
        return null;
    }
  };

  // In teacher only mode, combine all teacher captions into one and append current transcript
  const processedCaptions = teacherOnlyMode && captions.length > 0
    ? (() => {
        const teacherCaptions = captions.filter(c => c.speaker === 'teacher');
        if (teacherCaptions.length > 0) {
          const combinedText = teacherCaptions.map(c => c.text).join(' ');
          // Append current transcript if it exists (for real-time updates)
          const fullText = currentTranscript 
            ? `${combinedText} ${currentTranscript}` 
            : combinedText;
          return [{
            ...teacherCaptions[teacherCaptions.length - 1],
            id: 'combined-teacher-caption',
            text: fullText,
          }];
        }
        // If no teacher captions yet but there's a current transcript, show it
        if (currentTranscript) {
          return [{
            id: 'temp-teacher-caption',
            text: currentTranscript,
            timestamp: Date.now(),
            isFinal: false,
            speaker: 'teacher' as SpeakerType,
          }];
        }
        return captions.slice(-50);
      })()
    : captions.slice(-50);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8 space-y-3 sm:space-y-4 md:space-y-5 scroll-smooth"
    >
      {processedCaptions.length === 0 && !currentTranscript && (
        <div className="flex flex-col items-center justify-center h-full min-h-[200px] sm:min-h-[300px] md:min-h-[400px] text-center space-y-3 sm:space-y-4 px-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center mb-2 sm:mb-3 md:mb-4">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <p className={`${getFontSizeClass()} font-semibold text-gray-500 dark:text-gray-400 px-2`}>
            Captions will appear here when you start listening...
          </p>
          <p className="text-sm sm:text-base text-gray-400 dark:text-gray-500 px-2">
            Click the microphone button to begin
          </p>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 px-2 mt-2 italic">
            Note: The first voice heard will be recorded as the teacher.
          </p>
        </div>
      )}

      {processedCaptions.map((caption, index) => {
        const speakerStyle = getSpeakerStyle(caption.speaker);
        const isEditing = editingId === caption.id;
        
        return (
          <div
            key={caption.id}
            className={`group animate-in fade-in slide-in-from-bottom-2 duration-500 ${getFontSizeClass()} leading-relaxed transition-all duration-300 ${
              isReplayCaption(caption)
                ? 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border-l-4 border-blue-500 shadow-lg shadow-blue-500/10'
                : caption.speaker && caption.speaker !== 'unknown'
                  ? `text-gray-800 dark:text-gray-100 p-3 sm:p-4 rounded-lg sm:rounded-xl border-l-4 ${speakerStyle.borderColor} hover:bg-gray-50/50 dark:hover:bg-gray-800/30 hover:shadow-md transition-all`
                  : 'text-gray-800 dark:text-gray-100 p-3 sm:p-4 rounded-lg sm:rounded-xl hover:bg-gray-50/50 dark:hover:bg-gray-800/30 hover:shadow-md transition-all'
            }`}
            style={{ 
              animationDelay: `${index * 50}ms`,
              lineHeight: teacherOnlyMode && caption.speaker === 'teacher' ? '1.5' : undefined
            }}
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2 flex-wrap">
              {caption.speaker && caption.speaker !== 'unknown' && (
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${speakerStyle.bgColor} ${speakerStyle.textColor}`}>
                  {getSpeakerIcon(caption.speaker)}
                  {speakerStyle.label}
                </span>
              )}
              {/* Speaker Selector (appears on hover) */}
              {onSpeakerChange && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <SpeakerSelector
                    currentSpeaker={caption.speaker || 'unknown'}
                    onChangeSpeaker={(speaker) => onSpeakerChange(caption.id, speaker)}
                    compact
                  />
                </div>
              )}
              {isReplayCaption(caption) && (
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2.5 py-1 rounded-full">
                  REPLAY
                </span>
              )}
              {caption.isEdited && (
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2.5 py-1 rounded-full">
                  Edited
                </span>
              )}
              {editMode && onEditCaption && !isEditing && (
                <button
                  onClick={() => startEditing(caption)}
                  className="opacity-0 group-hover:opacity-100 text-xs text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Edit caption"
                >
                  <Edit2 size={14} />
                </button>
              )}
            </div>
            
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={2}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveEdit}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-all"
                  >
                    <Check size={14} />
                    Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-all"
                  >
                    <X size={14} />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="font-medium">
                {highlightText(caption.text)}
                {/* Show blinking cursor for teacher-only mode when there's active transcription */}
                {teacherOnlyMode && caption.speaker === 'teacher' && currentTranscript && (
                  <span className="inline-block w-0.5 h-5 bg-blue-500 ml-1 animate-pulse"></span>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Only show "Speaking..." bubble when NOT in teacher-only mode and there's meaningful text */}
      {currentTranscript && !teacherOnlyMode && currentTranscript.trim().length > 1 && (
        <div
          className={`${getFontSizeClass()} leading-relaxed text-gray-600 dark:text-gray-300 italic p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-700/50 border border-gray-200 dark:border-gray-700 animate-pulse-subtle`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-200 dark:bg-gray-700 px-2.5 py-1 rounded-full">
              Speaking...
            </span>
          </div>
          <div className="font-medium">
            {highlightText(currentTranscript)}
            <span className="inline-block w-0.5 h-5 bg-blue-500 ml-1 animate-pulse"></span>
          </div>
        </div>
      )}

      {/* Anchor for auto-scroll: keeps view at latest caption */}
      <div ref={bottomAnchorRef} aria-hidden="true" className="h-0 w-full shrink-0" />
    </div>
  );
}
