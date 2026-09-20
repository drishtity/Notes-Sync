'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Subject, Topic, StudyPlan, PracticeQuestion, StudyTask, PriorityLevel } from './types';
import { adaptiveReplan, generateStudyPlan } from './planner-engine';
import confetti from 'canvas-confetti';

export type ActiveView = 
  | 'landing' 
  | 'dashboard' 
  | 'add-subject' 
  | 'syllabus-analysis' 
  | 'questions' 
  | 'study-plan' 
  | 'todays-plan' 
  | 'progress';

interface NotesSyncContextType {
  subjects: Subject[];
  activeSubject: Subject | null;
  activeSubjectId: string | null;
  currentView: ActiveView;
  isWhatToStudyOpen: boolean;
  isLimitedTimeOpen: boolean;
  notificationMessage: string | null;
  activeTimerTaskId: string | null;
  autoStartTimer: boolean;
  setCurrentView: (view: ActiveView) => void;
  setActiveSubjectId: (id: string) => void;
  setIsWhatToStudyOpen: (open: boolean) => void;
  setIsLimitedTimeOpen: (open: boolean) => void;
  setNotificationMessage: (msg: string | null) => void;
  setActiveTimerTaskId: (id: string | null) => void;
  setAutoStartTimer: (val: boolean) => void;
  startFocusSession: (taskId?: string) => void;
  addSubject: (newSubject: Subject) => void;
  deleteSubject: (id: string) => void;
  completeTask: (taskId: string) => void;
  skipTaskAndReplan: (taskId: string) => void;
  manualReplan: () => void;
  toggleTopicCompleted: (topicId: string) => void;
  toggleQuestionInPlan: (questionId: string) => void;
  toggleQuestionCompleted: (questionId: string) => void;
  updateTopicConfidence: (topicId: string, confidence: 'weak' | 'average' | 'strong') => void;
}

const NotesSyncContext = createContext<NotesSyncContextType | undefined>(undefined);

const STORAGE_KEY = 'notessync_subjects_v1';
const ACTIVE_SUB_KEY = 'notessync_active_sub_v1';

