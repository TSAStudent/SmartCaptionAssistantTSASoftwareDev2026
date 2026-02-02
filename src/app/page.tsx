'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession as useNextAuthSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FileText, AlertCircle, Bookmark, Edit2, Maximize2, Menu, X, BookOpen, Plus } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useSession } from '@/hooks/useSession';
import { CaptionDisplay } from '@/components/CaptionDisplay';
import { ControlPanel } from '@/components/ControlPanel';
import { NotesPanel } from '@/components/NotesPanel';
import { VocabularySelector } from '@/components/VocabularySelector';
import { Settings } from '@/components/Settings';
import { SessionPanel } from '@/components/SessionPanel';
import { FullScreenCaption } from '@/components/FullScreenCaption';
import { ChatBot } from '@/components/ChatBot';
import { ClassSidebar } from '@/components/ClassSidebar';
import { UserMenu } from '@/components/UserMenu';
import { AppSettings, VocabularyTopic, Caption } from '@/types';
import { isFirebaseConfigured } from '@/lib/firebase';
import { getUserData, setUserSettings } from '@/lib/firebaseUserData';

export default function Home() {
  const { data: authSession, status: authStatus } = useNextAuthSession();
  const router = useRouter();
  const [showSidebar, setShowSidebar] = useState(false); // Hidden by default
  const [sessionTitle, setSessionTitle] = useState('');
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  // Redirect to login if not authenticated and not in guest mode
  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      // Check if user has previously chosen guest mode
      const guestMode = localStorage.getItem('guestMode');
      if (!guestMode) {
        // Redirect to login page
        router.push('/login');
        return;
      }
    }
    // Allow access if authenticated or in guest mode
    if (authStatus !== 'loading') {
      setIsCheckingAccess(false);
    }
  }, [authStatus, router]);

  // Keep sidebar visible on desktop, toggleable on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setShowSidebar(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const defaultSettings: AppSettings = {
    darkMode: false,
    largeText: false,
    fontSize: 'normal',
    teacherOnlyMode: false,
  };

  const [settings, setSettings] = useState<AppSettings>(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('captionAssistantSettings');
      if (savedSettings) {
        try {
          return JSON.parse(savedSettings) as AppSettings;
        } catch {
          // Ignore parse errors
        }
      }
    }
    return defaultSettings;
  });

  // Hydrate from Firebase when user logs in (so data syncs across devices)
  useEffect(() => {
    if (typeof window === 'undefined' || authStatus !== 'authenticated' || !authSession?.user || !isFirebaseConfigured()) return;
    const userId = (authSession.user as { id?: string }).id || authSession.user.email || '';
    if (!userId) return;
    getUserData(userId).then((data) => {
      if (!data) return;
      if (data.settings) {
        setSettings(data.settings);
        localStorage.setItem('captionAssistantSettings', JSON.stringify(data.settings));
      }
      if (data.deepgramApiKey != null) {
        localStorage.setItem('deepgramApiKey', data.deepgramApiKey);
      }
      if (data.teacherVoiceProfile) {
        localStorage.setItem('teacherVoiceProfile', JSON.stringify(data.teacherVoiceProfile));
      }
    });
  }, [authStatus, authSession?.user]);

  // Persist settings: Firebase when logged in, localStorage for guest and for libs that read from it
  useEffect(() => {
    localStorage.setItem('captionAssistantSettings', JSON.stringify(settings));
    if (authStatus === 'authenticated' && authSession?.user && isFirebaseConfigured()) {
      const userId = (authSession.user as { id?: string }).id || authSession.user.email || '';
      if (userId) setUserSettings(userId, settings);
    }
  }, [settings, authStatus, authSession?.user]);

  const {
    isListening,
    captions,
    currentTranscript,
    error,
    isSupported,
    currentSpeaker,
    detectedSpeaker,
    bookmarks,
    startListening,
    stopListening,
    clearCaptions,
    getRecentCaptions,
    getAllText,
    updateCaptionSpeaker,
    editCaption,
    addBookmark,
    loadCaptionsFromTranscript,
    loadCaptions,
  } = useSpeechRecognition(settings.teacherOnlyMode || false);

  const {
    session,
    isHost,
    isConnected,
    remoteCaptions,
    remoteBookmarks,
    createSession,
    joinSession,
    endSession,
    broadcastCaption,
    broadcastBookmark,
  } = useSession();

  const [selectedTopic, setSelectedTopic] = useState<VocabularyTopic | null>(null);
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [showReplayHighlight, setShowReplayHighlight] = useState(false);
  const [replayCaptions, setReplayCaptions] = useState<Caption[]>([]);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [isViewingSavedSession, setIsViewingSavedSession] = useState(false);

  // Combine local and remote captions for display
  const displayCaptions = session && !isHost ? remoteCaptions : captions;
  const displayBookmarks = session && !isHost ? remoteBookmarks : bookmarks;

  // Get full transcript for saving
  const fullTranscript = getAllText();

  // Handle session save
  const handleSaveSession = useCallback((classId: string, title: string) => {
    setSessionTitle(title);
    // Session is saved in ClassSidebar component
  }, []);

  // Handle clearing session after save
  const handleClearSession = useCallback(() => {
    clearCaptions();
    setSessionTitle('');
    setIsViewingSavedSession(false);
  }, [clearCaptions]);

  // Handle loading a saved session
  const handleLoadSession = useCallback((captions: Caption[]) => {
    // Load captions directly, preserving speaker information
    if (captions && captions.length > 0) {
      console.log('Loading session, setting isViewingSavedSession to true, captions:', captions.length);
      setIsViewingSavedSession(true); // Mark that we're viewing a saved session FIRST
      loadCaptions(captions);
    } else {
      console.log('No captions to load');
    }
  }, [loadCaptions]);

  // Debug: Log when isViewingSavedSession changes
  useEffect(() => {
    console.log('isViewingSavedSession changed to:', isViewingSavedSession);
  }, [isViewingSavedSession]);

  // Handle creating a new session (clearing loaded session)
  const handleCreateNewSession = useCallback(() => {
    clearCaptions();
    setSessionTitle('');
    setIsViewingSavedSession(false);
  }, [clearCaptions]);

  // Wrap startListening to reset saved session flag when starting new session
  const handleStartListening = useCallback(() => {
    setIsViewingSavedSession(false);
    startListening();
  }, [startListening]);

  // Broadcast captions when host is listening
  useEffect(() => {
    if (isHost && captions.length > 0) {
      const latestCaption = captions[captions.length - 1];
      if (latestCaption.isFinal) {
        broadcastCaption(latestCaption);
      }
    }
  }, [captions, isHost, broadcastCaption]);

  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  const handleWaitWhat = useCallback(() => {
    const recent = getRecentCaptions(10);
    setReplayCaptions(recent);
    setShowReplayHighlight(true);
    
    setTimeout(() => {
      setShowReplayHighlight(false);
      setReplayCaptions([]);
    }, 5000);
  }, [getRecentCaptions]);

  const handleAddBookmark = useCallback(() => {
    const bookmark = addBookmark();
    if (bookmark && isHost) {
      broadcastBookmark(bookmark);
    }
  }, [addBookmark, isHost, broadcastBookmark]);

  const highlightedTerms= selectedTopic
    ? selectedTopic.terms.map((t) => t.term)
    : [];

  // Show loading state while checking auth or access
  if (authStatus === 'loading' || isCheckingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${settings.darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-slate-900 transition-all duration-500">
        {/* Header with glassmorphism */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-800/50 shadow-lg shadow-gray-200/20 dark:shadow-black/20">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5">
            <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-3 md:gap-4">
              <div className="flex items-center gap-3">
                {/* Hamburger Menu - Always visible for logged-in users */}
                {authSession?.user && (
                  <button
                    onClick={() => setShowSidebar(!showSidebar)}
                    className="p-2.5 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 group"
                    aria-label="Toggle sidebar"
                  >
                    <div className="flex flex-col gap-1.5 w-6">
                      <span className={`h-0.5 w-full bg-gray-700 dark:bg-gray-300 rounded-full transition-all duration-300 ${showSidebar ? 'rotate-45 translate-y-2' : ''}`}></span>
                      <span className={`h-0.5 w-full bg-gray-700 dark:bg-gray-300 rounded-full transition-all duration-300 ${showSidebar ? 'opacity-0' : ''}`}></span>
                      <span className={`h-0.5 w-full bg-gray-700 dark:bg-gray-300 rounded-full transition-all duration-300 ${showSidebar ? '-rotate-45 -translate-y-2' : ''}`}></span>
                    </div>
                  </button>
                )}
                <div className="space-y-0.5 sm:space-y-1 flex-1 min-w-0">
                  <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent truncate">
                    Smart Classroom Caption Assistant
                  </h1>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 hidden sm:block">
                    Live captions, instant replay, and auto-generated notes
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <SessionPanel
                  session={session}
                  isHost={isHost}
                  isConnected={isConnected}
                  onCreateSession={createSession}
                  onJoinSession={joinSession}
                  onLeaveSession={endSession}
                />
                <VocabularySelector
                  selectedTopic={selectedTopic}
                  onSelectTopic={setSelectedTopic}
                />
                <button
                  onClick={() => setShowNotesPanel(true)}
                  className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl transition-all duration-300 font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-105 active:scale-95"
                >
                  <FileText size={18} className="group-hover:rotate-12 transition-transform" />
                  <span className="hidden sm:inline">Notes</span>
                </button>
                <button
                  onClick={() => setShowFullScreen(true)}
                  className="group flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                  title="Full-screen caption mode"
                >
                  <Maximize2 size={18} />
                </button>
                <Settings settings={settings} onSettingsChange={setSettings} />
                {authSession?.user && <UserMenu />}
              </div>
            </div>
          </div>
        </header>

        <main className={`flex-1 max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 flex flex-col gap-3 sm:gap-4 md:gap-6 pb-24 sm:pb-28 md:pb-32 transition-all duration-300 ${showSidebar && authSession?.user ? 'lg:ml-80' : ''}`}>
          {/* Error Alert */}
          {error && (
            <div className="animate-in slide-in-from-top-2 duration-300 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-l-4 border-red-500 rounded-xl p-3 sm:p-4 md:p-5 flex items-center gap-2 sm:gap-3 md:gap-4 shadow-lg shadow-red-500/10">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertCircle className="text-red-600 dark:text-red-400" size={20} />
              </div>
              <p className="text-red-800 dark:text-red-200 font-medium text-sm sm:text-base">{error}</p>
            </div>
          )}

          {/* Browser Support Warning */}
          {!isSupported && (
            <div className="animate-in slide-in-from-top-2 duration-300 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-l-4 border-amber-500 rounded-xl p-3 sm:p-4 md:p-5 flex items-start gap-2 sm:gap-3 md:gap-4 shadow-lg shadow-amber-500/10">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <AlertCircle className="text-amber-600 dark:text-amber-400" size={20} />
              </div>
              <div>
                <p className="text-amber-800 dark:text-amber-200 font-bold text-sm sm:text-base mb-1">
                  Browser Not Supported
                </p>
                <p className="text-amber-700 dark:text-amber-300 text-xs sm:text-sm">
                  Please use Google Chrome or Microsoft Edge for speech recognition.
                </p>
              </div>
            </div>
          )}

          {/* Vocabulary Mode Badge */}
          {selectedTopic && (
            <div className="animate-in slide-in-from-top-2 duration-300 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 dark:from-purple-500/20 dark:to-indigo-500/20 border border-purple-300/50 dark:border-purple-600/50 rounded-2xl p-4 flex items-center gap-3 backdrop-blur-sm shadow-lg">
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
              <span className="text-purple-700 dark:text-purple-300 text-sm font-semibold">
                <strong className="font-extrabold">Vocabulary Mode:</strong> {selectedTopic.name} - Terms will be
                highlighted when detected
              </span>
            </div>
          )}

          {/* Replay Highlight Badge */}
          {showReplayHighlight && replayCaptions.length > 0 && (
            <div className="animate-in slide-in-from-top-2 duration-300 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20 border border-blue-300/50 dark:border-blue-600/50 rounded-2xl p-4 flex items-center gap-3 backdrop-blur-sm shadow-lg">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              <span className="text-blue-700 dark:text-blue-300 text-sm font-semibold">
                <strong className="font-extrabold">Replay:</strong> Showing the last 10 seconds of captions
                (highlighted in blue below)
              </span>
            </div>
          )}

          {/* Main Caption Card */}
          <div className="flex-1 flex flex-col bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl shadow-gray-900/10 dark:shadow-black/30 border border-gray-200/50 dark:border-gray-700/50 overflow-hidden min-w-0">
            {/* Caption Tools Bar */}
            <div className="flex items-center justify-between gap-2 sm:gap-3 md:gap-4 p-2 sm:p-3 md:p-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-gray-50/80 to-white/80 dark:from-gray-800/80 dark:to-gray-800/80 flex-wrap">
              {/* Save to Class / Create New Session Button - Only for logged-in users */}
              {authSession?.user && (fullTranscript || isViewingSavedSession || captions.length > 0) && (
                <>
                  {isViewingSavedSession ? (
                    <button
                      onClick={handleCreateNewSession}
                      className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-105 active:scale-95"
                      title="Create a new session"
                    >
                      <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                      <span className="hidden sm:inline">Create New Session</span>
                    </button>
                  ) : fullTranscript ? (
                    <button
                      onClick={() => setShowSidebar(true)}
                      className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105 active:scale-95"
                      title="Save this session to a class"
                    >
                      <BookOpen size={16} className="group-hover:rotate-12 transition-transform" />
                      <span className="hidden sm:inline">Save to Class</span>
                    </button>
                  ) : null}
                </>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={handleAddBookmark}
                  disabled={displayCaptions.length === 0}
                  className={`group flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                    displayCaptions.length === 0
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg shadow-red-500/30 hover:shadow-xl hover:scale-105 active:scale-95'
                  }`}
                  title="Bookmark this moment for later review"
                >
                  <Bookmark size={16} />
                  <span className="hidden sm:inline">Bookmark</span>
                </button>
                <button
                  onClick={() => setEditMode(!editMode)}
                  className={`group flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                    editMode
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                  title="Toggle caption editing mode"
                >
                  <Edit2 size={16} />
                  <span className="hidden sm:inline">{editMode ? 'Editing' : 'Edit'}</span>
                </button>
                {displayBookmarks.length > 0 && (
                  <span className="text-sm text-gray-500 dark:text-gray-400 px-2">
                    {displayBookmarks.length} bookmark{displayBookmarks.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col relative">
              {/* Decorative gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
              <CaptionDisplay
                captions={displayCaptions}
                currentTranscript={session && !isHost ? '' : currentTranscript}
                highlightedTerms={highlightedTerms}
                fontSize={settings.fontSize}
                showReplayHighlight={showReplayHighlight}
                replayCaptions={replayCaptions}
                onSpeakerChange={updateCaptionSpeaker}
                onEditCaption={editCaption}
                editMode={editMode}
                teacherOnlyMode={settings.teacherOnlyMode || false}
              />
            </div>

            {/* Control Panel with gradient border */}
            <div className="relative border-t border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-gray-50/50 via-white/50 to-gray-50/50 dark:from-gray-800/50 dark:via-gray-800/50 dark:to-gray-800/50 backdrop-blur-sm">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
              <ControlPanel
                isListening={isListening}
                isSupported={isSupported}
                onStartListening={handleStartListening}
                onStopListening={stopListening}
                onWaitWhat={handleWaitWhat}
                onClear={() => {
                  clearCaptions();
                  setIsViewingSavedSession(false);
                }}
                showReplayHighlight={showReplayHighlight}
              />
            </div>
          </div>

          {/* Status Bar */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
              {isListening ? (
                <span className="flex items-center justify-center gap-3 text-gray-700 dark:text-gray-200 font-medium">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  <span className="font-semibold">Listening...</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">Speak clearly into your microphone</span>
                </span>
              ) : (
                <span className="text-gray-600 dark:text-gray-300 font-medium">
                  Click the microphone button to start live captioning
                </span>
              )}
            </div>
            <div className="flex items-center justify-center gap-3 sm:gap-4 md:gap-6 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-lg sm:rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                <span className="text-gray-500 dark:text-gray-400 font-medium">Captions:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{captions.length}</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-lg sm:rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                <span className="text-gray-500 dark:text-gray-400 font-medium">Words:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {getAllText().split(' ').filter((w) => w).length}
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>

      <NotesPanel
        transcript={getAllText()}
        selectedTopic={selectedTopic || undefined}
        isOpen={showNotesPanel}
        onClose={() => setShowNotesPanel(false)}
        bookmarks={displayBookmarks}
      />

      {showFullScreen && (
        <FullScreenCaption
          captions={displayCaptions}
          currentTranscript={session && !isHost ? '' : currentTranscript}
          onClose={() => setShowFullScreen(false)}
          settings={settings}
        />
      )}

      {/* AI Chatbot - Floating in bottom corner */}
      <ChatBot />

      {/* Blur Overlay when sidebar is open */}
      {showSidebar && authSession?.user && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:z-40 transition-opacity duration-300"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Class Sidebar for logged-in users */}
      {authSession?.user && (
        <ClassSidebar
          isOpen={showSidebar}
          onClose={() => setShowSidebar(false)}
          currentSessionTitle={sessionTitle}
          currentTranscript={fullTranscript}
          currentCaptions={captions}
          onSaveSession={handleSaveSession}
          onClearSession={handleClearSession}
          onLoadSession={handleLoadSession}
        />
      )}

    </div>
  );
}
