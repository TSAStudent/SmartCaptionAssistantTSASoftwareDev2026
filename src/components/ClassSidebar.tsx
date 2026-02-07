'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  BookOpen,
  Plus,
  X,
  ChevronRight,
  ChevronDown,
  Calendar,
  FileText,
  Edit2,
  Trash2,
  Save,
} from 'lucide-react';
import { isFirebaseConfigured } from '@/lib/firebase';
import { getUserClasses, setUserClasses, type UserClassesItem } from '@/lib/firebaseUserData';

export interface Class {
  id: string;
  name: string;
  sessions: Session[];
  createdAt: string;
}

import { Caption } from '@/types';

export interface ChatMessageSaved {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string; // ISO string for serialization
}

export interface Session {
  id: string;
  title: string;
  classId: string;
  createdAt: string;
  transcript?: string; // Keep for backward compatibility
  captions?: Caption[]; // Store full captions with speaker info
  chatMessages?: ChatMessageSaved[]; // AI chat during this session
}

interface ClassSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentSessionTitle?: string;
  currentTranscript?: string;
  currentCaptions?: Caption[];
  currentChatMessages?: ChatMessageSaved[];
  onSaveSession?: (classId: string, sessionTitle: string) => void;
  onLoadSession?: (captions: Caption[], chatMessages?: ChatMessageSaved[]) => void;
  onClearSession?: () => void;
}

