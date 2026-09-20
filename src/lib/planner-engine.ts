import { 
  Topic, 
  StudyPlan, 
  StudyDay, 
  StudyTask, 
  LimitedTimePlan, 
  NextStudyRecommendation,
  TaskType
} from './types';

/**
 * Format minutes into "Xh Ym" or "Xm"
 */
export function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Generates human clock strings like "6:00", "6:40" given start hour & minute offset
 */
function toTimeString(startHour: number, minuteOffset: number): string {
  const totalMinutes = startHour * 60 + minuteOffset;
  const hours = Math.floor(totalMinutes / 60) % 24;
  const mins = totalMinutes % 60;
  const formattedHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const period = hours >= 12 ? 'PM' : 'AM';
  const padMin = mins.toString().padStart(2, '0');
  return `${formattedHours}:${padMin} ${period}`;
}

/**
 * Core Study Plan Generator
 * 
 * Takes topics, exam days remaining, and daily available study hours.
 * Discrepancy detection: if estimated workload > available time, focuses on highest priority topics
 * and outputs the signature notice:
 * "You have X hours available but approximately Y hours of material. We've prioritized the highest-impact topics for your available time."
 */
export function generateStudyPlan(
  subjectId: string,
  topics: Topic[],
  examDays: number,
  hoursPerDay: number,
  startHour: number = 18 // Default 6:00 PM evening study block
): StudyPlan {
  const safeExamDays = Math.max(1, examDays);
  const totalAvailableHours = safeExamDays * hoursPerDay;
  const totalAvailableMinutes = totalAvailableHours * 60;

  // Calculate total estimated workload
  const totalEstimatedWorkloadMinutes = topics.reduce((acc, t) => acc + (t.estimatedMinutes || 30), 0);
  const totalEstimatedWorkloadHours = Math.round((totalEstimatedWorkloadMinutes / 60) * 10) / 10;

  let discrepancyNotice: string | undefined = undefined;
  if (totalAvailableHours < totalEstimatedWorkloadHours) {
    discrepancyNotice = `You have ${totalAvailableHours} hours available for approximately ${totalEstimatedWorkloadHours} hours of material. Your plan prioritizes high-impact and weak topics first.`;
  }

  // Sort topics strictly by priority score descending (High-priority weak topics first)
  const sortedTopics = [...topics].sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }
    // Secondary tie-breaker: student weakness
    if (a.confidence === 'weak' && b.confidence !== 'weak') return -1;
    if (b.confidence === 'weak' && a.confidence !== 'weak') return 1;
    return b.difficulty - a.difficulty;
  });

  const days: StudyDay[] = [];
  const dailyMinuteCapacity = hoursPerDay * 60;

  // Reserve the final day for revision, active recall, and high-priority practice
  const isMultiDay = safeExamDays > 1;
  const teachingDaysCount = isMultiDay ? safeExamDays - 1 : 1;

  let topicIndex = 0;
  let today = new Date();

  // Schedule teaching days
  for (let dayNum = 1; dayNum <= teachingDaysCount; dayNum++) {
    const dayDate = new Date(today);
    dayDate.setDate(today.getDate() + (dayNum - 1));
    const dateStr = dayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    const tasks: StudyTask[] = [];
    let allocatedMinutes = 0;
    let timeOffset = 0;

    // Day focus title based on top topics
    const dayFocusTopics: string[] = [];

    // Fill daily capacity
    let breakCount = 0;
    while (allocatedMinutes < dailyMinuteCapacity && topicIndex < sortedTopics.length) {
      const currentTopic = sortedTopics[topicIndex];
      const remainingDailyBudget = dailyMinuteCapacity - allocatedMinutes;

      // Fit or trim topic duration to fit daily study capacity
      const topicDuration = Math.min(
        currentTopic.estimatedMinutes || 35, 
        Math.max(25, remainingDailyBudget)
      );

      const startTimeStr = toTimeString(startHour, timeOffset);
      timeOffset += topicDuration;
      const endTimeStr = toTimeString(startHour, timeOffset);

      const priorityPrefix = currentTopic.priorityLevel === 'HIGH' ? 'High-priority' : currentTopic.priorityLevel === 'MEDIUM' ? 'Medium-priority' : 'Low-priority';

      tasks.push({
        id: `task-d${dayNum}-t${topicIndex}-${Math.random().toString(36).substring(2, 8)}`,
        topicId: currentTopic.id,
        topicName: currentTopic.name,
        parentTopic: currentTopic.parentTopic,
        durationMinutes: topicDuration,
        startTime: startTimeStr,
        endTime: endTimeStr,
        type: 'topic',
        priority: currentTopic.priorityLevel,
        status: 'pending',
        reason: currentTopic.confidence === 'weak' 
          ? `${priorityPrefix} weak topic (Score: ${currentTopic.priorityScore}/100)` 
          : `${priorityPrefix} syllabus topic (Score: ${currentTopic.priorityScore}/100)`,
      });

      dayFocusTopics.push(currentTopic.name);
      allocatedMinutes += topicDuration;
      topicIndex++;

      // Insert smart 10-minute break if more than 50 mins studied and remaining time permits
      if (allocatedMinutes + 35 <= dailyMinuteCapacity && remainingDailyBudget >= 35) {
        breakCount++;
        const breakStart = toTimeString(startHour, timeOffset);
        timeOffset += 10;
        const breakEnd = toTimeString(startHour, timeOffset);
        tasks.push({
          id: `break-d${dayNum}-b${breakCount}-${Math.random().toString(36).substring(2, 8)}`,
          topicName: 'Cognitive Reset Break',
          durationMinutes: 10,
          startTime: breakStart,
          endTime: breakEnd,
          type: 'break',
          priority: 'LOW',
          status: 'pending',
        });
        allocatedMinutes += 10;
      }
    }

    // If day has remaining time, append quick practice / recall quiz
    if (dailyMinuteCapacity - allocatedMinutes >= 15) {
      const practiceMins = dailyMinuteCapacity - allocatedMinutes;
      const startTimeStr = toTimeString(startHour, timeOffset);
      timeOffset += practiceMins;
      const endTimeStr = toTimeString(startHour, timeOffset);

      tasks.push({
        id: `practice-d${dayNum}-${Math.random().toString(36).substring(2, 8)}`,
        topicName: dayFocusTopics.length > 0 ? `${dayFocusTopics[0]} Practice & Recall` : 'Active Practice',
        durationMinutes: practiceMins,
        startTime: startTimeStr,
        endTime: endTimeStr,
        type: 'practice',
        priority: 'MEDIUM',
        status: 'pending',
        reason: 'Consolidate topics covered today with quick problem solving',
      });
      allocatedMinutes += practiceMins;
    }

    days.push({
      dayNumber: dayNum,
      dateString: dateStr,
      isFinalDay: false,
      focusTitle: dayFocusTopics.slice(0, 2).join(' & ') || 'Foundational Review',
      tasks,
    });
  }

  // Final Day: Emphasize revision, active recall, practice, weak topics
  if (isMultiDay) {
    const finalDayNum = safeExamDays;
    const finalDate = new Date(today);
    finalDate.setDate(today.getDate() + (finalDayNum - 1));
    const finalDateStr = finalDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    let finalTimeOffset = 0;
    const finalTasks: StudyTask[] = [];

    // 1. High-Priority Revision (40% time)
    const revMins = Math.round(dailyMinuteCapacity * 0.35);
    finalTasks.push({
      id: `final-rev-${Math.random().toString(36).substring(2, 8)}`,
      topicName: 'High-Priority Syllabus Revision',
      durationMinutes: revMins,
      startTime: toTimeString(startHour, finalTimeOffset),
      endTime: toTimeString(startHour, finalTimeOffset + revMins),
      type: 'revision',
      priority: 'HIGH',
      status: 'pending',
      reason: 'Rapid review of core concepts and formulas across all units',
    });
    finalTimeOffset += revMins;

    // 2. Weak Topic Recall (30% time)
    const weakMins = Math.round(dailyMinuteCapacity * 0.30);
    finalTasks.push({
      id: `final-weak-${Math.random().toString(36).substring(2, 8)}`,
      topicName: 'Weak Topics Active Recall',
      durationMinutes: weakMins,
      startTime: toTimeString(startHour, finalTimeOffset),
      endTime: toTimeString(startHour, finalTimeOffset + weakMins),
      type: 'recall',
      priority: 'HIGH',
      status: 'pending',
      reason: 'Flashcards and active memory retrieval on your tagged weak areas',
    });
    finalTimeOffset += weakMins;

    // 3. Final Exam Practice Questions (Remainder time)
    const practiceMins = Math.max(20, dailyMinuteCapacity - finalTimeOffset);
    finalTasks.push({
      id: `final-practice-${Math.random().toString(36).substring(2, 8)}`,
      topicName: 'High-Priority Exam Practice Questions',
      durationMinutes: practiceMins,
      startTime: toTimeString(startHour, finalTimeOffset),
      endTime: toTimeString(startHour, finalTimeOffset + practiceMins),
      type: 'practice',
      priority: 'HIGH',
      status: 'pending',
      reason: 'Solve representative university-level practice questions under timed pressure',
    });

    days.push({
      dayNumber: finalDayNum,
      dateString: finalDateStr,
      isFinalDay: true,
      focusTitle: 'Final Sprint: Active Recall & High-Impact Practice',
      tasks: finalTasks,
    });
  }

  return {
    id: `plan-${subjectId}-${Date.now().toString(36)}`,
    subjectId,
    totalEstimatedWorkloadHours,
    totalAvailableHours,
    discrepancyNotice,
    days,
    replanCount: 0,
  };
}

