'use client';

import React from 'react';
import { useNotesSync } from '@/lib/store';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  Target, 
  Flame, 
  Sparkles,
  TrendingUp
} from 'lucide-react';

import { EmptyState } from '@/components/EmptyState';

const PRIORITY_COLORS: Record<string, string> = {
  'HIGH': '#e11d48',    // rose-600
  'MEDIUM': '#d97706',  // amber-600
  'LOW': '#059669',     // emerald-600
};

export function ProgressView() {
  const { activeSubject, setCurrentView } = useNotesSync();

  if (!activeSubject) {
    return (
      <EmptyState
        title="No Readiness Analytics Yet"
        description="Add a subject or select one from the navigation bar to view unit mastery charts, readiness percentages, and study hour tracking."
      />
    );
  }

  const allTopics = activeSubject.units.flatMap(u => u.topics);
  const totalTopicsCount = allTopics.length;
  const completedTopics = allTopics.filter(t => t.completed);
  const remainingTopics = allTopics.filter(t => !t.completed);

  const highPriorityTopics = allTopics.filter(t => t.priorityLevel === 'HIGH');
  const completedHighPriority = highPriorityTopics.filter(t => t.completed).length;
  const highPriorityPct = highPriorityTopics.length > 0 
    ? Math.round((completedHighPriority / highPriorityTopics.length) * 100) 
    : 0;

  // Study hours completed vs remaining
  const completedMins = completedTopics.reduce((a, t) => a + (t.estimatedMinutes || 30), 0);
  const remainingMins = remainingTopics.reduce((a, t) => a + (t.estimatedMinutes || 30), 0);
  const completedHours = (completedMins / 60).toFixed(1);
  const remainingHours = (remainingMins / 60).toFixed(1);

  // Recharts Data 1: Unit Progress
  const unitChartData = activeSubject.units.map(u => {
    const total = u.topics.length;
    const completed = u.topics.filter(t => t.completed).length;
    return {
      name: u.name.split(':')[0] || u.name.slice(0, 8),
      fullName: u.name,
      completed,
      remaining: total - completed,
      total,
    };
  });

  // Recharts Data 2: Priority Breakdown
  const priorityChartData = [
    { name: 'HIGH', value: allTopics.filter(t => t.priorityLevel === 'HIGH').length },
    { name: 'MEDIUM', value: allTopics.filter(t => t.priorityLevel === 'MEDIUM').length },
    { name: 'LOW', value: allTopics.filter(t => t.priorityLevel === 'LOW').length },
  ].filter(d => d.value > 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
              Exam Readiness Analytics
            </span>
            <span className="text-xs text-zinc-500">
              {activeSubject.examDaysFromNow} days until exam
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight mt-1">
            {activeSubject.name} &bull; Progress
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 mt-1">
            Monitor topic coverage, high-priority mastery, and remaining study effort.
          </p>
        </div>

        <button
          onClick={() => setCurrentView('todays-plan')}
          className="self-start sm:self-auto px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition"
        >
          Resume Today&apos;s Plan
        </button>
      </div>

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        {/* Readiness % */}
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium uppercase tracking-wider">Exam Readiness</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-zinc-900">{activeSubject.currentPreparationPercentage}%</span>
          </div>
          <div className="mt-2 w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, activeSubject.currentPreparationPercentage)}%` }}
            />
          </div>
        </div>

        {/* Completed vs Total Topics */}
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium uppercase tracking-wider">Topics Mastered</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-zinc-900">{completedTopics.length}</span>
            <span className="text-xs text-zinc-500 font-medium">/ {totalTopicsCount}</span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">
            {remainingTopics.length} topics left to study
          </p>
        </div>

        {/* High-Priority Completion */}
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium uppercase tracking-wider">High-Priority Yield</span>
            <Target className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-rose-600">{highPriorityPct}%</span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">
            {completedHighPriority} of {highPriorityTopics.length} high-impact topics done
          </p>
        </div>

        {/* Study Hours */}
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium uppercase tracking-wider">Study Hours</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-zinc-900">{completedHours}h</span>
            <span className="text-xs text-zinc-500 font-medium">completed</span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">
            {remainingHours}h remaining syllabus workload
          </p>
        </div>

      </div>

      {/* Recharts Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Unit Completion Breakdown (Bar Chart) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-900">Unit-by-Unit Topic Mastery</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Completed vs remaining topics across each syllabus module
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={unitChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#71717a' }} />
                <YAxis tick={{ fontSize: 11, fill: '#71717a' }} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e4e4e7', fontSize: '12px' }}
                />
                <Bar dataKey="completed" name="Completed Topics" stackId="a" fill="#4f46e5" radius={[0, 0, 4, 4]} />
                <Bar dataKey="remaining" name="Remaining Topics" stackId="a" fill="#e4e4e7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Level Breakdown (Donut Chart) */}
        <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-900">Priority Distribution</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Topics categorized by deterministic priority score
            </p>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {priorityChartData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={PRIORITY_COLORS[entry.name] || '#6366f1'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e4e4e7', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs border-t border-zinc-100 pt-3">
            <div>
              <span className="font-extrabold text-rose-600 block">
                {allTopics.filter(t => t.priorityLevel === 'HIGH').length}
              </span>
              <span className="text-[10px] text-zinc-500 uppercase font-semibold">HIGH</span>
            </div>
            <div>
              <span className="font-extrabold text-amber-600 block">
                {allTopics.filter(t => t.priorityLevel === 'MEDIUM').length}
              </span>
              <span className="text-[10px] text-zinc-500 uppercase font-semibold">MEDIUM</span>
            </div>
            <div>
              <span className="font-extrabold text-emerald-600 block">
                {allTopics.filter(t => t.priorityLevel === 'LOW').length}
              </span>
              <span className="text-[10px] text-zinc-500 uppercase font-semibold">LOW</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