export function ClassSidebar({
  isOpen,
  onClose,
  currentSessionTitle,
  currentTranscript,
  currentCaptions,
  currentChatMessages,
  onSaveSession,
  onLoadSession,
  onClearSession,
}: ClassSidebarProps) {
  const { data: session } = useSession();
  const [classes, setClasses] = useState<Class[]>([]);
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [isSavingSession, setIsSavingSession] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState(currentSessionTitle || '');
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editingClassName, setEditingClassName] = useState('');

  const userId = session?.user ? (session.user as { id?: string }).id || session.user.email || '' : '';

  const loadClasses = useCallback(async () => {
    if (typeof window === 'undefined' || !session?.user) {
      setClasses([]);
      return;
    }
    if (isFirebaseConfigured()) {
      try {
        const data = await getUserClasses(userId);
        setClasses(data as Class[]);
      } catch (e) {
        console.error('Error loading classes from Firebase:', e);
        setClasses([]);
      }
    } else {
      const stored = localStorage.getItem(`classes_${userId}`);
      if (stored) {
        try {
          setClasses(JSON.parse(stored));
        } catch (e) {
          console.error('Error loading classes:', e);
        }
      }
    }
  }, [session?.user, userId]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    setSessionTitle(currentSessionTitle || '');
  }, [currentSessionTitle]);

  const saveClasses = useCallback(
    async (updatedClasses: Class[]) => {
      if (typeof window === 'undefined' || !session?.user) return;
      if (isFirebaseConfigured()) {
        try {
          await setUserClasses(userId, updatedClasses as UserClassesItem[]);
        } catch (e) {
          console.error('Error saving classes to Firebase:', e);
        }
      } else {
        localStorage.setItem(`classes_${userId}`, JSON.stringify(updatedClasses));
      }
      setClasses(updatedClasses);
    },
    [session?.user, userId]
  );

  const handleCreateClass = () => {
    if (!newClassName.trim() || !session?.user) return;

    const newClass: Class = {
      id: `class_${Date.now()}`,
      name: newClassName.trim(),
      sessions: [],
      createdAt: new Date().toISOString(),
    };

    const updatedClasses = [...classes, newClass];
    saveClasses(updatedClasses);
    setNewClassName('');
    setIsCreatingClass(false);
    setExpandedClasses(new Set([...expandedClasses, newClass.id]));
  };

  const handleDeleteClass = (classId: string) => {
    if (!confirm('Are you sure you want to delete this class and all its sessions?')) return;
    
    const updatedClasses = classes.filter((c) => c.id !== classId);
    saveClasses(updatedClasses);
    setExpandedClasses(new Set([...expandedClasses].filter((id) => id !== classId)));
  };

  const handleEditClass = (classId: string) => {
    const classToEdit = classes.find((c) => c.id === classId);
    if (classToEdit) {
      setEditingClassId(classId);
      setEditingClassName(classToEdit.name);
    }
  };

  const handleSaveClassEdit = () => {
    if (!editingClassId || !editingClassName.trim()) return;

    const updatedClasses = classes.map((c) =>
      c.id === editingClassId ? { ...c, name: editingClassName.trim() } : c
    );
    saveClasses(updatedClasses);
    setEditingClassId(null);
    setEditingClassName('');
  };

  const handleSaveSessionToClass = async (classId?: string) => {
    const targetClassId = classId || selectedClassId;
    if (!targetClassId || !sessionTitle.trim() || (!currentTranscript && (!currentCaptions || currentCaptions.length === 0)) || !session?.user) {
      alert('Please enter a session title');
      return;
    }

    setIsSavingSession(true);
    
    const classToUpdate = classes.find((c) => c.id === targetClassId);
    if (!classToUpdate) {
      setIsSavingSession(false);
      return;
    }

    const newSession: Session = {
      id: `session_${Date.now()}`,
      title: sessionTitle.trim(),
      classId: targetClassId,
      createdAt: new Date().toISOString(),
      transcript: currentTranscript,
      captions: currentCaptions && currentCaptions.length > 0 ? currentCaptions : [],
      chatMessages: currentChatMessages && currentChatMessages.length > 0 ? currentChatMessages : [],
    };

    console.log('Saving session with captions:', newSession.captions?.length || 0, 'captions', 'chat messages:', newSession.chatMessages?.length || 0);

    const updatedClasses = classes.map((c) =>
      c.id === targetClassId
        ? { ...c, sessions: [...c.sessions, newSession] }
        : c
    );

    saveClasses(updatedClasses);
    
    if (onSaveSession) {
      onSaveSession(targetClassId, sessionTitle.trim());
    }

    // Clear the current session after saving
    if (onClearSession) {
      onClearSession();
    }

    setSelectedClassId(null);
    setSessionTitle('');
    setIsSavingSession(false);
    setExpandedClasses(new Set([...expandedClasses, targetClassId]));
    
    alert('Session saved successfully!');
  };

  const handleLoadSession = (session: Session) => {
    console.log('Loading session:', session);
    if (!onLoadSession) {
      console.error('onLoadSession callback is not defined');
      return;
    }

    const captionsToLoad: Caption[] =
      session.captions && session.captions.length > 0
        ? session.captions
        : session.transcript
          ? session.transcript
              .split(/[.!?]+/)
              .map((s) => s.trim())
              .filter((s) => s.length > 0)
              .map((sentence, i) => ({
                id: `loaded-caption-${Date.now()}-${i}`,
                text: sentence,
                timestamp: Date.now() - (i * 1000),
                isFinal: true,
                speaker: 'unknown' as const,
              }))
          : [];

    const hasContent = captionsToLoad.length > 0 || session.transcript || (session.chatMessages && session.chatMessages.length > 0);
    if (hasContent) {
      onLoadSession(captionsToLoad, session.chatMessages);
      onClose();
    } else {
      console.error('Session has no captions, transcript, or chat');
    }
  };

  const toggleClassExpanded = (classId: string) => {
    const newExpanded = new Set(expandedClasses);
    if (newExpanded.has(classId)) {
      newExpanded.delete(classId);
    } else {
      newExpanded.add(classId);
    }
    setExpandedClasses(newExpanded);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-80 bg-white/98 dark:bg-gray-800/98 backdrop-blur-2xl border-r border-gray-200/80 dark:border-gray-700/80 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-out">
        {/* Header */}
        <div className="p-5 border-b border-gray-200/80 dark:border-gray-700/80 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              My Classes
            </h2>
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 group"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
            </button>
          </div>

          {/* Create Class Button */}
          <button
            onClick={() => setIsCreatingClass(true)}
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold text-sm transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transform"
          >
            <Plus className="w-5 h-5" />
            <span>Add New Class</span>
          </button>
        </div>

        {/* Create Class Form */}
        {isCreatingClass && (
          <div className="p-4 border-b border-gray-200/80 dark:border-gray-700/80 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-gray-900/50 dark:to-gray-800/30">
            <input
              type="text"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder="Enter class name..."
              className="w-full px-4 py-3 border-2 border-blue-300 dark:border-blue-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3 font-medium shadow-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateClass();
                if (e.key === 'Escape') {
                  setIsCreatingClass(false);
                  setNewClassName('');
                }
              }}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateClass}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-sm transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setIsCreatingClass(false);
                  setNewClassName('');
                }}
                className="px-4 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-105 active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Save Session Form */}
        {(currentTranscript || (currentCaptions && currentCaptions.length > 0)) && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save Current Session
            </h3>
            <input
              type="text"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              placeholder="Session title..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-2 text-sm"
            />
            <select
              value={selectedClassId || ''}
              onChange={(e) => setSelectedClassId(e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-2 text-sm"
            >
              <option value="">Select a class...</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => handleSaveSessionToClass()}
              disabled={isSavingSession || !selectedClassId || !sessionTitle.trim()}
              className="w-full px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isSavingSession ? 'Saving...' : 'Save Session'}
            </button>
          </div>
        )}

        {/* Classes List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {classes.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No classes yet</p>
              <p className="text-xs mt-1">Create your first class to get started</p>
            </div>
          ) : (
            classes.map((classItem) => (
              <div
                key={classItem.id}
                className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Class Header */}
                <div className="p-3 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-900/50 dark:to-gray-800/30">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => toggleClassExpanded(classItem.id)}
                      className="flex-1 flex items-center gap-2 text-left hover:bg-gray-200/80 dark:hover:bg-gray-800/80 rounded-lg p-2 -m-2 transition-colors group"
                    >
                      {expandedClasses.has(classItem.id) ? (
                        <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                      )}
                      {editingClassId === classItem.id ? (
                        <input
                          type="text"
                          value={editingClassName}
                          onChange={(e) => setEditingClassName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveClassEdit();
                            if (e.key === 'Escape') {
                              setEditingClassId(null);
                              setEditingClassName('');
                            }
                          }}
                          className="flex-1 px-2 py-1 border-2 border-blue-500 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                      ) : (
                        <span className="font-semibold text-gray-900 dark:text-white text-sm flex-1">
                          {classItem.name}
                        </span>
                      )}
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        {classItem.sessions.length}
                      </span>
                    </button>
                    <div className="flex items-center gap-1">
                      {editingClassId === classItem.id ? (
                        <button
                          onClick={handleSaveClassEdit}
                          className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors"
                        >
                          <Save className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEditClass(classItem.id)}
                          className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteClass(classItem.id)}
                        className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sessions List */}
                {expandedClasses.has(classItem.id) && (
                  <div className="p-3 space-y-2 bg-white dark:bg-gray-800/50">
                    {classItem.sessions.length === 0 ? (
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-3">
                        No sessions yet
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {classItem.sessions.map((session) => (
                          <button
                            key={session.id}
                            onClick={() => handleLoadSession(session)}
                            className="w-full flex items-center gap-2 p-2.5 hover:bg-gray-50 dark:hover:bg-gray-900/50 rounded-lg group transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700 text-left"
                          >
                            <FileText className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0 group-hover:text-blue-500 transition-colors" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {session.title}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(session.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