export function NotesSyncProvider({ children }: { children: ReactNode }) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeSubjectId, setActiveSubjectIdState] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ActiveView>('dashboard');
  const [isWhatToStudyOpen, setIsWhatToStudyOpen] = useState(false);
  const [isLimitedTimeOpen, setIsLimitedTimeOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);
  const [activeTimerTaskId, setActiveTimerTaskId] = useState<string | null>(null);
  const [autoStartTimer, setAutoStartTimer] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize from LocalStorage (strip legacy demo entries if any exist)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const storedActiveId = localStorage.getItem(ACTIVE_SUB_KEY);
      if (stored) {
        const parsed = (JSON.parse(stored) as Subject[]).filter(s => s.id !== 'sub-dbms-demo');
        setSubjects(parsed);
        if (storedActiveId && storedActiveId !== 'sub-dbms-demo' && parsed.some(s => s.id === storedActiveId)) {
          setActiveSubjectIdState(storedActiveId);
        } else if (parsed.length > 0) {
          setActiveSubjectIdState(parsed[0].id);
        } else {
          setActiveSubjectIdState(null);
          localStorage.removeItem(ACTIVE_SUB_KEY);
        }
      }
    } catch (e) {
      console.error('Failed to load stored subjects:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
      if (activeSubjectId) {
        localStorage.setItem(ACTIVE_SUB_KEY, activeSubjectId);
      } else {
        localStorage.removeItem(ACTIVE_SUB_KEY);
      }
    } catch (e) {
      console.error('Failed to save subjects to storage:', e);
    }
  }, [subjects, activeSubjectId, isLoaded]);

  const activeSubject = subjects.find(s => s.id === activeSubjectId) || null;

  const setActiveSubjectId = (id: string) => {
    setActiveSubjectIdState(id);
  };

  const showNotification = (msg: string) => {
    setNotificationMessage(msg);
    setTimeout(() => {
      setNotificationMessage(null);
    }, 5000);
  };

  const addSubject = (newSubject: Subject) => {
    const updated = [newSubject, ...subjects.filter(s => s.id !== newSubject.id)];
    setSubjects(updated);
    setActiveSubjectIdState(newSubject.id);
    setCurrentView('syllabus-analysis');
    showNotification(`Subject "${newSubject.name}" created with priority analysis!`);
  };

  const deleteSubject = (id: string) => {
    const toDelete = subjects.find(s => s.id === id);
    const updated = subjects.filter(s => s.id !== id);
    setSubjects(updated);
    if (activeSubjectId === id) {
      if (updated.length > 0) {
        setActiveSubjectIdState(updated[0].id);
      } else {
        setActiveSubjectIdState(null);
        setCurrentView('landing');
        try {
          localStorage.removeItem(ACTIVE_SUB_KEY);
        } catch (e) {
          console.error(e);
        }
      }
    }
    if (toDelete) {
      showNotification(`Subject "${toDelete.name}" deleted.`);
    }
  };

  const recalculateProgress = (subject: Subject): number => {
    const allTopics = subject.units.flatMap(u => u.topics);
    if (allTopics.length === 0) return 0;
    const completedCount = allTopics.filter(t => t.completed).length;
    return Math.round((completedCount / allTopics.length) * 100);
  };

  const completeTask = (taskId: string) => {
    if (!activeSubject || !activeSubject.plan) return;

    // Trigger celebratory confetti!
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch {
      // ignore in test or SSR
    }

    let completedTopicName: string | undefined;

    const updatedDays = activeSubject.plan.days.map(day => ({
      ...day,
      tasks: day.tasks.map(t => {
        if (t.id === taskId) {
          completedTopicName = t.topicName;
          return {
            ...t,
            status: 'completed' as const,
            completedAt: new Date().toISOString()
          };
        }
        return t;
      })
    }));

    // If task corresponds to a syllabus topic, mark that topic completed too
    let updatedUnits = activeSubject.units;
    if (completedTopicName) {
      const matchName = completedTopicName.toLowerCase();
      updatedUnits = activeSubject.units.map(unit => ({
        ...unit,
        topics: unit.topics.map(topic => {
          if (topic.name.toLowerCase() === matchName || matchName.includes(topic.name.toLowerCase())) {
            return { ...topic, completed: true, completedAt: new Date().toISOString() };
          }
          return topic;
        })
      }));
    }

    const updatedPlan: StudyPlan = {
      ...activeSubject.plan,
      days: updatedDays,
    };

    const updatedSubject: Subject = {
      ...activeSubject,
      units: updatedUnits,
      plan: updatedPlan,
      currentPreparationPercentage: recalculateProgress({ ...activeSubject, units: updatedUnits }),
      updatedAt: new Date().toISOString()
    };

    setSubjects(subjects.map(s => s.id === updatedSubject.id ? updatedSubject : s));
    showNotification('Task completed! Great progress towards your exam.');
  };

  const skipTaskAndReplan = (taskId: string) => {
    if (!activeSubject || !activeSubject.plan) return;

    const allTopics = activeSubject.units.flatMap(u => u.topics);
    const replanned = adaptiveReplan(
      activeSubject.plan,
      allTopics,
      activeSubject.examDaysFromNow,
      activeSubject.availableHoursPerDay,
      taskId
    );

    const updatedSubject: Subject = {
      ...activeSubject,
      plan: replanned,
      updatedAt: new Date().toISOString()
    };

    setSubjects(subjects.map(s => s.id === updatedSubject.id ? updatedSubject : s));
    showNotification('Your plan has been updated. We redistributed your time across remaining high-priority topics.');
  };

  const manualReplan = () => {
    if (!activeSubject || !activeSubject.plan) return;
    const allTopics = activeSubject.units.flatMap(u => u.topics);
    const newPlan = generateStudyPlan(
      activeSubject.id,
      allTopics,
      activeSubject.examDaysFromNow,
      activeSubject.availableHoursPerDay
    );
    newPlan.lastUpdatedMessage = 'Your plan has been re-generated based on current topic priorities.';

    const updatedSubject: Subject = {
      ...activeSubject,
      plan: newPlan,
      updatedAt: new Date().toISOString()
    };

    setSubjects(subjects.map(s => s.id === updatedSubject.id ? updatedSubject : s));
    showNotification('Schedule re-optimized for your remaining available hours!');
  };

  const toggleTopicCompleted = (topicId: string) => {
    if (!activeSubject) return;

    const updatedUnits = activeSubject.units.map(unit => ({
      ...unit,
      topics: unit.topics.map(topic => {
        if (topic.id === topicId) {
          const nextVal = !topic.completed;
          return {
            ...topic,
            completed: nextVal,
            completedAt: nextVal ? new Date().toISOString() : undefined
          };
        }
        return topic;
      })
    }));

    const updatedSubject: Subject = {
      ...activeSubject,
      units: updatedUnits,
      currentPreparationPercentage: recalculateProgress({ ...activeSubject, units: updatedUnits }),
      updatedAt: new Date().toISOString()
    };

    setSubjects(subjects.map(s => s.id === updatedSubject.id ? updatedSubject : s));
  };

  const updateTopicConfidence = (topicId: string, confidence: 'weak' | 'average' | 'strong') => {
    if (!activeSubject) return;

    const updatedUnits = activeSubject.units.map(unit => ({
      ...unit,
      topics: unit.topics.map(topic => {
        if (topic.id === topicId) {
          return { ...topic, confidence };
        }
        return topic;
      })
    }));

    const updatedSubject: Subject = {
      ...activeSubject,
      units: updatedUnits,
      updatedAt: new Date().toISOString()
    };

    setSubjects(subjects.map(s => s.id === updatedSubject.id ? updatedSubject : s));
    showNotification('Topic confidence updated. Priority score recalculated.');
  };

  const toggleQuestionInPlan = (questionId: string) => {
    if (!activeSubject) return;
    const updatedQuestions = (activeSubject.questions || []).map(q => {
      if (q.id === questionId) {
        const inPlan = !q.inPlan;
        return { ...q, inPlan };
      }
      return q;
    });

    const updatedSubject: Subject = {
      ...activeSubject,
      questions: updatedQuestions,
      updatedAt: new Date().toISOString()
    };

    setSubjects(subjects.map(s => s.id === updatedSubject.id ? updatedSubject : s));
    const targetQ = updatedQuestions.find(q => q.id === questionId);
    showNotification(targetQ?.inPlan ? 'Question added to practice plan!' : 'Question removed from plan.');
  };

  const toggleQuestionCompleted = (questionId: string) => {
    if (!activeSubject) return;
    const updatedQuestions = (activeSubject.questions || []).map(q => {
      if (q.id === questionId) {
        return { ...q, completed: !q.completed };
      }
      return q;
    });

    const updatedSubject: Subject = {
      ...activeSubject,
      questions: updatedQuestions,
      updatedAt: new Date().toISOString()
    };

    setSubjects(subjects.map(s => s.id === updatedSubject.id ? updatedSubject : s));
  };

  const startFocusSession = (taskId?: string) => {
    if (taskId) {
      setActiveTimerTaskId(taskId);
    }
    setAutoStartTimer(true);
    setIsWhatToStudyOpen(false);
    setCurrentView('todays-plan');
  };

  return (
    <NotesSyncContext.Provider
      value={{
        subjects,
        activeSubject,
        activeSubjectId,
        currentView,
        isWhatToStudyOpen,
        isLimitedTimeOpen,
        notificationMessage,
        activeTimerTaskId,
        autoStartTimer,
        setCurrentView,
        setActiveSubjectId,
        setIsWhatToStudyOpen,
        setIsLimitedTimeOpen,
        setNotificationMessage,
        setActiveTimerTaskId,
        setAutoStartTimer,
        startFocusSession,
        addSubject,
        deleteSubject,
        completeTask,
        skipTaskAndReplan,
        manualReplan,
        toggleTopicCompleted,
        toggleQuestionInPlan,
        toggleQuestionCompleted,
        updateTopicConfidence,
      }}
    >
      {children}
    </NotesSyncContext.Provider>
  );
}

export function useNotesSync() {
  const context = useContext(NotesSyncContext);
  if (!context) {
    throw new Error('useNotesSync must be used within a NotesSyncProvider');
  }
  return context;
}
