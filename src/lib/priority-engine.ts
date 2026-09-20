import { ConfidenceLevel, PriorityLevel, Topic } from './types';

export interface PriorityScoreBreakdown {
  syllabusImportanceContribution: number;
  difficultyContribution: number;
  weaknessContribution: number;
  dependencyContribution: number;
  pastPaperContribution?: number;
  totalScore: number;
  level: PriorityLevel;
  weightsUsed: {
    syllabusImportance: number;
    difficulty: number;
    weakness: number;
    dependency: number;
    pastPaper?: number;
  };
}

/**
 * Deterministic Priority Calculation Engine
 * 
 * Formula (with past-papers):
 * - 25% Syllabus importance
 * - 15% Difficulty
 * - 25% Student weakness
 * - 15% Topic dependency
 * - 20% Past-paper frequency
 * 
 * If past-paper data is absent, 20% is proportionally redistributed across the other 4 factors.
 * Normalized to 0-100:
 * 80-100 = HIGH
 * 50-79  = MEDIUM
 * 0-49   = LOW
 */
export function calculateTopicPriority(
  topic: {
    name: string;
    difficulty: number; // 1-5
    dependencies?: string[];
    confidence: ConfidenceLevel;
    syllabusImportance?: number; // 1-5
    pastPaperFrequency?: number; // 1-5 or undefined
  },
  allTopicsInSyllabus: { name: string; dependencies?: string[] }[] = [],
  pastPapersAvailable: boolean = false
): PriorityScoreBreakdown {
  // 1. Syllabus Importance (scale 1-5 -> 0.2 to 1.0)
  const importanceRaw = topic.syllabusImportance ?? 3;
  const importanceNorm = Math.min(Math.max((importanceRaw - 1) / 4, 0.2), 1.0);

  // 2. Difficulty (scale 1-5 -> 0.2 to 1.0)
  const difficultyRaw = topic.difficulty ?? 3;
  const difficultyNorm = Math.min(Math.max((difficultyRaw - 1) / 4, 0.2), 1.0);

  // 3. Student Weakness:
  // weak = 1.0 (high priority to study)
  // average = 0.55
  // strong = 0.15
  let weaknessNorm = 0.55;
  if (topic.confidence === 'weak') {
    weaknessNorm = 1.0;
  } else if (topic.confidence === 'strong') {
    weaknessNorm = 0.15;
  } else {
    weaknessNorm = 0.55;
  }

  // 4. Topic Dependency:
  // How many other topics depend on this topic?
  // Foundational topics have higher prerequisite importance.
  let dependentCount = 0;
  for (const other of allTopicsInSyllabus) {
    if (other.dependencies && other.dependencies.some(d => d.toLowerCase() === topic.name.toLowerCase())) {
      dependentCount++;
    }
  }
  // Also count if this topic has fundamental prerequisites
  const dependencyScore = Math.min(0.2 + (dependentCount * 0.3) + ((topic.dependencies?.length || 0) > 0 ? 0.2 : 0), 1.0);

  // 5. Past-Paper Frequency (if available)
  const hasPastPapers = pastPapersAvailable && topic.pastPaperFrequency !== undefined;
  const pastPaperNorm = hasPastPapers 
    ? Math.min(Math.max(((topic.pastPaperFrequency ?? 3) - 1) / 4, 0.2), 1.0) 
    : 0;

  let wImportance = 0.25;
  let wDifficulty = 0.15;
  let wWeakness = 0.25;
  let wDependency = 0.15;
  let wPastPaper = 0.20;

  if (!hasPastPapers) {
    // Redistribute the 20% across the 4 factors:
    // Total available = 0.80
    wImportance = 0.25 / 0.80; // 0.3125
    wDifficulty = 0.15 / 0.80; // 0.1875
    wWeakness = 0.25 / 0.80;   // 0.3125
    wDependency = 0.15 / 0.80; // 0.1875
    wPastPaper = 0;
  }

  const importanceContr = importanceNorm * wImportance * 100;
  const difficultyContr = difficultyNorm * wDifficulty * 100;
  const weaknessContr = weaknessNorm * wWeakness * 100;
  const dependencyContr = dependencyScore * wDependency * 100;
  const pastPaperContr = hasPastPapers ? pastPaperNorm * wPastPaper * 100 : 0;

  const rawTotal = importanceContr + difficultyContr + weaknessContr + dependencyContr + pastPaperContr;
  const totalScore = Math.min(100, Math.max(0, Math.round(rawTotal)));

  let level: PriorityLevel = 'LOW';
  if (totalScore >= 80) {
    level = 'HIGH';
  } else if (totalScore >= 50) {
    level = 'MEDIUM';
  } else {
    level = 'LOW';
  }

  return {
    syllabusImportanceContribution: Math.round(importanceContr),
    difficultyContribution: Math.round(difficultyContr),
    weaknessContribution: Math.round(weaknessContr),
    dependencyContribution: Math.round(dependencyContr),
    pastPaperContribution: hasPastPapers ? Math.round(pastPaperContr) : undefined,
    totalScore,
    level,
    weightsUsed: {
      syllabusImportance: wImportance,
      difficulty: wDifficulty,
      weakness: wWeakness,
      dependency: wDependency,
      pastPaper: hasPastPapers ? wPastPaper : undefined,
    }
  };
}

/**
 * Score all topics in a syllabus uniformly
 */
export function scoreAllTopics(
  topics: {
    id: string;
    name: string;
    unitName: string;
    difficulty: number;
    estimatedMinutes: number;
    dependencies: string[];
    subtopics?: string[];
    confidence: ConfidenceLevel;
    syllabusImportance?: number;
    pastPaperFrequency?: number;
    completed?: boolean;
    completedAt?: string;
    skipped?: boolean;
  }[],
  pastPapersAvailable: boolean = false
): Topic[] {
  return topics.map(topic => {
    const scored = calculateTopicPriority(topic, topics, pastPapersAvailable);
    return {
      ...topic,
      syllabusImportance: topic.syllabusImportance ?? 3,
      priorityScore: scored.totalScore,
      priorityLevel: scored.level,
    };
  });
}
