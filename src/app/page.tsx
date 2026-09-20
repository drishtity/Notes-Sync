'use client';

import React from 'react';
import { useNotesSync } from '@/lib/store';
import { Navbar } from '@/components/Navbar';
import { LandingView } from '@/components/LandingView';
import { DashboardView } from '@/components/DashboardView';
import { AddSubjectView } from '@/components/AddSubjectView';
import { SyllabusAnalysisView } from '@/components/SyllabusAnalysisView';
import { QuestionsView } from '@/components/QuestionsView';
import { StudyPlanView } from '@/components/StudyPlanView';
import { TodaysPlanView } from '@/components/TodaysPlanView';
import { ProgressView } from '@/components/ProgressView';
import { WhatToStudyModal } from '@/components/WhatToStudyModal';
import { LimitedTimeModal } from '@/components/LimitedTimeModal';

export default function Home() {
  const { currentView } = useNotesSync();

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50/50">
      <Navbar />

      <main className="flex-1">
        {currentView === 'landing' && <LandingView />}
        {currentView === 'dashboard' && <DashboardView />}
        {currentView === 'add-subject' && <AddSubjectView />}
        {currentView === 'syllabus-analysis' && <SyllabusAnalysisView />}
        {currentView === 'questions' && <QuestionsView />}
        {currentView === 'study-plan' && <StudyPlanView />}
        {currentView === 'todays-plan' && <TodaysPlanView />}
        {currentView === 'progress' && <ProgressView />}
      </main>

      {/* Global Interactive Modals */}
      <WhatToStudyModal />
      <LimitedTimeModal />
    </div>
  );
}
