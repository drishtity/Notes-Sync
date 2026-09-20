'use client';

import React, { useState } from 'react';
import { useNotesSync } from '@/lib/store';
import { StudyDay, StudyTask, PriorityLevel } from '@/lib/types';
import { 
  Calendar, 
  Clock, 
  Sparkles, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle2, 
  Coffee, 
  BookOpen, 
  Target,
  ArrowRight,
  Flame,
  Check,
  Play,
  SkipForward
} from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';

export function StudyPlanView() {
  const { 
    activeSubject, 
    manualReplan, 
    setCurrentView, 
    completeTask,
    skipTaskAndReplan,
    startFocusSession
  } = useNotesSync();
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);

  if (!activeSubject || !activeSubject.plan) {
    return (
      <EmptyState
        title="No Study Plan Found"
        description="Add a subject syllabus to generate your full day-by-day timetable and time-allocated schedule."
      />
    );
  }

  const plan = activeSubject.plan;
  const days = plan.days || [];
  const activeDay = days[selectedDayIdx] || days[0];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
              Personalized Study Schedule
            </span>
            {plan.replanCount > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                Adaptively Replanned ({plan.replanCount}x)
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight mt-1">
            {activeSubject.name} &bull; Study Plan
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 mt-1">
            Built strictly for your {activeSubject.availableHoursPerDay} hrs/day budget over {days.length} days until the exam.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={manualReplan}
            className="px-3.5 py-2 text-xs font-semibold text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-xl shadow-xs flex items-center gap-1.5 transition"
            title="Recalculate plan based on latest topic updates"
          >
            <RefreshCw className="w-3.5 h-3.5 text-zinc-500" />
            <span>Re-optimize Plan</span>
          </button>

          <button
            onClick={() => setCurrentView('todays-plan')}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm flex items-center gap-1.5 transition"
          >
            <span>Start Today&apos;s Checklist</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Discrepancy Banner (Core Differentiator) */}
      {plan.discrepancyNotice && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-3.5 shadow-xs">
          <div className="p-2 rounded-xl bg-amber-200/70 text-amber-800 shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded">
                Important Time Allocation Notice
              </span>
            </div>
            <p className="text-sm font-bold text-amber-950">
              &ldquo;{plan.discrepancyNotice}&rdquo;
            </p>
            <p className="text-xs text-amber-800 leading-relaxed">
              Total syllabus estimated workload is <strong>{plan.totalEstimatedWorkloadHours} hours</strong>, but your available study runway is <strong>{plan.totalAvailableHours} hours</strong>. NotesSync has omitted low-yield fluff and allocated your actual time to master high-priority weak areas first.
            </p>
          </div>
        </div>
      )}

      {/* Day Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-zinc-200">
        {days.map((day, idx) => {
          const isSelected = selectedDayIdx === idx;
          const completedTasksCount = day.tasks.filter(t => t.status === 'completed').length;
          const totalTasksCount = day.tasks.filter(t => t.type !== 'break').length;

          return (
            <button
              key={day.dayNumber}
              onClick={() => setSelectedDayIdx(idx)}
              className={`px-4 py-2.5 rounded-xl border transition-all text-left shrink-0 ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                  : 'border-zinc-200 bg-white hover:bg-zinc-50'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className={`text-xs font-extrabold uppercase ${isSelected ? 'text-indigo-700' : 'text-zinc-900'}`}>
                  DAY {day.dayNumber} {day.isFinalDay && '(Final Sprint)'}
                </span>
                {completedTasksCount > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                    {completedTasksCount}/{totalTasksCount}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5 truncate max-w-[170px]">
                {day.isFinalDay ? 'Active Recall & Practice' : day.focusTitle}
              </p>
            </button>
          );
        })}
      </div>

      {/* Active Day Detail Card */}
      {activeDay && (
        <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-6">
          
          {/* Day Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase text-indigo-600">
                  DAY {activeDay.dayNumber} SCHEDULE
                </span>
                <span className="text-xs text-zinc-400">&bull;</span>
                <span className="text-xs text-zinc-500">{activeDay.dateString}</span>
                {activeDay.isFinalDay && (
                  <span className="text-[10px] font-extrabold uppercase bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                    Final Day Before Exam
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mt-1">
                {activeDay.focusTitle}
              </h2>
            </div>

            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <Clock className="w-4 h-4 text-zinc-400" />
              <span>
                Total Day Target:{' '}
                <strong className="text-zinc-800">
                  {activeDay.tasks.reduce((a, t) => a + t.durationMinutes, 0)} mins
                </strong>
              </span>
            </div>
          </div>

          {/* Final Day Special Emphasis Banner */}
          {activeDay.isFinalDay && (
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 flex items-start gap-3">
              <Target className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <span className="font-bold text-sm block">Final Day Rule: Retention & Recall Over New Topics</span>
                <p className="text-purple-700 leading-relaxed">
                  The final day emphasizes <strong>rapid high-yield revision, active recall quizzes, high-priority practice questions, and weak topic consolidation</strong>. No heavy unstudied theories are introduced today to protect exam composure and working memory.
                </p>
              </div>
            </div>
          )}

          {/* Time Block Schedule List */}
          <div className="space-y-3">
            {activeDay.tasks.map((task, tIdx) => {
              const isBreak = task.type === 'break';
              const isCompleted = task.status === 'completed';

              if (isBreak) {
                return (
                  <div
                    key={`${task.id}-${tIdx}`}
                    className="p-3 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 flex items-center justify-between text-zinc-500 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <Coffee className="w-4 h-4 text-zinc-400" />
                      <span className="font-medium text-zinc-600">
                        {task.startTime && task.endTime ? `${task.startTime} – ${task.endTime}` : ''} &bull; {task.topicName}
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-zinc-400">{task.durationMinutes} mins</span>
                  </div>
                );
              }

              return (
                <div
                  key={`${task.id}-${tIdx}`}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isCompleted
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : task.priority === 'HIGH'
                      ? 'bg-white border-zinc-200 hover:border-rose-300'
                      : 'bg-white border-zinc-200 hover:border-indigo-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Time Slot Indicator */}
                    <div className="w-24 shrink-0 text-xs font-mono font-semibold text-zinc-500 pt-0.5">
                      {task.startTime && task.endTime ? (
                        <span>{task.startTime} – {task.endTime}</span>
                      ) : (
                        <span>Slot {tIdx + 1}</span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className={`text-sm font-bold ${isCompleted ? 'line-through text-zinc-500' : 'text-zinc-900'}`}>
                          {task.topicName}
                        </h3>
                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                          task.priority === 'HIGH'
                            ? 'bg-rose-100 text-rose-800'
                            : task.priority === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-zinc-100 text-zinc-700'
                        }`}>
                          {task.priority}
                        </span>
                        {task.type === 'practice' && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                            Practice
                          </span>
                        )}
                        {task.type === 'recall' && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                            Active Recall
                          </span>
                        )}
                      </div>

                      {task.reason && (
                        <p className="text-xs text-zinc-500 mt-1">
                          {task.reason}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Duration & Status */}
                  <div className="flex items-center gap-3 sm:self-center shrink-0">
                    <span className="text-xs font-bold text-zinc-700">
                      {task.durationMinutes} mins
                    </span>

                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-lg">
                        <Check className="w-3.5 h-3.5" />
                        <span>Done</span>
                      </span>
                    ) : task.status === 'skipped' ? (
                      <span className="text-xs font-medium text-zinc-400 bg-zinc-100 px-2.5 py-1 rounded-lg">
                        Skipped
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => startFocusSession(task.id)}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition flex items-center gap-1 shadow-xs"
                          title="Start timer session for this task"
                        >
                          <Play className="w-3 h-3 fill-white" />
                          <span>Start</span>
                        </button>

                        <button
                          onClick={() => completeTask(task.id)}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
                          title="Mark task completed"
                        >
                          Complete
                        </button>

                        <button
                          onClick={() => skipTaskAndReplan(task.id)}
                          className="px-2 py-1 text-xs font-semibold text-zinc-500 hover:text-amber-700 bg-zinc-100 hover:bg-amber-50 rounded-lg transition flex items-center gap-1"
                          title="Skip and adaptively replan remaining schedule"
                        >
                          <SkipForward className="w-3 h-3" />
                          <span>Skip</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
}
