'use client';

import { useState } from 'react';
import { BookOpen, ChevronDown, Check, Plus, X } from 'lucide-react';
import { VocabularyTopic, VocabularyTerm } from '@/types';
import { vocabularyTopics } from '@/lib/vocabularyData';

interface VocabularySelectorProps {
  selectedTopic: VocabularyTopic | null;
  onSelectTopic: (topic: VocabularyTopic | null) => void;
  customTopics?: VocabularyTopic[];
  onAddCustomTopic?: (topic: VocabularyTopic) => void;
  onRemoveCustomTopic?: (topicId: string) => void;
}

export function VocabularySelector({
  selectedTopic,
  onSelectTopic,
  customTopics = [],
  onAddCustomTopic,
  onRemoveCustomTopic,
}: VocabularySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customTermsText, setCustomTermsText] = useState('');

  const handleSelectTopic = (topic: VocabularyTopic | null) => {
    onSelectTopic(topic);
    setIsOpen(false);
  };

  const handleAddCustomTopic = () => {
    if (!customName.trim() || !customTermsText.trim() || !onAddCustomTopic) return;
    
    const terms: VocabularyTerm[] = customTermsText
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [term, definition] = line.split(':').map(s => s.trim());
        return { term, definition: definition || undefined };
      });
    
    if (terms.length === 0) return;
    
    const newTopic: VocabularyTopic = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      terms,
      isCustom: true,
    };
    
    onAddCustomTopic(newTopic);
    setCustomName('');
    setCustomTermsText('');
    setShowCustomForm(false);
  };

  const allTopics = [...vocabularyTopics, ...customTopics];

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group flex items-center gap-2.5 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl transition-all duration-300 font-semibold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-105 active:scale-95"
        >
          <BookOpen size={18} className="group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">
            {selectedTopic ? selectedTopic.name : 'Select Topic'}
          </span>
          <ChevronDown
            size={18}
            className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {selectedTopic && (
          <button
            onClick={() => setShowTerms(!showTerms)}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 text-purple-700 dark:text-purple-300 rounded-xl text-sm font-semibold hover:from-purple-200 hover:to-indigo-200 dark:hover:from-purple-800/40 dark:hover:to-indigo-800/40 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
          >
            {showTerms ? 'Hide Terms' : 'Show Terms'}
          </button>
        )}
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-3 w-80 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 z-50 overflow-hidden animate-in slide-in-from-top-2 duration-300">
            <div className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200/50 dark:border-gray-700/50">
              <button
                onClick={() => handleSelectTopic(null)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between font-medium ${
                  !selectedTopic
                    ? 'bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 text-purple-700 dark:text-purple-300 shadow-md'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <span>No Topic (General)</span>
                {!selectedTopic && <Check size={18} className="text-purple-600 dark:text-purple-400" />}
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto p-2 space-y-1">
              {allTopics.map((topic) => (
                <div key={topic.id} className="flex items-center gap-1">
                  <button
                    onClick={() => handleSelectTopic(topic)}
                    className={`flex-1 text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between font-medium ${
                      selectedTopic?.id === topic.id
                        ? 'bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 text-purple-700 dark:text-purple-300 shadow-md'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {topic.name}
                      {topic.isCustom && (
                        <span className="text-xs px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full">
                          Custom
                        </span>
                      )}
                    </span>
                    {selectedTopic?.id === topic.id && <Check size={18} className="text-purple-600 dark:text-purple-400" />}
                  </button>
                  {topic.isCustom && onRemoveCustomTopic && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveCustomTopic(topic.id);
                        if (selectedTopic?.id === topic.id) {
                          onSelectTopic(null);
                        }
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                      title="Remove custom topic"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {onAddCustomTopic && (
              <div className="p-3 border-t border-gray-200/50 dark:border-gray-700/50">
                {!showCustomForm ? (
                  <button
                    onClick={() => setShowCustomForm(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all font-medium"
                  >
                    <Plus size={18} />
                    Add Custom Vocabulary
                  </button>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="Topic name (e.g., Biology Chapter 5)"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <textarea
                      value={customTermsText}
                      onChange={(e) => setCustomTermsText(e.target.value)}
                      placeholder="Enter terms (one per line)&#10;Format: term: definition&#10;Example:&#10;photosynthesis: process of converting light to energy&#10;chlorophyll: green pigment in plants"
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowCustomForm(false);
                          setCustomName('');
                          setCustomTermsText('');
                        }}
                        className="flex-1 px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all text-sm font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddCustomTopic}
                        disabled={!customName.trim() || !customTermsText.trim()}
                        className="flex-1 px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add Topic
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {showTerms && selectedTopic && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowTerms(false)}
          />
          <div className="absolute top-full left-0 mt-3 w-96 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 z-40 overflow-hidden animate-in slide-in-from-top-2 duration-300">
            <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200/50 dark:border-gray-700/50">
              <h4 className="font-extrabold text-lg text-gray-800 dark:text-white mb-1">
                {selectedTopic.name} - Vocabulary Terms
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                These terms will be highlighted when detected
              </p>
            </div>
            <div className="max-h-80 overflow-y-auto p-3 space-y-2">
              {selectedTopic.terms.map((term, index) => (
                <div
                  key={index}
                  className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                >
                  <div className="font-semibold text-gray-800 dark:text-white text-sm mb-1">
                    {term.term}
                  </div>
                  {term.definition && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      {term.definition}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