/**
 * Adaptive Replanning Engine
 * 
 * Triggered when a student skips a task or falls behind.
 * Does NOT blindly push all tasks into the future.
 * Recalculates remaining days, remaining available hours, student weakness,
 * priority scores, and reprioritizes the remaining time budget.
 */
export function adaptiveReplan(
  currentPlan: StudyPlan,
  allTopics: Topic[],
  remainingExamDays: number,
  hoursPerDay: number,
  skippedTaskId?: string
): StudyPlan {
  // Mark the skipped task in current day
  const updatedDays = currentPlan.days.map(day => {
    return {
      ...day,
      tasks: day.tasks.map(task => {
        if (task.id === skippedTaskId) {
          return { ...task, status: 'skipped' as const };
        }
        return task;
      })
    };
  });

  // Identify remaining incomplete topics
  const completedTopicNames = new Set<string>();
  for (const day of updatedDays) {
    for (const task of day.tasks) {
      if (task.status === 'completed' && task.topicName) {
        completedTopicNames.add(task.topicName.toLowerCase());
      }
    }
  }

  // Filter uncompleted topics, prioritizing high-priority weak ones
  const remainingTopics = allTopics.filter(t => !completedTopicNames.has(t.name.toLowerCase()));

  // Re-generate fresh schedule for remaining days
  const newPlan = generateStudyPlan(
    currentPlan.subjectId,
    remainingTopics,
    Math.max(1, remainingExamDays),
    hoursPerDay
  );

  // Preserve today's completed and skipped tasks so user sees historical state
  if (updatedDays.length > 0 && newPlan.days.length > 0) {
    const todayCompletedOrSkipped = updatedDays[0].tasks.filter(t => t.status === 'completed' || t.status === 'skipped');
    const filteredNewTodayTasks = newPlan.days[0].tasks.filter(
      t => !todayCompletedOrSkipped.some(done => done.topicName.toLowerCase() === t.topicName.toLowerCase())
    );
    newPlan.days[0].tasks = [...todayCompletedOrSkipped, ...filteredNewTodayTasks];
  }

  newPlan.replanCount = (currentPlan.replanCount || 0) + 1;
  newPlan.lastReplannedAt = new Date().toISOString();
  newPlan.lastUpdatedMessage = 'Your plan has been updated. We rebalanced your remaining hours to protect your high-priority weak topics.';

  return newPlan;
}

