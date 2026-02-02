'use client';

import { useState } from 'react';
import { FileText, Download, RefreshCw, Printer, Bookmark } from 'lucide-react';
import { GeneratedNotes, VocabularyTopic, Bookmark as BookmarkType } from '@/types';
import { generateNotes, downloadAsFile, formatNotesWithBookmarks, downloadAsPDF } from '@/lib/notesGenerator';

interface NotesPanelProps {
  transcript: string;
  selectedTopic?: VocabularyTopic;
  isOpen: boolean;
  onClose: () => void;
  bookmarks?: BookmarkType[];
}

export function NotesPanel({
  transcript,
  selectedTopic,
  isOpen,
  onClose,
  bookmarks = [],
}: NotesPanelProps) {
  const [notes, setNotes] = useState<GeneratedNotes | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useLocalGeneration, setUseLocalGeneration] = useState(false);

  const handleGenerateNotes = async () => {
    setIsGenerating(true);
    setError(null);
    setNotes(null);

    try {
      // Try OpenAI API first
      const response = await fetch('/api/generate-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript,
          selectedTopic: selectedTopic || undefined,
        }),
      });

      const data = await response.json();

      // Debug logging
      console.log('API Response:', { useLocal: data.useLocal, hasNotes: !!data.notes, message: data.message, error: data.error });

      if (data.useLocal || !data.notes) {
        // Fallback to local generation
        setUseLocalGeneration(true);
        const generatedNotes = generateNotes(transcript, selectedTopic);
        setNotes(generatedNotes);
        
        // Always show a clear message about why local generation is being used
        if (data.message) {
          setError(data.message);
          console.warn('Using local generation:', data.message);
        } else if (data.error) {
          setError(data.details || data.error || 'Unknown error occurred');
          console.error('API Error:', data.error, data.details);
        } else {
          setError('OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file and restart the server.');
          console.warn('No API key found - using local generation');
        }
      } else {
        // Use OpenAI-generated notes
        setUseLocalGeneration(false);
        setError(null); // Clear any previous errors
        setNotes(data.notes);
        console.log('Successfully using AI-generated notes');
      }
    } catch (err) {
      // Fallback to local generation on error
      console.error('Error generating notes with OpenAI:', err);
      setUseLocalGeneration(true);
      setError('Failed to generate notes with AI. Using local generation instead.');
      const generatedNotes = generateNotes(transcript, selectedTopic);
      setNotes(generatedNotes);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadText = () => {
    if (notes) {
      const textContent = formatNotesWithBookmarks(notes, bookmarks);
      downloadAsFile(textContent, 'lecture-notes.txt', 'text/plain');
    }
  };

  const handleDownloadMarkdown = () => {
    if (notes) {
      const markdownContent = formatNotesWithBookmarks(notes, bookmarks);
      downloadAsFile(markdownContent, 'lecture-notes.md', 'text/markdown');
    }
  };

  const handleDownloadPDF = () => {
    if (notes) {
      downloadAsPDF(notes, bookmarks);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-top-2 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
              <FileText size={24} className="text-white" />
            </div>
            Auto-Generated Notes
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-3xl hover:scale-110 transition-transform rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700 w-10 h-10 flex items-center justify-center"
          >
            &times;
          </button>
        </div>

        {/* Action Buttons */}
        <div className="p-5 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-gray-50/50 to-white/50 dark:from-gray-800/50 dark:to-gray-800/50 flex gap-3 flex-wrap">
          <button
            onClick={handleGenerateNotes}
            disabled={!transcript || isGenerating}
            className={`
              group flex items-center gap-2.5 px-6 py-3 rounded-xl font-semibold transition-all duration-300
              ${
                !transcript || isGenerating
                  ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed text-gray-500'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 active:scale-95'
              }
            `}
          >
            <RefreshCw size={18} className={isGenerating ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-300'} />
            {isGenerating ? 'Generating with AI...' : 'Generate Notes with AI'}
          </button>
          
          {(useLocalGeneration || error) && (
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold ${
              error 
                ? 'bg-red-50 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300'
                : 'bg-amber-50 dark:bg-amber-900/30 border-2 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
            }`}>
              <span className="text-lg">⚠️</span>
              <div className="flex-1">
                {error ? (
                  <div>
                    <div className="font-bold">AI Generation Failed</div>
                    <div className="text-xs mt-1 opacity-90">{error}</div>
                  </div>
                ) : (
                  <div>
                    <div className="font-bold">Using Basic Local Generation</div>
                    <div className="text-xs mt-1 opacity-90">Add OPENAI_API_KEY to .env.local for AI-powered notes</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {notes && (
            <>
              <button
                onClick={handleDownloadText}
                className="group flex items-center gap-2.5 px-5 py-3 rounded-xl font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white transition-all duration-300 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-105 active:scale-95"
              >
                <Download size={18} className="group-hover:scale-110 transition-transform" />
                Download TXT
              </button>
              <button
                onClick={handleDownloadMarkdown}
                className="group flex items-center gap-2.5 px-5 py-3 rounded-xl font-semibold bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white transition-all duration-300 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-105 active:scale-95"
              >
                <Download size={18} className="group-hover:scale-110 transition-transform" />
                Download MD
              </button>
              <button
                onClick={handleDownloadPDF}
                className="group flex items-center gap-2.5 px-5 py-3 rounded-xl font-semibold bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white transition-all duration-300 shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 hover:scale-105 active:scale-95"
              >
                <Printer size={18} className="group-hover:scale-110 transition-transform" />
                Print / PDF
              </button>
            </>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-white via-gray-50/30 to-white dark:from-gray-900 dark:via-gray-800/30 dark:to-gray-900">
          {!transcript && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-12">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mx-auto mb-4">
                <FileText size={40} className="text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-xl font-semibold mb-2">No transcript available yet.</p>
              <p className="text-sm">
                Start listening to a lecture to generate notes.
              </p>
            </div>
          )}

          {transcript && !notes && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-12">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center mx-auto mb-4">
                <FileText size={40} className="text-blue-500 dark:text-blue-400" />
              </div>
              <p className="text-xl font-semibold mb-2">Ready to generate notes!</p>
              <p className="text-sm">
                Click &quot;Generate Notes&quot; to create a summary of the lecture.
              </p>
            </div>
          )}

          {notes && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {useLocalGeneration && (
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30 border-2 border-amber-300 dark:border-amber-700 rounded-2xl p-5 shadow-lg">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div className="flex-1">
                      <h4 className="font-bold text-amber-800 dark:text-amber-200 mb-2">
                        Basic Notes Generated (Not AI-Powered)
                      </h4>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                        These notes are generated using simple pattern matching. For much better, AI-powered notes:
                      </p>
                      <ol className="text-sm text-amber-700 dark:text-amber-300 list-decimal list-inside space-y-1 ml-2">
                        <li>Create a <code className="bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded">.env.local</code> file in the <code className="bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded">SoftwareDev2026</code> folder</li>
                        <li>Add: <code className="bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded">OPENAI_API_KEY=sk-your-key-here</code></li>
                        <li>Restart your dev server (<code className="bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded">npm run dev</code>)</li>
                        <li>Click "Generate Notes with AI" again</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}
              <section className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                <h3 className="text-xl font-extrabold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></span>
                  Summary
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base">
                  {notes.summary}
                </p>
              </section>

              {notes.bulletPoints.length > 0 && (
                <section className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                  <h3 className="text-xl font-extrabold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></span>
                    Key Points
                  </h3>
                  <ul className="space-y-3">
                    {notes.bulletPoints.map((point, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 text-gray-700 dark:text-gray-300 group"
                      >
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-sm font-bold mt-0.5 group-hover:scale-110 transition-transform">
                          {index + 1}
                        </span>
                        <span className="flex-1 pt-0.5">{point}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {notes.keyTerms.length > 0 && (
                <section className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                  <h3 className="text-xl font-extrabold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-gradient-to-b from-purple-500 to-indigo-600 rounded-full"></span>
                    Key Terms & Definitions
                  </h3>
                  <div className="space-y-3">
                    {notes.keyTerms.map((item, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-xl border border-blue-200/50 dark:border-blue-800/50 hover:shadow-md transition-all"
                      >
                        <span className="font-bold text-blue-600 dark:text-blue-400 text-base">
                          {item.term}
                        </span>
                        <span className="text-gray-700 dark:text-gray-300 ml-2">
                          : {item.definition}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {notes.formulas.length > 0 && (
                <section className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                  <h3 className="text-xl font-extrabold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-gradient-to-b from-amber-500 to-yellow-600 rounded-full"></span>
                    Formulas
                  </h3>
                  <div className="space-y-3">
                    {notes.formulas.map((formula, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 p-4 rounded-xl border border-amber-200/50 dark:border-amber-800/50 font-mono text-gray-800 dark:text-gray-200 text-sm"
                      >
                        {formula}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {bookmarks.length > 0 && (
                <section className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                  <h3 className="text-xl font-extrabold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-gradient-to-b from-red-500 to-rose-600 rounded-full"></span>
                    <Bookmark size={20} className="text-red-500" />
                    Bookmarked Moments (Review Later)
                  </h3>
                  <div className="space-y-4">
                    {bookmarks.map((bookmark) => (
                      <div
                        key={bookmark.id}
                        className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 p-4 rounded-xl border border-red-200/50 dark:border-red-800/50"
                      >
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          {new Date(bookmark.timestamp).toLocaleTimeString()}
                        </div>
                        {bookmark.note && (
                          <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">
                            Note: {bookmark.note}
                          </p>
                        )}
                        <p className="text-gray-700 dark:text-gray-300 text-sm">
                          {bookmark.captions.map(c => c.text).join(' ')}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
