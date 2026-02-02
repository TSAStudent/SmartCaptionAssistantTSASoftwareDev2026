'use client';

import { Mic, MicOff, RotateCcw, Trash2 } from 'lucide-react';

interface ControlPanelProps {
  isListening: boolean;
  isSupported: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  onWaitWhat: () => void;
  onClear: () => void;
  showReplayHighlight: boolean;
}

export function ControlPanel({
  isListening,
  isSupported,
  onStartListening,
  onStopListening,
  onWaitWhat,
  onClear,
  showReplayHighlight,
}: ControlPanelProps) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-5 p-3 sm:p-4 md:p-6">
      {/* Main Microphone Button */}
      <button
        onClick={isListening ? onStopListening : onStartListening}
        disabled={!isSupported}
        className={`
          group relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full transition-all duration-500
          ${
            isListening
              ? 'bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-2xl shadow-red-500/40'
              : 'bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-2xl shadow-blue-500/40'
          }
          ${!isSupported ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-110 active:scale-95'}
          text-white
          ${isListening ? 'animate-pulse-subtle' : ''}
        `}
        title={isListening ? 'Stop listening' : 'Start listening'}
      >
        {isListening && (
          <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75"></span>
        )}
        <div className="relative z-10">
          {isListening ? <MicOff size={24} className="sm:w-7 sm:h-7 md:w-8 md:h-8 group-hover:scale-110 transition-transform" /> : <Mic size={24} className="sm:w-7 sm:h-7 md:w-8 md:h-8 group-hover:scale-110 transition-transform" />}
        </div>
      </button>

      {/* Wait What Button */}
      <button
        onClick={onWaitWhat}
        className={`
          group flex items-center gap-1.5 sm:gap-2 md:gap-2.5 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3.5 rounded-xl sm:rounded-2xl transition-all duration-300 font-semibold text-sm sm:text-base
          ${
            showReplayHighlight
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-xl shadow-blue-500/30'
              : 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40'
          }
          hover:scale-105 active:scale-95
        `}
        title="Show last 10 seconds of captions"
      >
        <RotateCcw size={18} className={`sm:w-5 sm:h-5 transition-transform ${showReplayHighlight ? 'animate-spin' : 'group-hover:rotate-180'}`} />
        <span className="hidden sm:inline">Wait—what?</span>
      </button>

      {/* Clear Button */}
      <button
        onClick={onClear}
        className="
          group flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3.5 rounded-xl sm:rounded-2xl transition-all duration-300
          bg-gradient-to-r from-gray-500 to-slate-600 hover:from-gray-600 hover:to-slate-700 text-white
          shadow-lg shadow-gray-500/30 hover:shadow-xl hover:shadow-gray-500/40
          hover:scale-105 active:scale-95 font-semibold text-sm sm:text-base
        "
        title="Clear all captions"
      >
        <Trash2 size={18} className="sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
        <span className="hidden sm:inline">Clear</span>
      </button>
    </div>
  );
}