/**
 * Feature: "What should I study now?"
 * 
 * Recommends the SINGLE best next study action.
 * Evaluates:
 * - incomplete topics
 * - priority score & level
 * - student weakness
 * - exam date urgency
 * - remaining available time
 */
export function getWhatToStudyNow(
  topics: Topic[],
  examDaysLeft: number,
  todayPlanTasks: StudyTask[] = []
): NextStudyRecommendation {
  // Check if today's plan has an uncompleted pending high-priority task first
  const pendingPlanTask = todayPlanTasks.find(t => t.status === 'pending' && t.type !== 'break');
  if (pendingPlanTask) {
    const matchedTopic = topics.find(t => t.name.toLowerCase() === pendingPlanTask.topicName.toLowerCase());
    const isWeak = (matchedTopic?.confidence || 'weak') === 'weak';
    const priorityLabel = 
      pendingPlanTask.priority === 'HIGH' ? 'High priority' :
      pendingPlanTask.priority === 'MEDIUM' ? 'Medium priority' : 'Low priority';
    const confidenceLabel = 
      matchedTopic?.confidence === 'weak' ? 'weak topic' :
      matchedTopic?.confidence === 'strong' ? 'strong confidence' : 'average confidence';

    return {
      taskId: pendingPlanTask.id,
      topic: pendingPlanTask.topicName,
      durationMinutes: pendingPlanTask.durationMinutes,
      priority: pendingPlanTask.priority,
      confidence: matchedTopic?.confidence || 'weak',
      reason: `${priorityLabel} + ${confidenceLabel} + core syllabus topic + exam in ${examDaysLeft} days.`,
      suggestedAction: `Complete a focused ${pendingPlanTask.durationMinutes}-minute study sprint on ${pendingPlanTask.topicName}.`,
    };
  }

  // Filter out already completed topics
  const uncompleted = topics.filter(t => !t.completed);
  if (uncompleted.length === 0) {
    return {
      topic: 'Comprehensive Exam Recall',
      durationMinutes: 30,
      priority: 'HIGH',
      confidence: 'strong',
      reason: `All syllabus topics covered + active retention check + exam in ${examDaysLeft} days.`,
      suggestedAction: 'Take 30 minutes to self-test on complex edge cases and formulas.',
    };
  }

  // Find the single highest priority topic, breaking ties with weak confidence
  const bestTopic = [...uncompleted].sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
    if (a.confidence === 'weak' && b.confidence !== 'weak') return -1;
    if (b.confidence === 'weak' && a.confidence !== 'weak') return 1;
    return b.difficulty - a.difficulty;
  })[0];

  const duration = Math.min(45, Math.max(25, bestTopic.estimatedMinutes || 35));
  const bestPriorityLabel = 
    bestTopic.priorityLevel === 'HIGH' ? 'High priority' :
    bestTopic.priorityLevel === 'MEDIUM' ? 'Medium priority' : 'Low priority';
  const bestConfidenceLabel = 
    bestTopic.confidence === 'weak' ? 'weak topic' :
    bestTopic.confidence === 'strong' ? 'strong confidence' : 'average confidence';

  const reason = `${bestPriorityLabel} + ${bestConfidenceLabel} + core syllabus topic + exam in ${examDaysLeft} days.`;

  return {
    topic: bestTopic.name,
    durationMinutes: duration,
    priority: bestTopic.priorityLevel,
    confidence: bestTopic.confidence,
    reason,
    suggestedAction: `Study ${bestTopic.name} for ${duration} minutes with zero distractions.`,
  };
}

