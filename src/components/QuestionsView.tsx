'use client';

import React, { useState } from 'react';
import { useNotesSync } from '@/lib/store';
import { PracticeQuestion, PriorityLevel } from '@/lib/types';
import { 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Check, 
  ShieldAlert, 
  Filter,
  FileQuestion,
  Sparkles,
  Search
} from 'lucide-react';

import { EmptyState } from '@/components/EmptyState';

export function QuestionsView() {
  const { activeSubject, toggleQuestionInPlan, toggleQuestionCompleted, setCurrentView } = useNotesSync();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  if (!activeSubject) {
    return (
      <EmptyState
        title="No Practice Questions Available"
        description="Select or add a subject to browse targeted practice questions categorized by priority and difficulty."
      />
    );
  }

  const questions = activeSubject.questions || [];

  const filteredQuestions = questions.filter(q => {
    if (selectedCategory !== 'ALL' && q.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        q.topic.toLowerCase().includes(query) ||
        q.question.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const highPriorityCount = questions.filter(q => q.category === 'High Priority').length;
  const mediumPriorityCount = questions.filter(q => q.category === 'Medium Priority').length;
  const quickRevisionCount = questions.filter(q => q.category === 'Quick Revision').length;
  const inPlanCount = questions.filter(q => q.inPlan).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
              Exam Practice Bank
            </span>
            <span className="text-xs text-zinc-500">
              {questions.length} Questions &bull; {inPlanCount} Added to Active Plan
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight mt-1">
            Important Practice Questions
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 mt-1">
            Targeted exam-level practice questions generated directly from your syllabus topics.
          </p>
        </div>

        <button
          onClick={() => setCurrentView('study-plan')}
          className="self-start sm:self-auto px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition"
        >
          View in Study Plan ({inPlanCount})
        </button>
      </div>

      {/* Mandatory Disclaimer Alert */}
      <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-700 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-0.5">
          <span className="font-bold text-zinc-900">Academic Disclaimer:</span>
          <p className="text-zinc-600">
            AI-generated practice questions based on your supplied syllabus and materials. They are not guaranteed exam questions. Frequency metrics reflect only supplied past papers.
          </p>
        </div>
      </div>

      {/* Categories & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
              selectedCategory === 'ALL'
                ? 'bg-zinc-900 text-white'
                : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            All Questions ({questions.length})
          </button>
          <button
            onClick={() => setSelectedCategory('High Priority')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
              selectedCategory === 'High Priority'
                ? 'bg-rose-700 text-white'
                : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            High Priority ({highPriorityCount})
          </button>
          <button
            onClick={() => setSelectedCategory('Medium Priority')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
              selectedCategory === 'Medium Priority'
                ? 'bg-amber-700 text-white'
                : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            Medium Priority ({mediumPriorityCount})
          </button>
          <button
            onClick={() => setSelectedCategory('Quick Revision')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
              selectedCategory === 'Quick Revision'
                ? 'bg-emerald-700 text-white'
                : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            Quick Revision ({quickRevisionCount})
          </button>
        </div>

        {/* Search Box */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search topic or question..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

      </div>

      {/* Questions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredQuestions.map((q) => {
          const isHigh = q.priority === 'HIGH';
          const isMedium = q.priority === 'MEDIUM';

          return (
            <div
              key={q.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between shadow-xs ${
                q.completed
                  ? 'bg-zinc-50 border-zinc-200 opacity-75'
                  : isHigh
                  ? 'bg-white border-zinc-200 hover:border-rose-300'
                  : 'bg-white border-zinc-200 hover:border-indigo-300'
              }`}
            >
              <div>
                {/* Meta Header */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-900 truncate max-w-[180px] sm:max-w-[240px]" title={q.topic}>
                      {q.topic}
                    </span>
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded shrink-0 ${
                      isHigh 
                        ? 'bg-rose-100 text-rose-800' 
                        : isMedium 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {q.priority}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{q.estimatedMinutes}m</span>
                    <span className="text-zinc-300">&bull;</span>
                    <span className="font-medium text-zinc-600">{q.difficulty}</span>
                  </div>
                </div>

                {/* Question Body */}
                <p className={`text-sm leading-relaxed ${q.completed ? 'line-through text-zinc-500' : 'text-zinc-800 font-medium'}`}>
                  {q.question}
                </p>

                {/* Past Paper Frequency vs AI-Generated Origin Indicator */}
                <div className="mt-2.5 flex items-center gap-2">
                  {q.frequency ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/80">
                      <FileQuestion className="w-3 h-3 text-indigo-500" />
                      <span>Frequently seen in supplied past papers (~{q.frequency}x)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                      <Sparkles className="w-3 h-3 text-indigo-500" />
                      <span>AI-generated practice question</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
                
                {/* Mark as Solved Checkbox */}
                <button
                  onClick={() => toggleQuestionCompleted(q.id)}
                  className={`flex items-center gap-1.5 text-xs font-medium transition ${
                    q.completed ? 'text-emerald-600' : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                    q.completed ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-zinc-300'
                  }`}>
                    {q.completed && <Check className="w-3 h-3" />}
                  </div>
                  <span>{q.completed ? 'Solved' : 'Mark as Solved'}</span>
                </button>

                {/* Add / Remove from Plan Button */}
                <button
                  onClick={() => toggleQuestionInPlan(q.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                    q.inPlan
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-white shadow-xs'
                  }`}
                >
                  {q.inPlan ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-indigo-600" />
                      <span>In Active Plan</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to Plan</span>
                    </>
                  )}
                </button>

              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
