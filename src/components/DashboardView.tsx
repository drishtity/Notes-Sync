'use client';

import React, { useState } from 'react';
import { useNotesSync } from '@/lib/store';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Flame, 
  AlertTriangle, 
  ArrowRight, 
  BookOpen, 
  Target, 
  Play,
  Layers,
  ChevronRight,
  Plus,
  TrendingUp,
  Sparkles,
  Trash2
} from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';

export function DashboardView() {
  const { 
    activeSubject, 
    subjects, 
    setCurrentView, 
    setActiveSubjectId, 
    setIsWhatToStudyOpen,
    setIsLimitedTimeOpen,
    startFocusSession,
    deleteSubject
  } = useNotesSync();

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (!activeSubject) {
    return (
      <EmptyState
        title="No subjects yet"
        description="Add your first subject to build your personalized exam plan."
      />
    );
  }

  // Dynamic greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const todayPlan = activeSubject.plan?.days[0];
  const todayTasks = todayPlan?.tasks.filter(t => t.type !== 'break') || [];
  
  // Highest priority pending topic for "Today's Focus" hero
  const currentFocusTask = todayTasks.find(t => t.status === 'pending') || todayTasks[0];

  // Topics breakdown
  const allTopics = activeSubject.units.flatMap(u => u.topics);
  const completedTopics = allTopics.filter(t => t.completed);
  const highPriorityTopics = allTopics.filter(t => t.priorityLevel === 'HIGH');
  const completedHighPriority = highPriorityTopics.filter(t => t.completed);

  const mediumPriorityTopics = allTopics.filter(t => t.priorityLevel === 'MEDIUM');
  const lowPriorityTopics = allTopics.filter(t => t.priorityLevel === 'LOW');

  // Study hours metrics
  const completedMinutes = completedTopics.reduce((acc, t) => acc + (t.estimatedMinutes || 30), 0);
  const completedHours = (completedMinutes / 60).toFixed(1);
  const totalWorkloadHours = activeSubject.plan?.totalEstimatedWorkloadHours || 
    ((allTopics.reduce((a, t) => a + (t.estimatedMinutes || 30), 0)) / 60).toFixed(1);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* 1. TOP SECTION: Greeting, Next Exam Countdown, Subject, Readiness */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-indigo-950 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-indigo-300 font-semibold tracking-wide uppercase">
                {greeting}, Student &bull; Exam Decision Engine
              </span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {activeSubject.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 shrink-0">
                {activeSubject.examDaysFromNow} days left
              </span>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-300 hover:bg-white/10 transition shrink-0"
                title={`Delete subject "${activeSubject.name}"`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-zinc-300">
              Exam on {new Date(activeSubject.examDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })} &bull; Budgeted at {activeSubject.availableHoursPerDay} hrs/day
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Readiness Widget */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-right min-w-[140px]">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">
                Exam Readiness
              </span>
              <div className="mt-1 flex items-baseline justify-end gap-1">
                <span className="text-2xl font-black text-emerald-400">
                  {activeSubject.currentPreparationPercentage}%
                </span>
                <span className="text-xs text-zinc-400 font-medium">ready</span>
              </div>
              <div className="mt-1.5 w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-emerald-400 h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, activeSubject.currentPreparationPercentage)}%` }}
                />
              </div>
            </div>

            {/* Quick Action Button */}
            <button
              onClick={() => setIsWhatToStudyOpen(true)}
              className="px-4 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-sm"
              title="Get single highest-yield study recommendation"
            >
              <Flame className="w-4 h-4 fill-zinc-950" />
              <span>What should I study now?</span>
            </button>
          </div>

        </div>
      </div>

      {/* Multi-subject quick switcher */}
      {subjects.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="font-bold text-zinc-400 uppercase tracking-wider text-[10px] shrink-0">
            Switch Subject:
          </span>
          {subjects.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setActiveSubjectId(sub.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition shrink-0 flex items-center gap-1.5 ${
                sub.id === activeSubject.id
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200'
              }`}
            >
              <span>{sub.name}</span>
              <span className={`text-[10px] ${sub.id === activeSubject.id ? 'text-zinc-300' : 'text-zinc-400'}`}>
                ({sub.examDaysFromNow}d)
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Limited Time Discrepancy Notice (Differentiator) */}
      {activeSubject.plan?.discrepancyNotice && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 flex items-start gap-3.5 shadow-xs">
          <div className="p-2 rounded-xl bg-amber-200/70 text-amber-800 shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded">
                Decision Engine Priority Allocation
              </span>
            </div>
            <p className="text-sm font-bold text-amber-950">
              &ldquo;{activeSubject.plan.discrepancyNotice}&rdquo;
            </p>
            <p className="text-xs text-amber-800">
              Your syllabus workload is approximately {totalWorkloadHours}h, but your remaining time is {activeSubject.availableHoursPerDay * activeSubject.examDaysFromNow}h. Low-yield filler has been filtered out to protect your weak areas.
            </p>
          </div>
        </div>
      )}

      {/* 2. MAIN SECTION: TODAY'S FOCUS (Hero Study Task) */}
      {currentFocusTask && (
        <div className="p-6 rounded-3xl bg-white border border-zinc-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-black tracking-wider text-indigo-600">
                  Today&apos;s Focus
                </span>
                <span className="text-xs text-zinc-300">&bull;</span>
                <span className="text-xs text-zinc-500 font-medium">Single highest-impact recommendation</span>
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <h2 className="text-xl font-black text-zinc-900">
                  {currentFocusTask.topicName}
                </h2>
                {currentFocusTask.parentTopic && (
                  <span className="text-xs px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 font-semibold border border-zinc-200">
                    {currentFocusTask.parentTopic}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-xs uppercase font-extrabold px-3 py-1 rounded-full ${
                currentFocusTask.priority === 'HIGH'
                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : currentFocusTask.priority === 'MEDIUM'
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}>
                {currentFocusTask.durationMinutes} min &bull; {currentFocusTask.priority} PRIORITY
              </span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100/80">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-zinc-600 font-semibold">
                <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Target: {currentFocusTask.durationMinutes} minutes</span>
                {currentFocusTask.startTime && currentFocusTask.endTime && (
                  <span className="text-zinc-400 font-normal">({currentFocusTask.startTime} – {currentFocusTask.endTime})</span>
                )}
              </div>
              <p className="text-sm text-zinc-800">
                <strong className="font-semibold text-zinc-900">Why it matters:</strong> {currentFocusTask.reason || 'High-impact syllabus topic prioritized by your exam countdown and weakness assessment.'}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => startFocusSession(currentFocusTask.id)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-xs transition flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Start Focus Sprint</span>
              </button>
              <button
                onClick={() => setCurrentView('todays-plan')}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 font-semibold text-xs sm:text-sm transition"
              >
                View Checklist
              </button>
            </div>
          </div>

          {/* Today's other scheduled tasks */}
          {todayTasks.length > 1 && (
            <div className="pt-2">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">
                Up Next Today:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {todayTasks.slice(1, 4).map((t, tIdx) => (
                  <div 
                    key={`${t.id}-${tIdx}`}
                    onClick={() => startFocusSession(t.id)}
                    className="p-3 rounded-xl border border-zinc-200 bg-zinc-50/60 hover:bg-zinc-100/80 cursor-pointer transition flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 truncate max-w-[150px]">{t.topicName}</h4>
                      <p className="text-[11px] text-zinc-500">{t.durationMinutes} mins &bull; {t.type}</p>
                    </div>
                    <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                      t.priority === 'HIGH' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {t.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. SECONDARY SECTION: YOUR PRIORITY TOPICS (HIGH / MEDIUM / LOW) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-zinc-900">Your Priority Topics</h3>
            <p className="text-xs text-zinc-500">Deterministic scoring mapping: High, Medium, and Low impact topics.</p>
          </div>
          <button
            onClick={() => setCurrentView('syllabus-analysis')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
          >
            <span>View All Topics</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* HIGH PRIORITY */}
          <div className="p-4 rounded-2xl bg-white border border-rose-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-rose-100 pb-2">
              <span className="text-xs font-extrabold uppercase tracking-wide text-rose-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-600" />
                <span>HIGH PRIORITY (80–100)</span>
              </span>
              <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                {highPriorityTopics.length} topics
              </span>
            </div>
            <div className="space-y-1.5">
              {highPriorityTopics.slice(0, 3).map(t => (
                <div key={t.id} className="p-2 rounded-lg bg-rose-50/40 text-xs flex items-center justify-between">
                  <span className="font-semibold text-zinc-900 truncate max-w-[160px]">{t.name}</span>
                  <span className="text-[10px] font-bold text-rose-700">{t.priorityScore}/100</span>
                </div>
              ))}
            </div>
          </div>

          {/* MEDIUM PRIORITY */}
          <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-amber-100 pb-2">
              <span className="text-xs font-extrabold uppercase tracking-wide text-amber-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>MEDIUM PRIORITY (50–79)</span>
              </span>
              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                {mediumPriorityTopics.length} topics
              </span>
            </div>
            <div className="space-y-1.5">
              {mediumPriorityTopics.slice(0, 3).map(t => (
                <div key={t.id} className="p-2 rounded-lg bg-amber-50/40 text-xs flex items-center justify-between">
                  <span className="font-semibold text-zinc-900 truncate max-w-[160px]">{t.name}</span>
                  <span className="text-[10px] font-bold text-amber-800">{t.priorityScore}/100</span>
                </div>
              ))}
            </div>
          </div>

          {/* LOW PRIORITY */}
          <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
              <span className="text-xs font-extrabold uppercase tracking-wide text-emerald-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>LOW PRIORITY (0–49)</span>
              </span>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                {lowPriorityTopics.length} topics
              </span>
            </div>
            <div className="space-y-1.5">
              {lowPriorityTopics.slice(0, 3).map(t => (
                <div key={t.id} className="p-2 rounded-lg bg-emerald-50/40 text-xs flex items-center justify-between">
                  <span className="font-semibold text-zinc-900 truncate max-w-[160px]">{t.name}</span>
                  <span className="text-[10px] font-bold text-emerald-800">{t.priorityScore}/100</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* 4. ANOTHER SECTION: STUDY PROGRESS METRICS */}
      <div className="p-6 rounded-3xl bg-white border border-zinc-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-zinc-900">Study Progress</h3>
            <p className="text-xs text-zinc-500">Track coverage across your syllabus and high-priority milestones.</p>
          </div>
          <button
            onClick={() => setCurrentView('progress')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
          >
            <span>View Full Analytics</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
            <span className="text-xs text-zinc-500 font-medium">Topics Completed</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-black text-zinc-900">{completedTopics.length}</span>
              <span className="text-xs text-zinc-400">/ {allTopics.length}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
            <span className="text-xs text-rose-600 font-bold uppercase tracking-wider">High-Priority Mastery</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-black text-rose-600">{completedHighPriority.length}</span>
              <span className="text-xs text-zinc-400">/ {highPriorityTopics.length}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
            <span className="text-xs text-zinc-500 font-medium">Study Time Logged</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-black text-zinc-900">{completedHours}h</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
            <span className="text-xs text-emerald-700 font-bold uppercase tracking-wider">Overall Readiness</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-black text-emerald-600">{activeSubject.currentPreparationPercentage}%</span>
            </div>
          </div>

        </div>
      </div>

      {/* Delete Subject Confirmation Modal */}
      {showDeleteModal && (
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
              Are you sure you want to delete <strong className="font-semibold text-zinc-900">&ldquo;{activeSubject.name}&rdquo;</strong>? All associated syllabus topics, priority rankings, practice questions, and study plans will be permanently removed.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteSubject(activeSubject.id);
                  setShowDeleteModal(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition shadow-xs"
              >
                Delete Subject
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