/**
 * Feature: Limited Time Mode
 * 
 * Options: 30 minutes, 1 hour, 3 hours, 1 day, 3 days, Custom.
 * Generates an instant, highly focused micro-plan prioritizing maximum score gain per minute.
 */
export function generateLimitedTimePlan(
  topics: Topic[],
  durationMinutes: number,
  label: string
): LimitedTimePlan {
  // Sort by priority and weakness
  const sorted = [...topics]
    .filter(t => !t.completed)
    .sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
      if (a.confidence === 'weak') return -1;
      return 1;
    });

  const focusTasks: LimitedTimePlan['focusTasks'] = [];
  let allocated = 0;

  if (durationMinutes <= 30) {
    // 30-min sprint: single top weak topic + recall
    const top = sorted[0] || { name: 'Core Syllabus Revision', priorityLevel: 'HIGH', confidence: 'weak' };
    focusTasks.push({
      topic: `${top.name} High-Yield Concepts`,
      minutes: 20,
      type: 'topic',
      priority: 'HIGH',
      reason: 'Direct focus on highest-yield exam concepts',
    });
    focusTasks.push({
      topic: 'Rapid Recall Quiz',
      minutes: 10,
      type: 'recall',
      priority: 'HIGH',
      reason: 'Active memory consolidation of key definitions & rules',
    });
  } else if (durationMinutes <= 60) {
    // 1-hour sprint: 2 topics + quick practice
    const t1 = sorted[0]?.name || 'Top Priority Topic';
    const t2 = sorted[1]?.name || 'Secondary Focus';
    focusTasks.push({
      topic: t1,
      minutes: 25,
      type: 'topic',
      priority: 'HIGH',
      reason: 'Deep dive into highest-priority weak area',
    });
    focusTasks.push({
      topic: t2,
      minutes: 20,
      type: 'topic',
      priority: 'HIGH',
      reason: 'High-frequency exam topic',
    });
    focusTasks.push({
      topic: 'Practice & Formula Application',
      minutes: 15,
      type: 'practice',
      priority: 'MEDIUM',
      reason: 'Solve 2 targeted practice problems',
    });
  } else if (durationMinutes <= 180) {
    // 3-hour focus plan (Matches the example in user specifications)
    // Example from prompt:
    // 3-HOUR FOCUS PLAN
    // Normalization — 45 min
    // Transactions — 40 min
    // SQL — 35 min
    // Practice — 30 min
    // Recall — 20 min
    const t1 = sorted[0]?.name || 'Normalization';
    const t2 = sorted[1]?.name || 'Transactions';
    const t3 = sorted[2]?.name || 'SQL Joins';

    focusTasks.push({
      topic: t1,
      minutes: 45,
      type: 'topic',
      priority: 'HIGH',
      reason: 'Highest-priority weak topic mastering',
    });
    focusTasks.push({
      topic: t2,
      minutes: 40,
      type: 'topic',
      priority: 'HIGH',
      reason: 'High-impact core conceptual unit',
    });
    focusTasks.push({
      topic: t3,
      minutes: 35,
      type: 'topic',
      priority: 'MEDIUM',
      reason: 'Applied problem-solving and syntax mastery',
    });
    focusTasks.push({
      topic: 'Exam-Level Practice Questions',
      minutes: 30,
      type: 'practice',
      priority: 'HIGH',
      reason: 'Solve representative university exam questions',
    });
    focusTasks.push({
      topic: 'Active Recall & Summary Sheet',
      minutes: 20,
      type: 'recall',
      priority: 'HIGH',
      reason: 'Retention lock-in and mental test before exam',
    });
  } else {
    // Custom or multi-hour sprint
    let idx = 0;
    while (allocated < durationMinutes && idx < sorted.length) {
      const top = sorted[idx];
      const slice = Math.min(45, durationMinutes - allocated);
      if (slice < 15) break;

      focusTasks.push({
        topic: top.name,
        minutes: slice,
        type: 'topic',
        priority: top.priorityLevel,
        reason: `Priority Score: ${top.priorityScore}/100`,
      });
      allocated += slice;
      idx++;
    }

    if (durationMinutes - allocated >= 20) {
      focusTasks.push({
        topic: 'Comprehensive Practice & Recall',
        minutes: durationMinutes - allocated,
        type: 'practice',
        priority: 'HIGH',
        reason: 'Consolidate all study blocks with high-priority questions',
      });
    }
  }

  return {
    durationMinutes,
    durationLabel: label,
    focusTasks,
  };
}
