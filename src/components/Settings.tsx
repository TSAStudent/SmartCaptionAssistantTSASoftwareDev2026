'use client';

import { useState } from 'react';
import { Settings as SettingsIcon, Moon, Sun, Type, X, GraduationCap } from 'lucide-react';
import { AppSettings } from '@/types';

interface SettingsProps {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}

export function Settings({ settings, onSettingsChange }: SettingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDarkModeToggle = () => {
    onSettingsChange({
      ...settings,
      darkMode: !settings.darkMode,
    });
  };

  const handleFontSizeChange = (fontSize: 'normal' | 'large' | 'extra-large') => {
    onSettingsChange({
      ...settings,
      fontSize,
      largeText: fontSize !== 'normal',
    });
  };

  const handleTeacherOnlyModeToggle = () => {
    onSettingsChange({
      ...settings,
      teacherOnlyMode: !settings.teacherOnlyMode,
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group p-2.5 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
        title="Settings"
      >
        <SettingsIcon size={22} className="text-gray-700 dark:text-gray-300 group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-3 w-80 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 z-50 overflow-hidden animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200/50 dark:border-gray-700/50">
              <h3 className="font-extrabold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Accessibility Settings
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:scale-110 transition-transform rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-6">
              {/* Dark Mode Toggle */}
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="flex items-center gap-3 text-gray-700 dark:text-gray-300 font-semibold">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 group-hover:scale-110 transition-transform">
                      {settings.darkMode ? <Moon size={20} className="text-indigo-600 dark:text-indigo-400" /> : <Sun size={20} className="text-amber-500" />}
                    </div>
                    Dark Mode
                  </span>
                  <div
                    className={`relative w-14 h-7 rounded-full transition-all duration-300 cursor-pointer ${
                      settings.darkMode 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30' 
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                    onClick={handleDarkModeToggle}
                  >
                    <div
                      className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-300 ${
                        settings.darkMode ? 'translate-x-7' : 'translate-x-0.5'
                      }`}
                    />
                  </div>
                </label>
              </div>

              {/* Font Size Selector */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300 font-semibold">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
                    <Type size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <span>Text Size</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleFontSizeChange('normal')}
                    className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      settings.fontSize === 'normal'
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-105'
                    }`}
                  >
                    Normal
                  </button>
                  <button
                    onClick={() => handleFontSizeChange('large')}
                    className={`py-3 px-4 rounded-xl text-base font-semibold transition-all duration-300 ${
                      settings.fontSize === 'large'
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-105'
                    }`}
                  >
                    Large
                  </button>
                  <button
                    onClick={() => handleFontSizeChange('extra-large')}
                    className={`py-3 px-4 rounded-xl text-lg font-semibold transition-all duration-300 ${
                      settings.fontSize === 'extra-large'
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-105'
                    }`}
                  >
                    XL
                  </button>
                </div>
              </div>

              {/* Teacher Only Mode Toggle */}
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="flex items-center gap-3 text-gray-700 dark:text-gray-300 font-semibold">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 group-hover:scale-110 transition-transform">
                      <GraduationCap size={20} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    Teacher Only Mode
                  </span>
                  <div
                    className={`relative w-14 h-7 rounded-full transition-all duration-300 cursor-pointer ${
                      settings.teacherOnlyMode 
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30' 
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                    onClick={handleTeacherOnlyModeToggle}
                  >
                    <div
                      className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-300 ${
                        settings.teacherOnlyMode ? 'translate-x-7' : 'translate-x-0.5'
                      }`}
                    />
                  </div>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 ml-12">
                  When enabled, all detected voices will be automatically labeled as "teacher"
                </p>
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  These settings help make the app more accessible for users with
                  visual impairments or those who prefer larger text.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
