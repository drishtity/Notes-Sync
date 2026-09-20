'use client';

import React from 'react';
import { useNotesSync } from '@/lib/store';
import { getWhatToStudyNow } from '@/lib/planner-engine';
import { 
  Flame, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  Target, 
  CheckCircle2, 
  X,
  Zap,
  HelpCircle
} from 'lucide-react';

export function WhatToStudyModal() {
  const { 
    isWhatToStudyOpen, 
    setIsWhatToStudyOpen, 
    activeSubject, 
    startFocusSession 
  } = useNotesSync();

  if (!isWhatToStudyOpen || !activeSubject) return null;

  const allTopics = activeSubject.units.flatMap(u => u.topics);
  const todayTasks = activeSubject.plan?.days[0]?.tasks || [];
  const recommendation = getWhatToStudyNow(
    allTopics,
    activeSubject.examDaysFromNow,
    todayTasks
  );

  const handleStartStudying = () => {
    startFocusSession(recommendation.taskId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden space-y-0">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 p-6 text-white relative">
          <button
            onClick={() => setIsWhatToStudyOpen(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/20 text-white border border-white/25 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 fill-white" />
              <span>Real-Time Decision Engine</span>
            </span>
          </div>

          <h2 className="text-2xl font-black tracking-tight">
            What should I study now?
          </h2>
          <p className="text-xs text-white/90 mt-1">
            NotesSync analyzed your remaining exam runway, weakness profile, and syllabus weights to pick your single highest-yield next task.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          
          {/* Recommendation Box */}
          <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded">
                Recommended Action
              </span>
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                <span>{recommendation.durationMinutes} minutes</span>
              </span>
            </div>

            <div className="text-xl font-extrabold text-zinc-900">
              Study {recommendation.topic} for {recommendation.durationMinutes} minutes.
            </div>

            <div className="pt-2 border-t border-amber-200/60 flex items-center gap-2">
              <span className="text-xs text-zinc-500 font-medium">Topic Priority:</span>
              <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded ${
                recommendation.priority === 'HIGH'
                  ? 'bg-rose-100 text-rose-800'
                  : recommendation.priority === 'MEDIUM'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {recommendation.priority}
              </span>
              <span className="text-xs text-zinc-400">&bull;</span>
              <span className="text-xs text-zinc-600 capitalize">
                Confidence: <strong>{recommendation.confidence}</strong>
              </span>
            </div>
          </div>

          {/* Rationale Section */}
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 uppercase tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Decision Reason:</span>
            </div>
            <p className="text-sm text-zinc-700 leading-relaxed italic">
              &ldquo;{recommendation.reason}&rdquo;
            </p>
          </div>

          {/* Suggested Sprint Command */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-950 text-xs">
            <Target className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <span className="font-bold block">Execution Directive:</span>
              <span>{recommendation.suggestedAction}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setIsWhatToStudyOpen(false)}
              className="px-4 py-2.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900"
            >
              Close
            </button>
            <button
              onClick={handleStartStudying}
              className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition flex items-center gap-2"
            >
              <span>Start Session</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
