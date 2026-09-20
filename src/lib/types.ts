export type ConfidenceLevel = 'weak' | 'average' | 'strong';
export type PriorityLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type TaskType = 'topic' | 'practice' | 'recall' | 'break' | 'revision';
export type TaskStatus = 'pending' | 'completed' | 'skipped';

export interface Topic {
  id: string;
  name: string;
  parentTopic?: string;
  unitName: string;
  difficulty: number; // 1 to 5
  estimatedMinutes: number;
  dependencies: string[];
  subtopics?: string[];
  confidence: ConfidenceLevel;
  syllabusImportance: number; // 1 to 5
  pastPaperFrequency?: number; // 1 to 5 (optional)
  priorityScore: number; // 0 to 100
  priorityLevel: PriorityLevel;
  completed?: boolean;
  completedAt?: string;
  skipped?: boolean;
}

export interface Unit {
  id: string;
  name: string;
  topics: Topic[];
}

export interface PracticeQuestion {
  id: string;
  topic: string;
  question: string;
  category: 'High Priority' | 'Medium Priority' | 'Quick Revision';
  priority: PriorityLevel;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimatedMinutes: number;
  frequency?: number;
  inPlan?: boolean;
  completed?: boolean;
}

export interface StudyTask {
  id: string;
  topicId?: string;
  topicName: string;
  parentTopic?: string;
  durationMinutes: number;
  startTime?: string;
  endTime?: string;
  type: TaskType;
  priority: PriorityLevel;
  status: TaskStatus;
  completedAt?: string;
  reason?: string;
}

export interface StudyDay {
  dayNumber: number;
  dateString: string;
  isFinalDay: boolean;
  focusTitle: string;
  tasks: StudyTask[];
}

export interface StudyPlan {
  id: string;
  subjectId: string;
  totalEstimatedWorkloadHours: number;
  totalAvailableHours: number;
  discrepancyNotice?: string;
  days: StudyDay[];
  replanCount: number;
  lastReplannedAt?: string;
  lastUpdatedMessage?: string;
}

export interface Subject {
  id: string;
  name: string;
  examDate: string; // YYYY-MM-DD
  examDaysFromNow: number;
  availableHoursPerDay: number;
  currentPreparationPercentage: number;
  rawSyllabusText?: string;
  pastPapersProvided?: boolean;
  confidence: {
    strong: string[];
    average: string[];
    weak: string[];
  };
  units: Unit[];
  questions: PracticeQuestion[];
  plan?: StudyPlan;
  createdAt: string;
  updatedAt: string;
}

export interface LimitedTimePlan {
  durationMinutes: number;
  durationLabel: string;
  focusTasks: {
    topic: string;
    minutes: number;
    type: TaskType;
    priority: PriorityLevel;
    reason: string;
  }[];
}

export interface NextStudyRecommendation {
  taskId?: string;
  topic: string;
  durationMinutes: number;
  priority: PriorityLevel;
  confidence: ConfidenceLevel;
  reason: string;
  suggestedAction: string;
}
