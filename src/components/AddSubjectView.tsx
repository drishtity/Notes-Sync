'use client';

import React, { useState } from 'react';
import { useNotesSync } from '@/lib/store';
import { Subject, Unit, Topic, PracticeQuestion } from '@/lib/types';
import { scoreAllTopics } from '@/lib/priority-engine';
import { generateStudyPlan } from '@/lib/planner-engine';
import { 
  Sparkles, 
  Upload, 
  FileText, 
  Calendar, 
  Clock, 
  Percent, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  FileQuestion
} from 'lucide-react';


export function AddSubjectView() {
  const { addSubject, setCurrentView } = useNotesSync();

  // Form State
  const [subjectName, setSubjectName] = useState('');
  const [examDate, setExamDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [availableHours, setAvailableHours] = useState(3);
  const [currentPrep, setCurrentPrep] = useState(25);
  const [syllabusText, setSyllabusText] = useState('');
  const [weakTopicsStr, setWeakTopicsStr] = useState('');
  const [strongTopicsStr, setStrongTopicsStr] = useState('');
  const [pastPapersText, setPastPapersText] = useState('');
  const [showPastPapers, setShowPastPapers] = useState(false);

  // Status & Error
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Calculate days remaining
  const calculateDaysLeft = (dateString: string): number => {
    const target = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const daysRemaining = calculateDaysLeft(examDate);

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setSyllabusText(content);
        if (!subjectName) {
          const guessedName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          setSubjectName(guessedName);
        }
      }
    };
    reader.readAsText(file);
  };

  // Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Basic Validations
    if (!subjectName.trim()) {
      setErrorMessage('Please provide a subject name.');
      return;
    }
    if (!syllabusText.trim()) {
      setErrorMessage('Please paste or upload your syllabus text.');
      return;
    }
    if (syllabusText.trim().length < 20) {
      setErrorMessage('Syllabus is too brief. Please paste the units or topics.');
      return;
    }
    if (availableHours <= 0) {
      setErrorMessage('Available study time must be at least 1 hour per day.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/analyze-syllabus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syllabusText,
          subjectName: subjectName.trim(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to extract syllabus.');
      }

      const extracted = await res.json();

      // Parse user's confidence
      const weakList = weakTopicsStr.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      const strongList = strongTopicsStr.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

      const isTopicWeak = (name: string) => weakList.some(w => name.toLowerCase().includes(w));
      const isTopicStrong = (name: string) => strongList.some(s => name.toLowerCase().includes(s));

      // Flatten topics and score them deterministically
      const flatTopics = (extracted.units || []).flatMap((unit: { name: string; topics: { name: string; parentTopic?: string; difficulty?: number; estimatedMinutes?: number; dependencies?: string[] }[] }, uIdx: number) => 
        (unit.topics || []).map((t, tIdx: number) => {
          let conf: 'weak' | 'average' | 'strong' = 'average';
          if (isTopicWeak(t.name) || (t.parentTopic && isTopicWeak(t.parentTopic))) conf = 'weak';
          else if (isTopicStrong(t.name) || (t.parentTopic && isTopicStrong(t.parentTopic))) conf = 'strong';

          return {
            id: `topic-${uIdx + 1}-${tIdx + 1}-${Date.now().toString(36)}`,
            name: t.name,
            parentTopic: t.parentTopic,
            unitName: unit.name,
            difficulty: t.difficulty || 3,
            estimatedMinutes: t.estimatedMinutes || 30,
            dependencies: t.dependencies || [],
            confidence: conf,
            syllabusImportance: 4,
            pastPaperFrequency: pastPapersText ? 3 : undefined,
          };
        })
      );

      const scoredTopics = scoreAllTopics(flatTopics, Boolean(pastPapersText));

      // Regroup into Units
      const unitMap = new Map<string, Topic[]>();
      for (const t of scoredTopics) {
        if (!unitMap.has(t.unitName)) {
          unitMap.set(t.unitName, []);
        }
        unitMap.get(t.unitName)!.push(t);
      }

      const finalUnits: Unit[] = Array.from(unitMap.entries()).map(([name, topics], idx) => ({
        id: `unit-${idx + 1}-${Date.now().toString(36)}`,
        name,
        topics,
      }));

      // Generate Practice Questions
      let finalQuestions: PracticeQuestion[] = [];
      try {
        const qRes = await fetch('/api/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            syllabusText,
            topics: flatTopics.map((t: { name: string }) => t.name).slice(0, 8),
            pastPapersText: pastPapersText || undefined,
          }),
        });

        if (qRes.ok) {
          const qData = await qRes.json();
          finalQuestions = (qData.questions || []).map((q: { topic: string; question: string; category?: string; priority?: string; difficulty?: string; estimatedMinutes?: number }, idx: number) => {
            // Strictly match question priority to actual calculated topic priority
            const matchedTopic = scoredTopics.find(t => 
              t.name.toLowerCase() === q.topic.toLowerCase() ||
              q.topic.toLowerCase().includes(t.name.toLowerCase()) ||
              t.name.toLowerCase().includes(q.topic.toLowerCase())
            );

            const actualPriority = matchedTopic ? matchedTopic.priorityLevel : ((q.priority as 'HIGH' | 'MEDIUM' | 'LOW') || 'MEDIUM');
            const actualCategory = actualPriority === 'HIGH' ? 'High Priority' : actualPriority === 'MEDIUM' ? 'Medium Priority' : 'Quick Revision';

            return {
              id: `q-${idx + 1}-${Date.now().toString(36)}`,
              topic: matchedTopic ? matchedTopic.name : q.topic,
              question: q.question,
              category: actualCategory,
              priority: actualPriority,
              difficulty: (q.difficulty as 'Easy' | 'Medium' | 'Hard') || (actualPriority === 'HIGH' ? 'Hard' : actualPriority === 'MEDIUM' ? 'Medium' : 'Easy'),
              estimatedMinutes: q.estimatedMinutes || (actualPriority === 'HIGH' ? 25 : actualPriority === 'MEDIUM' ? 15 : 10),
              frequency: pastPapersText ? 3 : undefined,
              inPlan: idx < 3,
              completed: false,
            };
          });
        }
      } catch (qErr) {
        console.warn('Practice question generation fallback:', qErr);
      }

      // Generate Study Plan
      const subjectId = `sub-${Date.now().toString(36)}`;
      const plan = generateStudyPlan(subjectId, scoredTopics, daysRemaining, availableHours);

      const newSubject: Subject = {
        id: subjectId,
        name: subjectName.trim(),
        examDate,
        examDaysFromNow: daysRemaining,
        availableHoursPerDay: availableHours,
        currentPreparationPercentage: currentPrep,
        rawSyllabusText: syllabusText,
        pastPapersProvided: Boolean(pastPapersText.trim()),
        confidence: {
          strong: strongTopicsStr.split(',').map(s => s.trim()).filter(Boolean),
          average: [],
          weak: weakTopicsStr.split(',').map(s => s.trim()).filter(Boolean),
        },
        units: finalUnits,
        questions: finalQuestions,
        plan,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      addSubject(newSubject);
    } catch (err: unknown) {
      console.error('Add Subject Error:', err);
      setErrorMessage(
        err instanceof Error && !err.message.includes('API') && !err.message.includes('key')
          ? err.message
          : 'Unable to analyze syllabus. Please verify your inputs and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
          Add New Subject & Syllabus
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Let NotesSync analyze your syllabus, calculate topic priority, and construct a realistic plan.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold">Analysis Notice</h4>
            <p className="text-xs text-rose-700 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Analysis Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="max-w-xs w-full bg-white rounded-3xl p-6 text-center space-y-3 shadow-2xl border border-zinc-200">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">Analysing...</h3>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Core Details Grid */}
        <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-5">
          <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-100 pb-2">
            1. Exam Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Subject Name */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Subject / Course Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Computer Networks, Linear Algebra, Machine Learning"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Exam Date */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5 flex items-center justify-between">
                <span>Exam Date *</span>
                <span className="text-indigo-600 font-bold">{daysRemaining} days remaining</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
            {/* Available Study Hours */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-zinc-700">
                  Available Study Hours Per Day *
                </label>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  {availableHours} hours / day
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={0.5}
                value={availableHours}
                onChange={(e) => setAvailableHours(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Total available study runway: <strong>{availableHours * daysRemaining} hours</strong>
              </p>
            </div>

            {/* Current Preparation Level */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-zinc-700">
                  Current Readiness Self-Assessment
                </label>
                <span className="text-xs font-bold text-zinc-700">
                  {currentPrep}% prepared
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={currentPrep}
                onChange={(e) => setCurrentPrep(parseInt(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Helps calibrate the initial review velocity
              </p>
            </div>
          </div>
        </div>

        {/* Confidence & Weaknesses */}
        <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-100 pb-2">
            2. Topic Confidence & Weaknesses
          </h2>
          <p className="text-xs text-zinc-600">
            NotesSync uses this directly in its deterministic priority engine (25% weight) to target high-leverage areas.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-rose-700 mb-1">
                Weak / Difficult Topics (Comma-separated)
              </label>
              <input
                type="text"
                placeholder="e.g. Normalization, BCNF, Recovery"
                value={weakTopicsStr}
                onChange={(e) => setWeakTopicsStr(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50/20 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">
                Will receive HIGH priority scheduling weight
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-emerald-700 mb-1">
                Strong / Familiar Topics (Comma-separated)
              </label>
              <input
                type="text"
                placeholder="e.g. SQL, ER Model"
                value={strongTopicsStr}
                onChange={(e) => setStrongTopicsStr(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50/20 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">
                Scheduled for rapid revision rather than deep study
              </span>
            </div>
          </div>
        </div>

        {/* Syllabus Input */}
        <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
            <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
              3. Course Syllabus
            </h2>
            <label className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Syllabus File</span>
              <input
                type="file"
                accept=".txt,.md,.text"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <textarea
              rows={8}
              placeholder="Paste your course syllabus, course outline, or unit list here...&#10;&#10;Unit 1: Fundamentals...&#10;Unit 2: Architecture & Protocols..."
              value={syllabusText}
              onChange={(e) => setSyllabusText(e.target.value)}
              required
              className="w-full p-4 rounded-xl border border-zinc-200 font-mono text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Optional Past Papers */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowPastPapers(!showPastPapers)}
              className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 flex items-center gap-1.5"
            >
              <FileQuestion className="w-4 h-4 text-indigo-600" />
              <span>{showPastPapers ? 'Hide Past Exam Papers (Optional)' : '+ Add Previous-Year Exam Papers (Optional)'}</span>
            </button>

            {showPastPapers && (
              <div className="mt-3">
                <textarea
                  rows={4}
                  placeholder="Paste questions or recurrent topics from previous years' semester exams to calibrate past-paper frequency weight (20%)..."
                  value={pastPapersText}
                  onChange={(e) => setPastPapersText(e.target.value)}
                  className="w-full p-3 rounded-xl border border-zinc-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setCurrentView('landing')}
            className="px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl shadow-sm transition flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analysing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Analyze Subject</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
