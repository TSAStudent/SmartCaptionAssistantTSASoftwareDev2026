'use client';

import { SpeakerType } from '@/types';
import { User, GraduationCap, HelpCircle, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface SpeakerSelectorProps {
  currentSpeaker: SpeakerType;
  onChangeSpeaker: (speaker: SpeakerType) => void;
  disabled?: boolean;
  compact?: boolean;
}

const speakerConfig: Record<SpeakerType, { label: string; color: string; bgColor: string; icon: typeof User; gradient: string }> = {
  teacher: {
    label: 'Teacher',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700',
    icon: GraduationCap,
    gradient: 'from-blue-500 to-indigo-600',
  },
  student: {
    label: 'Student',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700',
    icon: User,
    gradient: 'from-green-500 to-emerald-600',
  },
  unknown: {
    label: 'Unknown',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30 border-gray-300 dark:border-gray-700',
    icon: HelpCircle,
    gradient: 'from-gray-500 to-slate-600',
  },
};

export function SpeakerSelector({
  currentSpeaker,
  onChangeSpeaker,
  disabled = false,
  compact = false,
}: SpeakerSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const speakers: SpeakerType[] = ['teacher', 'student'];

  if (compact) {
    const currentConfig = speakerConfig[currentSpeaker];
    const Icon = currentConfig.icon;

    return (
      <div className="relative">
        <button
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gradient-to-r ${currentConfig.gradient} text-white text-xs font-semibold hover:opacity-90 transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={`Change speaker (currently: ${currentConfig.label})`}
        >
          <Icon size={12} />
          <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && !disabled && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute top-full left-0 mt-1 z-40 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden min-w-[140px]">
              {speakers.map((speaker) => {
                const config = speakerConfig[speaker];
                const OptionIcon = config.icon;
                return (
                  <button
                    key={speaker}
                    onClick={() => {
                      onChangeSpeaker(speaker);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all ${
                      currentSpeaker === speaker
                        ? `bg-gradient-to-r ${config.gradient} text-white`
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <OptionIcon size={14} />
                    {config.label}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mr-1">Speaker:</span>
      <div className="flex gap-1.5">
        {speakers.map((speaker) => {
          const config = speakerConfig[speaker];
          const Icon = config.icon;
          const isActive = currentSpeaker === speaker;

          return (
            <button
              key={speaker}
              onClick={() => !disabled && onChangeSpeaker(speaker)}
              disabled={disabled}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                transition-all duration-200 border
                ${isActive
                  ? `${config.bgColor} ${config.color} shadow-sm`
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              title={`Set speaker to ${config.label}`}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{config.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function getSpeakerStyle(speaker: SpeakerType | undefined) {
  if (!speaker || speaker === 'unknown') {
    return {
      borderColor: 'border-l-gray-400',
      bgColor: '',
      label: '',
      textColor: '',
    };
  }
  
  const config = speakerConfig[speaker];
  return {
    borderColor: speaker === 'teacher' 
      ? 'border-l-blue-500' 
      : 'border-l-green-500',
    bgColor: config.bgColor,
    label: config.label,
    textColor: config.color,
  };
}
