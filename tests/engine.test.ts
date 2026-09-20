import { calculateTopicPriority } from '../src/lib/priority-engine';
import { generateStudyPlan, adaptiveReplan, getWhatToStudyNow, generateLimitedTimePlan } from '../src/lib/planner-engine';
import { Subject, Topic } from '../src/lib/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    process.exit(1);
  } else {
    console.log(`✓ Passed: ${message}`);
  }
}

function createTestSubject(): Subject {
  const topics: Topic[] = [
    { id: 't-1', name: 'System Introduction', unitName: 'Unit 1: Fundamentals', difficulty: 1, estimatedMinutes: 80, dependencies: [], confidence: 'strong', syllabusImportance: 2, priorityScore: 35, priorityLevel: 'LOW' },
    { id: 't-2', name: 'Architecture', unitName: 'Unit 1: Fundamentals', difficulty: 2, estimatedMinutes: 85, dependencies: ['System Introduction'], confidence: 'average', syllabusImportance: 3, priorityScore: 55, priorityLevel: 'MEDIUM' },
    { id: 't-3', name: 'Relational Model', unitName: 'Unit 2: Models', difficulty: 3, estimatedMinutes: 95, dependencies: ['Architecture'], confidence: 'average', syllabusImportance: 4, priorityScore: 70, priorityLevel: 'MEDIUM' },
    { id: 't-4', name: 'Normalization', unitName: 'Unit 3: Normalization', difficulty: 4, estimatedMinutes: 110, dependencies: ['Relational Model'], confidence: 'weak', syllabusImportance: 5, pastPaperFrequency: 5, priorityScore: 92, priorityLevel: 'HIGH' },
    { id: 't-5', name: 'BCNF', unitName: 'Unit 3: Normalization', difficulty: 5, estimatedMinutes: 100, dependencies: ['Normalization'], confidence: 'weak', syllabusImportance: 5, pastPaperFrequency: 4, priorityScore: 95, priorityLevel: 'HIGH' },
    { id: 't-6', name: 'Transactions', unitName: 'Unit 4: Concurrency', difficulty: 3, estimatedMinutes: 90, dependencies: ['Relational Model'], confidence: 'average', syllabusImportance: 4, pastPaperFrequency: 3, priorityScore: 75, priorityLevel: 'MEDIUM' },
    { id: 't-7', name: 'Concurrency Control', unitName: 'Unit 4: Concurrency', difficulty: 4, estimatedMinutes: 100, dependencies: ['Transactions'], confidence: 'weak', syllabusImportance: 5, pastPaperFrequency: 4, priorityScore: 89, priorityLevel: 'HIGH' },
    { id: 't-8', name: 'Recovery Techniques', unitName: 'Unit 5: Recovery', difficulty: 3, estimatedMinutes: 90, dependencies: ['Transactions'], confidence: 'weak', syllabusImportance: 4, pastPaperFrequency: 4, priorityScore: 84, priorityLevel: 'HIGH' },
    { id: 't-9', name: 'Indexing & B-Trees', unitName: 'Unit 5: Recovery', difficulty: 4, estimatedMinutes: 90, dependencies: ['Recovery Techniques'], confidence: 'weak', syllabusImportance: 4, pastPaperFrequency: 4, priorityScore: 86, priorityLevel: 'HIGH' },
  ];

  const plan = generateStudyPlan('sub-test-1', topics, 5, 2);

  return {
    id: 'sub-test-1',
    name: 'Computer Systems',
    examDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    examDaysFromNow: 5,
    availableHoursPerDay: 2,
    rawSyllabusText: 'Unit 1: Fundamentals\nUnit 2: Models\nUnit 3: Normalization\nUnit 4: Concurrency\nUnit 5: Recovery',
    currentPreparationPercentage: 25,
    confidence: {
      strong: ['System Introduction'],
      average: ['Architecture', 'Relational Model', 'Transactions'],
      weak: ['Normalization', 'BCNF', 'Concurrency Control', 'Recovery Techniques', 'Indexing & B-Trees'],
    },
    units: [
      { id: 'u-1', name: 'Unit 1: Fundamentals', topics: topics.slice(0, 2) },
      { id: 'u-2', name: 'Unit 2: Models', topics: topics.slice(2, 3) },
      { id: 'u-3', name: 'Unit 3: Normalization', topics: topics.slice(3, 5) },
      { id: 'u-4', name: 'Unit 4: Concurrency', topics: topics.slice(5, 7) },
      { id: 'u-5', name: 'Unit 5: Recovery', topics: topics.slice(7, 9) },
    ],
    plan,
    questions: [
      { id: 'q-1', topic: 'Normalization', question: 'Explain 3NF vs BCNF decomposition with examples.', category: 'High Priority', priority: 'HIGH', difficulty: 'Hard', estimatedMinutes: 20, completed: false, inPlan: true },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

console.log('--- TEST 1: PRIORITY ENGINE SCORING & WEIGHT REDISTRIBUTION ---');

const weakTopicBreakdown = calculateTopicPriority(
  {
    name: 'Normalization',
    difficulty: 4,
    dependencies: ['Functional Dependencies'],
    confidence: 'weak',
    syllabusImportance: 5,
    pastPaperFrequency: 4,
  },
  [{ name: 'Normalization' }, { name: 'BCNF', dependencies: ['Normalization'] }],
  true
);

console.log('Weak topic score (with past papers):', weakTopicBreakdown.totalScore, weakTopicBreakdown.level);
assert(weakTopicBreakdown.totalScore >= 80, 'Weak topic with high difficulty & importance should be HIGH priority (>=80)');
assert(weakTopicBreakdown.level === 'HIGH', 'Weak topic level should be HIGH');

const noPastPapersBreakdown = calculateTopicPriority(
  {
    name: 'SQL',
    difficulty: 2,
    dependencies: [],
    confidence: 'strong',
    syllabusImportance: 3,
  },
  [{ name: 'SQL' }],
  false
);

console.log('Weights used without past papers:', noPastPapersBreakdown.weightsUsed);
const sumWeights = 
  noPastPapersBreakdown.weightsUsed.syllabusImportance +
  noPastPapersBreakdown.weightsUsed.difficulty +
  noPastPapersBreakdown.weightsUsed.weakness +
  noPastPapersBreakdown.weightsUsed.dependency;
assert(Math.abs(sumWeights - 1.0) < 0.001, 'Redistributed weights without past papers must sum to 1.0 (100%)');
console.log('Strong topic score (without past papers):', noPastPapersBreakdown.totalScore, noPastPapersBreakdown.level);
assert(noPastPapersBreakdown.totalScore < 60, 'Strong topic with low difficulty should have low/moderate score');

console.log('\n--- TEST 2: PLANNER WORKLOAD & DISCREPANCY VALIDATION ---');
const testSub = createTestSubject();
assert(testSub.name === 'Computer Systems', 'Test subject name matches');
assert(testSub.examDaysFromNow === 5, 'Exam days from now is 5');
assert(testSub.availableHoursPerDay === 2, 'Available hours per day is 2');
assert(testSub.plan?.days.length === 5, 'Plan has 5 scheduled days');
assert(testSub.plan?.totalAvailableHours === 10, 'Total available hours is 10 hours');
assert(
  Boolean(testSub.plan?.discrepancyNotice?.includes("available for approximately")),
  'Discrepancy notice correctly indicates available hours vs workload'
);

const finalDay = testSub.plan?.days[4];
assert(finalDay?.isFinalDay === true, 'Final day is marked isFinalDay');
assert(
  Boolean(finalDay?.tasks.some(t => t.type === 'revision' || t.type === 'recall')),
  'Final day includes revision and active recall tasks'
);

console.log('\n--- TEST 3: "WHAT SHOULD I STUDY NOW?" RECOMMENDATION ---');
const allTopics = testSub.units.flatMap(u => u.topics);
const recommendation = getWhatToStudyNow(allTopics, testSub.examDaysFromNow, testSub.plan?.days[0]?.tasks || []);
console.log('Recommended task:', recommendation.topic, `(${recommendation.durationMinutes} mins)`);
console.log('Reason:', recommendation.reason);
assert(Boolean(recommendation.topic), 'Recommendation topic is not empty');
assert(recommendation.durationMinutes > 0, 'Recommendation has positive duration');
assert(recommendation.priority === 'HIGH', 'Recommendation picks a high-priority topic');
assert(recommendation.reason.length > 10, 'Recommendation contains detailed explanation');

console.log('\n--- TEST 4: LIMITED TIME MODE ---');
const sprint3h = generateLimitedTimePlan(allTopics, 180, '3 Hours');
console.log('3-Hour Sprint Tasks:', sprint3h.focusTasks.map(t => `${t.topic} (${t.minutes}m)`));
assert(sprint3h.focusTasks.length >= 4, '3-Hour sprint contains multiple prioritized study blocks');
assert(
  sprint3h.focusTasks.some(t => t.type === 'practice' || t.type === 'recall'),
  'Limited time plan includes practice/recall'
);

console.log('\n--- TEST 5: ADAPTIVE REPLANNING ON SKIP ---');
const originalPlan = testSub.plan!;
const taskToSkip = originalPlan.days[0].tasks[0].id;
const replanned = adaptiveReplan(originalPlan, allTopics, 5, 2, taskToSkip);
console.log('Replanned count:', replanned.replanCount);
console.log('Replanned message:', replanned.lastUpdatedMessage);
assert(replanned.replanCount === 1, 'Replan count incremented');
assert(
  Boolean(replanned.days[0].tasks.some(t => t.id === taskToSkip && t.status === 'skipped')),
  'Skipped task status set to skipped'
);
assert(
  Boolean(replanned.lastUpdatedMessage?.includes('Your plan has been updated')),
  'Replanned plan includes "Your plan has been updated" message'
);

console.log('\n✅ ALL 5 SUITE TESTS PASSED PERFECTLY!\n');
