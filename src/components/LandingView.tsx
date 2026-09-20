'use client';

import React from 'react';
import { useNotesSync } from '@/lib/store';
import { 
  Sparkles, 
  ArrowRight, 
  Clock, 
  Target, 
  BookCheck, 
  RefreshCw, 
  CheckCircle2, 
  Flame, 
  AlertTriangle
} from 'lucide-react';

export function LandingView() {
  const { setCurrentView } = useNotesSync();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between overflow-x-hidden w-full max-w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 w-full">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 border border-indigo-200 text-indigo-700 mb-6 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>AI-Powered Exam Preparation Decision Engine</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-zinc-900 tracking-tight text-balance max-w-4xl mx-auto leading-[1.15]">
            Stop asking what to study.{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              Know what to study next.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl text-zinc-600 max-w-3xl mx-auto leading-relaxed">
            NotesSync turns your syllabus, exam date, available time and weak topics into a personalized exam preparation plan.
          </p>

          {/* Call to Actions */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setCurrentView('add-subject')}
              className="w-full sm:w-auto px-8 py-4 text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <span>+ Add Your Subject Syllabus</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Compact 3-Step Visual Workflow */}
          <div className="mt-12 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-xs relative">
                <div className="text-[11px] font-black tracking-widest text-indigo-600 uppercase mb-1">
                  01 &bull; Upload Syllabus
                </div>
                <h3 className="text-sm font-bold text-zinc-900">Upload syllabus</h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Paste topics or syllabus text, set your exam date, and indicate confidence levels.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-xs relative">
                <div className="text-[11px] font-black tracking-widest text-indigo-600 uppercase mb-1">
                  02 &bull; AI Prioritizes Topics
                </div>
                <h3 className="text-sm font-bold text-zinc-900">AI prioritizes topics</h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Engine computes deterministic scores based on syllabus weight and weak areas.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-xs relative">
                <div className="text-[11px] font-black tracking-widest text-indigo-600 uppercase mb-1">
                  03 &bull; Get Next Best Action
                </div>
                <h3 className="text-sm font-bold text-zinc-900">Get next best action</h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Focus on the single highest-yield study sprint without timetable overwhelm.
                </p>
              </div>
            </div>
          </div>

          {/* Key Differentiator Banner */}
          <div className="mt-8 max-w-3xl mx-auto p-5 rounded-2xl bg-gradient-to-b from-zinc-50 to-zinc-100/70 border border-zinc-200 text-left shadow-xs">
            <div className="flex items-start gap-3.5">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800 mt-0.5 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">
                    The NotesSync Differentiator
                  </h2>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Not a Fake Timetable
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-zinc-600 leading-relaxed">
                  Most study tools build impossible schedules. If your syllabus takes <strong>14 hours</strong> but you only have <strong>6 hours</strong> before your exam, NotesSync won&apos;t dump an unachievable schedule on you.
                </p>
                <div className="mt-3 p-3 rounded-lg bg-white border border-zinc-200/80 text-xs sm:text-sm font-medium text-zinc-700 flex items-center gap-2">
                  <span className="text-indigo-600 font-bold">Engine Guarantee:</span>
                  <span>&ldquo;You have 6 hours available but approximately 14 hours of material. We&apos;ve prioritized the highest-impact topics for your available time.&rdquo;</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="py-12 bg-zinc-50/70 border-y border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900">
              Engineered for College Exam Reality
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              Deterministic priority algorithms backed by syllabus intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1: Know What Matters */}
            <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-zinc-900">Know What Matters</h3>
              <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
                Deterministic priority scoring factoring syllabus importance, student weakness, difficulty, dependencies, and past papers.
              </p>
            </div>

            {/* Card 2: Use Your Time Wisely */}
            <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-zinc-900">Use Your Time Wisely</h3>
              <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
                Plans built strictly around your actual available study hours. Limited Time Mode creates focused 30m, 1h, or 3h study sprints.
              </p>
            </div>

            {/* Card 3: Practice What Counts */}
            <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <BookCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-zinc-900">Practice What Counts</h3>
              <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
                Targeted practice questions categorized by priority and difficulty without false exam question promises.
              </p>
            </div>

            {/* Card 4: Recover When You Fall Behind */}
            <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <RefreshCw className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-zinc-900">Recover When You Fall Behind</h3>
              <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
                Adaptive replanning that recalculates remaining hours and protects high-yield topics instead of shifting tasks blindly.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="py-6 border-t border-zinc-200 text-center text-xs text-zinc-500">
        <p>NotesSync &bull; Your syllabus. Your time. Your plan.</p>
      </footer>
    </div>
  );
}
