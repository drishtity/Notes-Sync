'use client';

import React, { useState } from 'react';
import { useNotesSync } from '@/lib/store';
import { generateLimitedTimePlan } from '@/lib/planner-engine';
import { LimitedTimePlan } from '@/lib/types';
import { 
  Clock, 
  Zap, 
  X, 
  ArrowRight, 
  Sparkles, 
  Target, 
  CheckCircle2, 
  Copy, 
  Check,
  AlertTriangle 
} from 'lucide-react';

const DURATION_PRESETS = [
  { label: '30 Minutes', minutes: 30, tag: 'Emergency Sprint' },
  { label: '1 Hour', minutes: 60, tag: 'Power Hour' },
  { label: '3 Hours', minutes: 180, tag: 'Deep Focus' },
  { label: '1 Day (6h)', minutes: 360, tag: 'Full Day Marathon' },
  { label: '3 Days (15h)', minutes: 900, tag: 'Weekend Bootcamp' },
];

export function LimitedTimeModal() {
  const { 
    isLimitedTimeOpen, 
    setIsLimitedTimeOpen, 
    activeSubject, 
    setCurrentView 
  } = useNotesSync();

  const [selectedPresetMins, setSelectedPresetMins] = useState<number>(180); // Default 3 hours like prompt example!
  const [customMinutes, setCustomMinutes] = useState<number>(120);
  const [isCustom, setIsCustom] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isLimitedTimeOpen || !activeSubject) return null;

  const allTopics = activeSubject.units.flatMap(u => u.topics);

  const activeMinutes = isCustom ? customMinutes : selectedPresetMins;
  const activeLabel = isCustom 
    ? `${customMinutes} Minutes` 
    : DURATION_PRESETS.find(p => p.minutes === selectedPresetMins)?.label || `${activeMinutes}m`;

  const totalWorkloadHours = activeSubject.plan?.totalEstimatedWorkloadHours || 
    Math.round(allTopics.reduce((acc, t) => acc + (t.estimatedMinutes || 30), 0) / 60);
  const availableSprintHours = (activeMinutes / 60).toFixed(1);

  const plan: LimitedTimePlan = generateLimitedTimePlan(
    allTopics,
    activeMinutes,
    activeLabel
  );

  const handleCopyPlan = () => {
    const text = `NotesSync ${plan.durationLabel.toUpperCase()} FOCUS PLAN:\n` +
      plan.focusTasks.map(t => `• ${t.topic} — ${t.minutes} min (${t.reason})`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartSprint = () => {
    setIsLimitedTimeOpen(false);
    setCurrentView('todays-plan');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden space-y-0 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 p-6 text-white relative shrink-0">
          <button
            onClick={() => setIsLimitedTimeOpen(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/20 text-white border border-white/25 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span>Time-Constrained Decision Mode</span>
            </span>
          </div>

          <h2 className="text-2xl font-black tracking-tight">
            Limited Time Focus Mode
          </h2>
          <p className="text-xs text-indigo-100 mt-1">
            Short on time before your exam? Choose how much time you have right now, and NotesSync will build a realistic high-impact sprint.
          </p>
        </div>

        {/* Preset Selector */}
        <div className="p-6 border-b border-zinc-100 bg-zinc-50/70 shrink-0 space-y-3">
          <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider block">
            Select Your Available Window:
          </label>
          
          <div className="flex flex-wrap gap-2">
            {DURATION_PRESETS.map((preset) => {
              const isSelected = !isCustom && selectedPresetMins === preset.minutes;
              return (
                <button
                  key={preset.minutes}
                  onClick={() => {
                    setIsCustom(false);
                    setSelectedPresetMins(preset.minutes);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex flex-col items-start ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  <span className="font-bold">{preset.label}</span>
                  <span className={`text-[10px] ${isSelected ? 'text-indigo-200' : 'text-zinc-400'}`}>
                    {preset.tag}
                  </span>
                </button>
              );
            })}

            <button
              onClick={() => setIsCustom(true)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex flex-col items-start ${
                isCustom
                  ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                  : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              <span className="font-bold">Custom</span>
              <span className={`text-[10px] ${isCustom ? 'text-indigo-200' : 'text-zinc-400'}`}>
                Specify mins
              </span>
            </button>
          </div>

          {isCustom && (
            <div className="pt-2 flex items-center gap-3">
              <input
                type="range"
                min={15}
                max={480}
                step={15}
                value={customMinutes}
                onChange={(e) => setCustomMinutes(parseInt(e.target.value))}
                className="flex-1 accent-indigo-600"
              />
              <span className="text-xs font-bold text-zinc-800 bg-white px-3 py-1 rounded-lg border border-zinc-200 min-w-[80px] text-center">
                {customMinutes} mins
              </span>
            </div>
          )}
        </div>

        {/* Comparison Banner */}
        <div className="p-3.5 mx-6 mt-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-200/80 text-amber-900 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
                <span>Available: <strong className="text-indigo-700 font-black">{availableSprintHours}h</strong></span>
                <span className="text-amber-400">&bull;</span>
                <span>Total Workload: <strong className="text-amber-900 font-black">{totalWorkloadHours}h</strong></span>
              </div>
              <p className="text-[11px] text-amber-800 mt-0.5">
                NotesSync prioritizes the highest-impact topics instead of creating an unrealistic schedule.
              </p>
            </div>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-200/70 text-amber-900 shrink-0 self-start sm:self-center">
            Realistic Filter
          </span>
        </div>

        {/* Generated Sprint Plan Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-zinc-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>{activeLabel.toUpperCase()} FOCUS PLAN</span>
            </h3>
            <button
              onClick={handleCopyPlan}
              className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Plan'}</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {plan.focusTasks.map((task, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/50 hover:bg-white transition flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900">{task.topic}</h4>
                    <p className="text-xs text-zinc-500">{task.reason}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 block">
                    {task.minutes} min
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-100 bg-zinc-50/80 flex items-center justify-between shrink-0">
          <span className="text-xs text-zinc-500">
            Engineered to extract highest points per minute
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLimitedTimeOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900"
            >
              Close
            </button>
            <button
              onClick={handleStartSprint}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <span>Execute Sprint in Today&apos;s Plan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
