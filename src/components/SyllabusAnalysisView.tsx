'use client';

import React, { useState } from 'react';
import { useNotesSync } from '@/lib/store';
import { PriorityLevel, ConfidenceLevel, Topic } from '@/lib/types';
import { calculateTopicPriority } from '@/lib/priority-engine';
import { 
  Layers, 
  Clock, 
  Target, 
  ArrowRight, 
  Info, 
  Filter, 
  CheckCircle2, 
  Flame, 
  HelpCircle,
  BarChart2
} from 'lucide-react';

import { EmptyState } from '@/components/EmptyState';

export function SyllabusAnalysisView() {
  const { activeSubject, updateTopicConfidence, setCurrentView } = useNotesSync();
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [showFormulaModal, setShowFormulaModal] = useState(false);

  if (!activeSubject) {
    return (
      <EmptyState
        title="No Syllabus Analyzed"
        description="Select an existing course or add your syllabus to view unit extraction, learning effort estimates, and deterministic priority scores."
      />
    );
  }

  const allTopics = activeSubject.units.flatMap(u => u.topics);
  const totalWorkloadMinutes = allTopics.reduce((acc, t) => acc + (t.estimatedMinutes || 30), 0);
  const totalWorkloadHours = (totalWorkloadMinutes / 60).toFixed(1);

  const highPriorityCount = allTopics.filter(t => t.priorityLevel === 'HIGH').length;
  const mediumPriorityCount = allTopics.filter(t => t.priorityLevel === 'MEDIUM').length;
  const lowPriorityCount = allTopics.filter(t => t.priorityLevel === 'LOW').length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
              Syllabus Analysis & Priority Engine
            </span>
            <span className="text-xs text-zinc-500">
              {activeSubject.units.length} Units &bull; {allTopics.length} Topics
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight mt-1">
            {activeSubject.name}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 mt-1">
            Every topic is evaluated with deterministic scoring based on syllabus weight, student weakness, difficulty, and dependencies.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowFormulaModal(true)}
            className="px-3.5 py-2 text-xs font-semibold text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-xl shadow-xs flex items-center gap-1.5 transition"
          >
            <HelpCircle className="w-4 h-4 text-indigo-600" />
            <span>How Priority is Calculated</span>
          </button>
          <button
            onClick={() => setCurrentView('study-plan')}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm flex items-center gap-1.5 transition"
          >
            <span>View Study Plan</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-xs">
          <span className="text-xs text-zinc-500 font-medium">Estimated Workload</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black text-zinc-900">{totalWorkloadHours}</span>
            <span className="text-xs text-zinc-500">hours</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">Across {allTopics.length} topics</p>
        </div>

        <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200/80 shadow-xs">
          <span className="text-xs text-rose-700 font-bold uppercase tracking-wider">High Priority</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black text-rose-700">{highPriorityCount}</span>
            <span className="text-xs text-rose-600">topics (80–100)</span>
          </div>
          <p className="text-[11px] text-rose-600/80 mt-0.5">Focus first for maximum yield</p>
        </div>

        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 shadow-xs">
          <span className="text-xs text-amber-800 font-bold uppercase tracking-wider">Medium Priority</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black text-amber-800">{mediumPriorityCount}</span>
            <span className="text-xs text-amber-700">topics (50–79)</span>
          </div>
          <p className="text-[11px] text-amber-700/80 mt-0.5">Standard core curriculum</p>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 shadow-xs">
          <span className="text-xs text-emerald-800 font-bold uppercase tracking-wider">Low Priority</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black text-emerald-800">{lowPriorityCount}</span>
            <span className="text-xs text-emerald-700">topics (0–49)</span>
          </div>
          <p className="text-[11px] text-emerald-700/80 mt-0.5">Quick review / familiar</p>
        </div>

      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
        <div className="flex items-center gap-1">
          <span className="text-xs text-zinc-500 mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </span>
          {['ALL', 'HIGH', 'MEDIUM', 'LOW', 'WEAK'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterPriority(tab)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                filterPriority === tab
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              {tab === 'WEAK' ? 'My Weak Topics' : tab}
            </button>
          ))}
        </div>
        <span className="text-xs text-zinc-500 hidden sm:inline">
          Tip: You can change your confidence directly in the table below to recalibrate priority.
        </span>
      </div>

      {/* Units & Topics Accordion / Tables */}
      <div className="space-y-6">
        {activeSubject.units.map((unit, uIdx) => {
          const filteredTopics = unit.topics.filter(t => {
            if (filterPriority === 'ALL') return true;
            if (filterPriority === 'WEAK') return t.confidence === 'weak';
            return t.priorityLevel === filterPriority;
          });

          if (filteredTopics.length === 0) return null;

          return (
            <div key={unit.id} className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-xs">
              
              {/* Unit Header */}
              <div className="bg-zinc-50/80 px-5 py-3.5 border-b border-zinc-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                    {uIdx + 1}
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900">{unit.name}</h3>
                </div>
                <span className="text-xs text-zinc-500">
                  {filteredTopics.length} {filteredTopics.length === 1 ? 'topic' : 'topics'}
                </span>
              </div>

              {/* Topics Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 text-zinc-500 font-semibold uppercase tracking-wider text-[10px] border-b border-zinc-200">
                    <tr>
                      <th className="px-5 py-3">Topic</th>
                      <th className="px-3 py-3">Difficulty</th>
                      <th className="px-3 py-3">Est. Time</th>
                      <th className="px-3 py-3">Student Confidence</th>
                      <th className="px-3 py-3 text-center">Priority Score</th>
                      <th className="px-5 py-3 text-right">Priority Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredTopics.map((topic) => (
                      <tr key={topic.id} className="hover:bg-zinc-50/50 transition">
                        
                        {/* Topic Name */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-zinc-900 text-sm" title={topic.name}>
                              {topic.name}
                            </span>
                            {topic.parentTopic && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 font-medium border border-zinc-200">
                                {topic.parentTopic}
                              </span>
                            )}
                          </div>
                          {topic.dependencies && topic.dependencies.length > 0 && (
                            <span className="text-[10px] text-zinc-500 block mt-0.5">
                              Requires: {topic.dependencies.join(', ')}
                            </span>
                          )}
                        </td>

                        {/* Difficulty */}
                        <td className="px-3 py-3.5">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <div
                                key={star}
                                className={`w-1.5 h-3.5 rounded-xs ${
                                  star <= topic.difficulty 
                                    ? topic.difficulty >= 4 ? 'bg-rose-500' : 'bg-indigo-600' 
                                    : 'bg-zinc-200'
                                }`}
                              />
                            ))}
                            <span className="ml-1.5 text-zinc-600 font-medium">{topic.difficulty}/5</span>
                          </div>
                        </td>

                        {/* Estimated Time */}
                        <td className="px-3 py-3.5 font-medium text-zinc-700">
                          {topic.estimatedMinutes} mins
                        </td>

                        {/* Confidence Picker */}
                        <td className="px-3 py-3.5">
                          <div className="inline-flex rounded-lg border border-zinc-200 p-0.5 bg-zinc-50">
                            {(['weak', 'average', 'strong'] as ConfidenceLevel[]).map((conf) => (
                              <button
                                key={conf}
                                onClick={() => updateTopicConfidence(topic.id, conf)}
                                className={`px-2 py-0.5 text-[10px] font-semibold rounded capitalize transition ${
                                  topic.confidence === conf
                                    ? conf === 'weak'
                                      ? 'bg-rose-600 text-white shadow-xs'
                                      : conf === 'strong'
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'bg-zinc-800 text-white shadow-xs'
                                    : 'text-zinc-600 hover:text-zinc-900'
                                }`}
                              >
                                {conf}
                              </button>
                            ))}
                          </div>
                        </td>

                        {/* Priority Score */}
                        <td className="px-3 py-3.5 text-center">
                          <span className="font-extrabold text-sm text-zinc-900">
                            {topic.priorityScore}
                          </span>
                          <span className="text-[10px] text-zinc-400">/100</span>
                        </td>

                        {/* Priority Badge */}
                        <td className="px-5 py-3.5 text-right">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                            topic.priorityLevel === 'HIGH'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : topic.priorityLevel === 'MEDIUM'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {topic.priorityLevel}
                          </span>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          );
        })}
      </div>

      {/* Priority Engine Explanation Modal */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="max-w-xl w-full bg-white rounded-2xl p-6 shadow-xl border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                <span>Deterministic Priority Formula</span>
              </h3>
              <button
                onClick={() => setShowFormulaModal(false)}
                className="text-zinc-400 hover:text-zinc-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-600">
              NotesSync never leaves priority to arbitrary LLM guesswork. We use a deterministic application algorithm to compute a normalized 0–100 score:
            </p>

            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span>&bull; Syllabus Importance:</span>
                <span className="font-bold text-indigo-700">25%</span>
              </div>
              <div className="flex justify-between">
                <span>&bull; Topic Difficulty:</span>
                <span className="font-bold text-indigo-700">15%</span>
              </div>
              <div className="flex justify-between">
                <span>&bull; Student Weakness:</span>
                <span className="font-bold text-indigo-700">25%</span>
              </div>
              <div className="flex justify-between">
                <span>&bull; Topic Dependencies:</span>
                <span className="font-bold text-indigo-700">15%</span>
              </div>
              <div className="flex justify-between">
                <span>&bull; Past-Paper Frequency:</span>
                <span className="font-bold text-indigo-700">20%</span>
              </div>
            </div>

            <p className="text-[11px] text-zinc-500">
              * Note: If past exam papers are not supplied, the 20% weight is proportionally redistributed across the other 4 parameters (31.25%, 18.75%, 31.25%, 18.75%).
            </p>

            <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-rose-50 border border-rose-200">
                <span className="font-bold text-rose-800 block">80 – 100</span>
                <span className="text-[10px] text-rose-600 font-semibold">HIGH PRIORITY</span>
              </div>
              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
                <span className="font-bold text-amber-800 block">50 – 79</span>
                <span className="text-[10px] text-amber-600 font-semibold">MEDIUM PRIORITY</span>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                <span className="font-bold text-emerald-800 block">0 – 49</span>
                <span className="text-[10px] text-emerald-600 font-semibold">LOW PRIORITY</span>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                onClick={() => setShowFormulaModal(false)}
                className="px-4 py-2 text-xs font-semibold bg-zinc-900 text-white rounded-xl"
              >
                Close Explanation
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
