'use client';

import React, { useState } from 'react';
import { useNotesSync, ActiveView } from '@/lib/store';
import { Subject } from '@/lib/types';
import { 
  BookOpen, 
  Sparkles, 
  Clock, 
  Calendar, 
  CheckSquare, 
  BarChart3, 
  HelpCircle, 
  Flame, 
  Plus, 
  ChevronDown,
  Layers,
  Trash2
} from 'lucide-react';

export function Navbar() {
  const { 
    currentView, 
    setCurrentView, 
    subjects, 
    activeSubject, 
    setActiveSubjectId, 
    setIsWhatToStudyOpen,
    setIsLimitedTimeOpen,
    deleteSubject
  } = useNotesSync();

  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);

  const navItems: { id: ActiveView; label: string; icon: React.ReactNode; requiresSubject?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <Calendar className="w-4 h-4" />, requiresSubject: true },
    { id: 'todays-plan', label: "Today's Plan", icon: <CheckSquare className="w-4 h-4" />, requiresSubject: true },
    { id: 'study-plan', label: 'Study Plan', icon: <Clock className="w-4 h-4" />, requiresSubject: true },
    { id: 'syllabus-analysis', label: 'Syllabus', icon: <Layers className="w-4 h-4" />, requiresSubject: true },
    { id: 'questions', label: 'Practice Questions', icon: <BookOpen className="w-4 h-4" />, requiresSubject: true },
    { id: 'progress', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" />, requiresSubject: true },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('landing')}>
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-sky-500 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-zinc-900">NotesSync</span>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Decision Engine
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 hidden sm:block">Your syllabus. Your time. Your plan.</p>
            </div>
          </div>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              if (item.requiresSubject && !activeSubject) return null;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-zinc-900 text-white shadow-sm'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Action Buttons & Subject Picker */}
          <div className="flex items-center gap-2">
            
            {/* What to study CTA: Compact, prominent, no text-wrap */}
            {activeSubject && (
              <button
                onClick={() => setIsWhatToStudyOpen(true)}
                className="whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-all active:scale-95"
                title="AI recommendation of the single best next study topic"
              >
                <Flame className="w-4 h-4 text-white fill-white animate-pulse shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">What should I study?</span>
                <span className="sm:hidden whitespace-nowrap">Study Next</span>
              </button>
            )}

            {/* Limited Time Mode trigger */}
            {activeSubject && (
              <button
                onClick={() => setIsLimitedTimeOpen(true)}
                className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition"
                title="Generate a focus sprint for limited time (30m, 1h, 3h)"
              >
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                <span>Limited Time</span>
              </button>
            )}

            {/* Active Subject Selector Dropdown & Delete Button */}
            {subjects.length > 0 ? (
              <div className="flex items-center gap-1">
                <div className="relative group">
                  <select
                    value={activeSubject?.id || ''}
                    onChange={(e) => setActiveSubjectId(e.target.value)}
                    className="appearance-none text-xs sm:text-sm font-medium bg-zinc-50 border border-zinc-200 text-zinc-800 rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-[130px] sm:max-w-[190px] truncate"
                  >
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name} ({sub.examDaysFromNow}d left)
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {activeSubject && (
                  <button
                    onClick={() => setSubjectToDelete(activeSubject)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition shrink-0"
                    title={`Delete subject "${activeSubject.name}"`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : null}

            {/* Add Subject Button */}
            <button
              onClick={() => setCurrentView('add-subject')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-xs"
              title="Add a new syllabus or subject"
            >
              <Plus className="w-4 h-4" />
              <span>Add Subject</span>
            </button>

          </div>

        </div>

        {/* Mobile Navigation bar */}
        {activeSubject && (
          <div className="flex md:hidden overflow-x-auto py-2 space-x-1 border-t border-zinc-100 scrollbar-none">
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-zinc-900 text-white'
                      : 'text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

      </div>

      {/* Delete Subject Confirmation Modal */}
      {subjectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-zinc-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-zinc-900">Delete Subject</h3>
                <p className="text-xs text-zinc-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-zinc-700 leading-relaxed">
              Are you sure you want to delete <strong className="font-semibold text-zinc-900">&ldquo;{subjectToDelete.name}&rdquo;</strong>? All associated syllabus topics, priority rankings, practice questions, and study plans will be permanently removed.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setSubjectToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteSubject(subjectToDelete.id);
                  setSubjectToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition shadow-xs"
              >
                Delete Subject
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
