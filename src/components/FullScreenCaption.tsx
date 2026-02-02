'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Settings, Type } from 'lucide-react';
import { Caption, AppSettings } from '@/types';
import { getSpeakerStyle } from './SpeakerSelector';

interface FullScreenCaptionProps {
  captions: Caption[];
  currentTranscript: string;
  onClose: () => void;
  settings: AppSettings;
}

export function FullScreenCaption({
  captions,
  currentTranscript,
  onClose,
  settings: initialSettings,
}: FullScreenCaptionProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(initialSettings);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [captions, currentTranscript]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const getFontSize = () => {
    switch (settings.fontSize) {
      case 'extra-large': return 'text-5xl md:text-6xl';
      case 'large': return 'text-4xl md:text-5xl';
      default: return 'text-3xl md:text-4xl';
    }
  };

  const getLineSpacing = () => {
    switch (settings.lineSpacing) {
      case 'loose': return 'leading-loose';
      case 'relaxed': return 'leading-relaxed';
      default: return 'leading-normal';
    }
  };

  const getFontFamily = () => {
    switch (settings.fontFamily) {
      case 'dyslexic': return 'font-sans'; // Would use OpenDyslexic if available
      case 'mono': return 'font-mono';
      default: return 'font-sans';
    }
  };

  const displayCaptions = captions.slice(-10);

  return (
    <div 
      className={`fixed inset-0 z-[100] transition-colors duration-300 ${
        settings.highContrast 
          ? 'bg-black' 
          : settings.darkMode 
            ? 'bg-gray-900' 
            : 'bg-white'
      }`}
    >
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-3 rounded-full transition-all ${
            settings.highContrast
              ? 'bg-yellow-400 text-black hover:bg-yellow-300'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
          title="Settings"
        >
          <Settings size={24} />
        </button>
        <button
          onClick={onClose}
          className={`p-3 rounded-full transition-all ${
            settings.highContrast
              ? 'bg-yellow-400 text-black hover:bg-yellow-300'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
          title="Exit Full Screen (Esc)"
        >
          <X size={24} />
        </button>
      </div>

      {showSettings && (
        <div className={`absolute top-20 right-4 p-4 rounded-2xl shadow-2xl z-20 w-72 ${
          settings.highContrast
            ? 'bg-yellow-400 text-black'
            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white'
        }`}>
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Type size={18} />
            Display Settings
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Text Size</label>
              <select
                value={settings.fontSize}
                onChange={(e) => setSettings({ ...settings, fontSize: e.target.value as AppSettings['fontSize'] })}
                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              >
                <option value="normal">Normal</option>
                <option value="large">Large</option>
                <option value="extra-large">Extra Large</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Line Spacing</label>
              <select
                value={settings.lineSpacing || 'normal'}
                onChange={(e) => setSettings({ ...settings, lineSpacing: e.target.value as AppSettings['lineSpacing'] })}
                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              >
                <option value="normal">Normal</option>
                <option value="relaxed">Relaxed</option>
                <option value="loose">Loose</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Font</label>
              <select
                value={settings.fontFamily || 'default'}
                onChange={(e) => setSettings({ ...settings, fontFamily: e.target.value as AppSettings['fontFamily'] })}
                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              >
                <option value="default">Default</option>
                <option value="mono">Monospace</option>
                <option value="dyslexic">Dyslexia-Friendly</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">High Contrast</label>
              <button
                onClick={() => setSettings({ ...settings, highContrast: !settings.highContrast })}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.highContrast ? 'bg-black' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${
                  settings.highContrast ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className={`h-full overflow-y-auto p-8 md:p-16 flex flex-col justify-end ${getFontFamily()}`}
      >
        <div className="space-y-6 max-w-5xl mx-auto w-full">
          {displayCaptions.map((caption, index) => {
            const speakerStyle = getSpeakerStyle(caption.speaker);
            const isLatest = index === displayCaptions.length - 1;
            
            return (
              <div
                key={caption.id}
                className={`
                  ${getFontSize()} ${getLineSpacing()} font-medium
                  transition-all duration-500
                  ${isLatest ? 'opacity-100' : 'opacity-60'}
                  ${caption.speaker && caption.speaker !== 'unknown' ? `border-l-4 pl-4 ${speakerStyle.borderColor}` : ''}
                  ${settings.highContrast
                    ? 'text-yellow-400'
                    : settings.darkMode
                      ? 'text-white'
                      : 'text-gray-900'
                  }
                `}
              >
                {caption.speaker && caption.speaker !== 'unknown' && (
                  <span className={`text-base font-bold uppercase tracking-wider mb-2 block ${
                    settings.highContrast ? 'text-yellow-200' : speakerStyle.textColor
                  }`}>
                    {speakerStyle.label}
                  </span>
                )}
                {caption.text}
              </div>
            );
          })}

          {currentTranscript && (
            <div
              className={`
                ${getFontSize()} ${getLineSpacing()} font-medium
                animate-pulse
                ${settings.highContrast
                  ? 'text-yellow-200'
                  : settings.darkMode
                    ? 'text-gray-400'
                    : 'text-gray-500'
                }
              `}
            >
              {currentTranscript}
              <span className={`inline-block w-1 h-8 ml-2 animate-pulse ${
                settings.highContrast ? 'bg-yellow-400' : 'bg-blue-500'
              }`} />
            </div>
          )}

          {displayCaptions.length === 0 && !currentTranscript && (
            <div className={`text-center ${getFontSize()} ${
              settings.highContrast
                ? 'text-yellow-400/50'
                : settings.darkMode
                  ? 'text-gray-600'
                  : 'text-gray-400'
            }`}>
              Captions will appear here...
            </div>
          )}
        </div>
      </div>

      <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 text-sm ${
        settings.highContrast ? 'text-yellow-400/70' : 'text-gray-500'
      }`}>
        Press ESC to exit full screen
      </div>
    </div>
  );
}
