'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Key, Check, X, AlertCircle } from 'lucide-react';
import { setDeepgramApiKey, clearDeepgramApiKey } from '@/lib/deepgramClient';
import { isFirebaseConfigured } from '@/lib/firebase';
import { setUserDeepgramApiKey } from '@/lib/firebaseUserData';

interface DeepgramSetupProps {
  onSetupComplete: (apiKey: string) => void;
  onSkip: () => void;
  existingApiKey: string | null;
}

export function DeepgramSetup({
  onSetupComplete,
  onSkip,
  existingApiKey,
}: DeepgramSetupProps) {
  const { data: session } = useSession();
  const [apiKey, setApiKey] = useState(existingApiKey || '');
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (existingApiKey) {
      setApiKey(existingApiKey);
    }
  }, [existingApiKey]);

  const handleSubmit = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your Deepgram API key');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      setDeepgramApiKey(apiKey.trim());
      if (session?.user && isFirebaseConfigured()) {
        const userId = (session.user as { id?: string }).id || session.user.email || '';
        if (userId) await setUserDeepgramApiKey(userId, apiKey.trim());
      }
      onSetupComplete(apiKey.trim());
    } catch {
      setError('Failed to save API key');
    } finally {
      setIsValidating(false);
    }
  };

  const handleClear = () => {
    clearDeepgramApiKey();
    setApiKey('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
          <h2 className="text-xl font-bold text-white">Deepgram API Setup</h2>
          <p className="text-green-100 text-sm mt-1">
            Configure Deepgram for world-class speaker identification
          </p>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="text-center space-y-2">
              <div className="w-20 h-20 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Key className="w-10 h-10 text-green-600" />
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Deepgram provides industry-leading real-time speaker diarization.
                The first speaker will be identified as the teacher.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Deepgram API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Deepgram API key"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Get your API key at{' '}
                <a
                  href="https://deepgram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:underline"
                >
                  deepgram.com
                </a>
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            {existingApiKey ? (
              <>
                <button
                  onClick={handleClear}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-all"
                >
                  <X className="w-5 h-5" />
                  Clear
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isValidating}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50"
                >
                  <Check className="w-5 h-5" />
                  {isValidating ? 'Saving...' : 'Update'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onSkip}
                  className="px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-all"
                >
                  Skip
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isValidating || !apiKey.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50"
                >
                  <Check className="w-5 h-5" />
                  {isValidating ? 'Saving...' : 'Save & Continue'}
                </button>
              </>
            )}
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-blue-700 dark:text-blue-300 text-xs">
              <strong>How it works:</strong> Deepgram automatically detects different speakers in real-time.
              The first person to speak will be identified as the teacher, and any other voices will be labeled as students.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
