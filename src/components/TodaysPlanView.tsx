'use client';

import React, { useState, useEffect } from 'react';
import { useNotesSync } from '@/lib/store';
import { StudyTask, PriorityLevel } from '@/lib/types';
import { 
  CheckSquare, 
  Square, 
  Check, 
  SkipForward, 
  RefreshCw, 
  Play, 
  Pause, 
  RotateCcw, 
  Clock, 
  Flame, 
  AlertCircle,
  Sparkles,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';

export function TodaysPlanView() {
  const { 
    activeSubject, 
    completeTask, 
    skipTaskAndReplan, 
    manualReplan, 
    setCurrentView,
    notificationMessage,
    activeTimerTaskId,
    setActiveTimerTaskId,
    autoStartTimer,
    setAutoStartTimer
  } = useNotesSync();

  const [activeTimerTask, setActiveTimerTask] = useState<StudyTask | null>(null);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Check today's plan
  const todayPlan = activeSubject?.plan?.days[0];
  const tasks = todayPlan?.tasks.filter(t => t.type !== 'break') || [];

  // Listen for specific task focus from "What to study now" or Study Plan
  useEffect(() => {
    if (activeTimerTaskId && tasks.length > 0) {
      const target = tasks.find(t => t.id === activeTimerTaskId || t.topicName.toLowerCase() === activeTimerTaskId.toLowerCase());
      if (target) {
        setActiveTimerTask(target);
        setTimerSecondsLeft(target.durationMinutes * 60);
        if (autoStartTimer) {
          setIsTimerRunning(true);
          setAutoStartTimer(false);
        }
        return;
      }
    }

    if (!activeTimerTask && tasks.length > 0) {
      const firstPending = tasks.find(t => t.status === 'pending');
      if (firstPending) {
        setActiveTimerTask(firstPending);
        setTimerSecondsLeft(firstPending.durationMinutes * 60);
      }
    }
  }, [tasks, activeTimerTaskId, autoStartTimer, activeTimerTask, setAutoStartTimer]);

  // Focus Timer Tick
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timerSecondsLeft > 0) {
      interval = setInterval(() => {
        setTimerSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (timerSecondsLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      if (activeTimerTask) {
        completeTask(activeTimerTask.id);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSecondsLeft, activeTimerTask, completeTask]);

  const selectTaskForTimer = (task: StudyTask) => {
    setActiveTimerTask(task);
    setTimerSecondsLeft(task.durationMinutes * 60);
    setIsTimerRunning(false);
  };

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    if (activeTimerTask) {
      setTimerSecondsLeft(activeTimerTask.durationMinutes * 60);
    }
  };

  if (!activeSubject || !todayPlan) {
    return (
      <EmptyState
        title="No Active Study Plan for Today"
        description="Select an existing subject from the top bar or add a new syllabus to use today's checklist and focus timer."
      />
    );
  }

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const skippedCount = tasks.filter(t => t.status === 'skipped').length;
  const pendingCount = tasks.filter(t => t.status === 'pending').length;

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
              Execution Mode &bull; {todayPlan.dateString}
            </span>
            <span className="text-xs text-zinc-500">
              {completedCount}/{tasks.length} Completed
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight mt-1">
            Today&apos;s Focus Plan
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 mt-1">
            {todayPlan.focusTitle}
          </p>
        </div>

        <button
          onClick={manualReplan}
          className="self-start sm:self-auto px-3.5 py-2 text-xs font-semibold text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-xl shadow-xs flex items-center gap-1.5 transition"
        >
          <RefreshCw className="w-3.5 h-3.5 text-zinc-500" />
          <span>Replan Schedule</span>
        </button>
      </div>

      {/* Adaptive Replanning Notification Banner */}
      {notificationMessage && (
        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 flex items-center gap-3 transition-all animate-fade-in shadow-xs">
          <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
          <div className="text-xs sm:text-sm font-medium">
            {notificationMessage}
          </div>
        </div>
      )}

      {/* Main Grid: Active Focus Timer + Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Focus Sprint Timer */}
        <div className="p-6 rounded-2xl bg-gradient-to-b from-zinc-900 to-indigo-950 text-white shadow-md flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-3">
              <span className="uppercase tracking-wider font-semibold">Active Focus Block</span>
              <span className="px-2 py-0.5 rounded bg-white/10 text-zinc-300 font-mono text-[10px]">
                POMODORO SPRINT
              </span>
            </div>

            <h3 className="text-base font-bold text-white line-clamp-2">
              {activeTimerTask ? activeTimerTask.topicName : 'Select a study task to begin'}
            </h3>

            {activeTimerTask && (
              <p className="text-xs text-zinc-300 mt-1">
                {activeTimerTask.reason || 'High-priority syllabus core'}
              </p>
            )}

            {/* Timer Display */}
            <div className="my-8 text-center">
              <div className="text-5xl sm:text-6xl font-black tracking-tight font-mono text-indigo-100">
                {formatTimer(timerSecondsLeft)}
              </div>
              <p className="text-xs text-zinc-400 mt-2">
                {isTimerRunning ? 'Deep Focus Session in Progress...' : 'Ready to start'}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={toggleTimer}
                disabled={!activeTimerTask || timerSecondsLeft === 0}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2"
              >
                {isTimerRunning ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Start Sprint</span>
                  </>
                )}
              </button>

              <button
                onClick={resetTimer}
                disabled={!activeTimerTask}
                className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
                title="Reset Timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {activeTimerTask && activeTimerTask.status === 'pending' && (
              <button
                onClick={() => completeTask(activeTimerTask.id)}
                className="w-full py-2 text-xs font-semibold text-emerald-300 hover:text-white bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 rounded-lg transition text-center"
              >
                Mark Current Task Completed
              </button>
            )}
          </div>
        </div>

        {/* Right 2 Cols: Interactive Today's Checklist */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-4">
          
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-zinc-900">Today&apos;s Checklist</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Complete, skip, or adaptively replan as you study today.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                {completedCount} Done
              </span>
              {skippedCount > 0 && (
                <span className="text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded">
                  {skippedCount} Skipped
                </span>
              )}
            </div>
          </div>

          {/* Task List */}
          <div className="space-y-3">
            {tasks.map((task, idx) => {
              const isCompleted = task.status === 'completed';
              const isSkipped = task.status === 'skipped';
              const isTimerSelected = activeTimerTask?.id === task.id;

              return (
                <div
                  key={`${task.id}-${idx}`}
                  className={`p-4 rounded-xl border transition-all ${
                    isCompleted
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : isSkipped
                      ? 'bg-zinc-50 border-zinc-200 opacity-60'
                      : isTimerSelected
                      ? 'bg-indigo-50/40 border-indigo-300 ring-1 ring-indigo-300'
                      : 'bg-white border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    
                    {/* Checkbox & Topic Info */}
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        onClick={() => completeTask(task.id)}
                        disabled={isCompleted}
                        className={`mt-1 w-5 h-5 rounded-md border flex items-center justify-center transition shrink-0 ${
                          isCompleted
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-zinc-300 hover:border-indigo-600'
                        }`}
                      >
                        {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      <div className="min-w-0">
                        {/* 1. Topic name & 2. Duration & 3. Priority badge */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            onClick={() => selectTaskForTimer(task)}
                            title={task.topicName}
                            className={`text-sm font-bold cursor-pointer hover:text-indigo-600 transition truncate max-w-[280px] sm:max-w-md ${
                              isCompleted
                                ? 'line-through text-zinc-400'
                                : isSkipped
                                ? 'line-through text-zinc-400'
                                : 'text-zinc-900'
                            }`}
                          >
                            {task.topicName}
                          </span>

                          <span className="text-xs font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded shrink-0">
                            {task.durationMinutes} min
                          </span>

                          <span className={`text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded shrink-0 ${
                            task.priority === 'HIGH'
                              ? 'bg-rose-100 text-rose-800'
                              : task.priority === 'MEDIUM'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-zinc-100 text-zinc-700'
                          }`}>
                            {task.priority}
                          </span>
                        </div>

                        {/* Optional parent category & timeslot */}
                        <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                          {task.parentTopic && (
                            <span className="font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded text-[11px] truncate max-w-[200px]">
                              {activeSubject.name} &bull; {task.parentTopic}
                            </span>
                          )}
                          {task.startTime && task.endTime && (
                            <span className="text-zinc-400 text-[11px]">{task.startTime} – {task.endTime}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 4. Actions: [Focus] [Complete] [Skip & Replan] */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      
                      {!isCompleted && !isSkipped && (
                        <>
                          <button
                            onClick={() => selectTaskForTimer(task)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition flex items-center gap-1 ${
                              isTimerSelected
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
                            }`}
                            title="Load into focus timer"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Focus</span>
                          </button>

                          <button
                            onClick={() => completeTask(task.id)}
                            className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition"
                          >
                            Complete
                          </button>

                          <button
                            onClick={() => skipTaskAndReplan(task.id)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-zinc-600 hover:text-amber-800 bg-zinc-100 hover:bg-amber-50 border border-zinc-200 hover:border-amber-200 rounded-xl transition flex items-center gap-1"
                            title="Skip this task and automatically redistribute remaining time"
                          >
                            <SkipForward className="w-3.5 h-3.5" />
                            <span>Skip & Replan</span>
                          </button>
                        </>
                      )}

                      {isCompleted && (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50/80 border border-emerald-200/60 px-2.5 py-1 rounded-lg">
                          Completed ✓
                        </span>
                      )}

                      {isSkipped && (
                        <span className="text-xs font-medium text-zinc-400 bg-zinc-100 px-2.5 py-1 rounded-lg">
                          Skipped
                        </span>
                      )}

                    </div>

                  </div>
                </div>
              );
            })}
          </div>

          {/* Adaptive Replanning Explanation Callout */}
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-600 text-xs flex items-start gap-3 mt-4">
            <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-zinc-900 block">How Adaptive Replanning Works:</span>
              <p className="mt-0.5 leading-relaxed">
                When you click <strong>Skip & Replan</strong>, NotesSync does NOT merely shift tasks forward by one day (which causes cramming). It recomputes remaining available hours, prioritizes your high-priority weak topics, and adjusts the remaining schedule dynamically.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
