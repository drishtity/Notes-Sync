'use client';

import React from 'react';
import { useNotesSync } from '@/lib/store';
import { BookOpen, Plus, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export function EmptyState({ 
  title = 'No subjects yet', 
  description = 'Add a subject and syllabus to let NotesSync build your personalized preparation plan.' 
}: EmptyStateProps) {
  const { setCurrentView } = useNotesSync();

  return (
    <div className="max-w-xl mx-auto py-20 px-4 text-center">
      <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-5 shadow-xs">
        <BookOpen className="w-8 h-8" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700 mb-3">
        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
        <span>Ready to Optimize Your Study Time</span>
      </div>

      <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
        {title}
      </h2>

      <p className="mt-2 text-sm text-zinc-600 max-w-md mx-auto leading-relaxed">
        {description}
      </p>

      <div className="mt-8 flex flex-col items-center justify-center gap-4">
        <button
          onClick={() => setCurrentView('add-subject')}
          className="px-6 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs hover:shadow transition flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Add Subject</span>
        </button>

        <p className="text-xs font-medium text-zinc-500">
          Upload syllabus &rarr; Set exam date &rarr; Get your personalized plan
        </p>
      </div>
    </div>
  );
}
