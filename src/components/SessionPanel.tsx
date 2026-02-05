'use client';

import { useState } from 'react';
import { Users, Copy, X, Wifi, WifiOff } from 'lucide-react';
import { Session } from '@/types';

interface SessionPanelProps {
  session: Session | null;
  isHost: boolean;
  isConnected: boolean;
  sessionError?: string | null;
  onClearSessionError?: () => void;
  onCreateSession: () => Promise<Session | null>;
  onJoinSession: (code: string) => Promise<boolean>;
  onLeaveSession: () => Promise<void>;
}

export function SessionPanel({
  session,
  isHost,
  isConnected,
  sessionError,
  onClearSessionError,
  onCreateSession,
  onJoinSession,
  onLeaveSession,
}: SessionPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreateSession = async () => {
    setIsLoading(true);
    await onCreateSession();
    setIsLoading(false);
  };

  const handleJoinSession = async () => {
    if (!joinCode.trim()) return;
    setIsLoading(true);
    await onJoinSession(joinCode.trim());
    setIsLoading(false);
  };

  const handleCopyCode = async () => {
    if (session?.code) {
      await navigator.clipboard.writeText(session.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEndSession = async () => {
    await onLeaveSession();
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:scale-105 active:scale-95 ${
          isConnected
            ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-green-500/30'
            : 'bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-violet-500/30'
        }`}
      >
        {isConnected ? (
          <Wifi size={18} className="group-hover:scale-110 transition-transform" />
        ) : (
          <Users size={18} className="group-hover:scale-110 transition-transform" />
        )}
        <span className="hidden sm:inline">
          {isConnected ? `Session: ${session?.code}` : 'Share Session'}
        </span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto min-h-screen animate-in fade-in duration-200">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 w-full max-w-md overflow-hidden my-4 sm:my-8 max-h-[calc(100vh-2rem)] flex flex-col animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between p-4 sm:p-6 shrink-0 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200/50 dark:border-gray-700/50">
              <h2 className="text-xl font-extrabold bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
                  <Users size={20} className="text-white" />
                </div>
                Session Sharing
              </h2>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onClearSessionError?.();
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl hover:scale-110 transition-transform rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700 w-9 h-9 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1 min-h-0">
              {sessionError && (
                <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300">
                  {sessionError}
                </div>
              )}
              {!isConnected ? (
                <>
                  <div className="space-y-3">
                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 text-sm font-bold">1</span>
                      Start a New Session (Teacher)
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 ml-8">
                      Create a session and share the code with students so they can see live captions on their devices.
                    </p>
                    <button
                      onClick={handleCreateSession}
                      disabled={isLoading}
                      className="w-full py-3 px-4 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-violet-500/30 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Creating...' : 'Start Session'}
                    </button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white dark:bg-gray-800 text-gray-500">or</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-sm font-bold">2</span>
                      Join a Session (Student)
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 ml-8">
                      Enter the session code from your teacher to view live captions.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        placeholder="Enter code (e.g., ABC123)"
                        maxLength={6}
                        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-lg tracking-wider text-center uppercase"
                      />
                      <button
                        onClick={handleJoinSession}
                        disabled={isLoading || !joinCode.trim()}
                        className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? '...' : 'Join'}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-semibold">
                      <Wifi size={16} />
                      {isHost ? 'Hosting Session' : 'Connected to Session'}
                    </div>
                    
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-2xl p-6 space-y-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Session Code</p>
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-4xl font-mono font-bold tracking-[0.3em] text-gray-800 dark:text-white">
                          {session?.code}
                        </span>
                        <button
                          onClick={handleCopyCode}
                          className="p-2 rounded-lg bg-white dark:bg-gray-600 shadow hover:shadow-md transition-all"
                          title="Copy code"
                        >
                          <Copy size={18} className={copied ? 'text-green-500' : 'text-gray-500'} />
                        </button>
                      </div>
                      {copied && (
                        <p className="text-sm text-green-600 dark:text-green-400 font-medium">Copied!</p>
                      )}
                    </div>

                    {isHost && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-300">
                        <p className="font-semibold mb-1">Share this code with your students</p>
                        <p>They can join at the same URL and enter this code to see live captions.</p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleEndSession}
                    className="w-full py-3 px-4 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"
                  >
                    <WifiOff size={18} />
                    {isHost ? 'End Session' : 'Leave Session'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
