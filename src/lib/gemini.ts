import { GoogleGenAI } from '@google/genai';

// Initialize SDK if API key is available
const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
let aiInstance: GoogleGenAI | null = null;

function getAI(): GoogleGenAI | null {
  if (!apiKey) return null;
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export interface RawExtractedTopic {
  name: string;
  parentTopic?: string;
  difficulty?: number; // 1-5
  estimatedMinutes?: number;
  dependencies?: string[];
  subtopics?: string[];
  syllabusImportance?: number; // 1-5
}

export interface RawExtractedUnit {
  name: string;
  topics: RawExtractedTopic[];
}

export interface RawSyllabusAnalysisResult {
  subject: string;
  units: RawExtractedUnit[];
}

export interface RawQuestionResult {
  topic: string;
  question: string;
  category: 'High Priority' | 'Medium Priority' | 'Quick Revision';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimatedMinutes: number;
}

/**
 * Clean JSON output from potential Markdown codeblocks
 */
function cleanJsonString(str: string): string {
  let cleaned = str.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

/**
 * Split a complex compound syllabus string into granular actionable study topics.
 * e.g. "Spanning Trees – Prim's and Kruskal's Algorithms" -> ["Prim's Algorithm", "Kruskal's Algorithm"] with parent "Spanning Trees"
 */
function splitCompoundTopic(rawLine: string): { name: string; parentTopic?: string }[] {
  const cleaned = rawLine.replace(/^[-*•\d+\.\)]\s*/, '').trim();
  if (!cleaned) return [];

  // 1. Check for Parent - Subtopics structure (e.g. "Spanning Trees – Prim’s and Kruskal’s Algorithms")
  const dashMatch = cleaned.match(/^([A-Za-z0-9\s]{3,35})\s*[–—\-:]\s*(.+)$/);
  if (dashMatch) {
    const parent = dashMatch[1].trim();
    const childrenStr = dashMatch[2].trim();

    // Split children by comma, 'and', or semicolon
    const items = childrenStr
      .split(/,\s*|\s+and\s+|;\s*/i)
      .map(i => i.trim())
      .filter(i => i.length > 2);

    if (items.length > 1) {
      return items.map(item => ({
        name: item,
        parentTopic: parent,
      }));
    }
  }

  // 2. Check for Parent (Item1, Item2, Item3) structure
  const parenMatch = cleaned.match(/^([A-Za-z0-9\s]{3,40})\s*\(([^)]+)\)$/);
  if (parenMatch) {
    const parent = parenMatch[1].trim();
    const items = parenMatch[2]
      .split(/,\s*|\s+and\s+|;\s*/i)
      .map(i => i.trim())
      .filter(i => i.length > 1);

    if (items.length > 1) {
      return items.map(item => ({
        name: `${item} (${parent})`,
        parentTopic: parent,
      }));
    }
  }

  // 3. Comma-separated distinct topics
  if (cleaned.includes(',') && !cleaned.includes('e.g.')) {
    const parts = cleaned.split(/,\s*/).map(p => p.trim()).filter(p => p.length > 3);
    if (parts.length > 1 && parts.length <= 4) {
      return parts.map(p => ({ name: p }));
    }
  }

  return [{ name: cleaned }];
}

/**
 * Intelligent deterministic fallback parser when AI key is missing or offline
 */
export function fallbackSyllabusParser(rawText: string, subjectName: string): RawSyllabusAnalysisResult {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const units: RawExtractedUnit[] = [];
  let currentUnit: RawExtractedUnit = {
    name: 'Unit 1: Core Fundamentals',
    topics: [],
  };

  for (const line of lines) {
    const isUnitHeader = /^(unit|module|chapter|section|part)\s*(\d+|[ivxlcdm]+)[:\.\s-]/i.test(line);
    if (isUnitHeader) {
      if (currentUnit.topics.length > 0) {
        units.push(currentUnit);
      }
      currentUnit = {
        name: line.replace(/^[-*#]+\s*/, ''),
        topics: [],
      };
      continue;
    }

    // Split compound lines into granular actionable study topics
    const splitTopics = splitCompoundTopic(line);
    for (const st of splitTopics) {
      if (st.name.length > 2 && st.name.length < 90) {
        const isComplex = /(advanced|design|recovery|concurrency|security|optimization|normal|serializ|shortest|spanning|dynamic|greedy)/i.test(st.name);
        const isIntro = /(intro|basic|overview|history|definition)/i.test(st.name);
        
        const difficulty = isComplex ? 4 : isIntro ? 2 : 3;
        const estimatedMinutes = isComplex ? 35 : isIntro ? 20 : 25;

        currentUnit.topics.push({
          name: st.name,
          parentTopic: st.parentTopic,
          difficulty,
          estimatedMinutes,
          dependencies: currentUnit.topics.length > 0 ? [currentUnit.topics[0].name] : [],
          syllabusImportance: isComplex ? 5 : isIntro ? 3 : 4,
        });
      }
    }
  }

  if (currentUnit.topics.length > 0) {
    units.push(currentUnit);
  }

  // If no units found, provide structured default units
  if (units.length === 0) {
    units.push({
      name: 'Unit 1: Core Topics',
      topics: [
        { name: `${subjectName} Overview`, difficulty: 2, estimatedMinutes: 20, dependencies: [], syllabusImportance: 3 },
        { name: 'Core Problem Solving', difficulty: 4, estimatedMinutes: 30, dependencies: [], syllabusImportance: 5 },
      ]
    });
  }

  return {
    subject: subjectName || 'Extracted Course Syllabus',
    units,
  };
}

/**
 * Analyze syllabus with Gemini AI, with auto-retry and fallback
 */
export async function analyzeSyllabusWithGemini(
  syllabusText: string,
  subjectName: string
): Promise<RawSyllabusAnalysisResult> {
  const ai = getAI();
  if (!ai) {
    return fallbackSyllabusParser(syllabusText, subjectName);
  }

  const systemInstruction = `You are an academic syllabus analysis engine.
Analyze only the supplied university syllabus.

CRITICAL TOPIC GRANULARITY REQUIREMENT:
- Split complex or grouped syllabus lines into granular, actionable individual study topics (15 to 45 minutes each).
- NEVER lump multiple distinct algorithms, data structures, or theorems into one combined topic.
- Example: If a syllabus line says "Spanning Trees – Prim’s and Kruskal’s Algorithms", you MUST output TWO individual topics:
  1) name: "Prim's Algorithm", parentTopic: "Spanning Trees"
  2) name: "Kruskal's Algorithm", parentTopic: "Spanning Trees"
- Example: If a line says "Shortest Paths: Dijkstra and Bellman-Ford", output TWO individual topics:
  1) name: "Dijkstra's Algorithm", parentTopic: "Shortest Paths"
  2) name: "Bellman-Ford Algorithm", parentTopic: "Shortest Paths"
- Preserve parentTopic / category heading when topics belong to a parent group.
- Extract units, actionable granular topics, difficulty (1 to 5), dependencies, and estimated learning effort (15 to 45 minutes).
Return valid JSON only.

Strict JSON format:
{
  "subject": "${subjectName || 'Course Name'}",
  "units": [
    {
      "name": "Unit 1: Name",
      "topics": [
        {
          "name": "Granular Topic Name",
          "parentTopic": "Optional Parent Category",
          "difficulty": 3,
          "estimatedMinutes": 30,
          "dependencies": ["Prerequisite Topic Name"]
        }
      ]
    }
  ]
}`;

  // Try calling Gemini with 1 retry on invalid JSON
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: `${systemInstruction}\n\nSyllabus:\n${syllabusText}` }] },
        ],
        config: {
          responseMimeType: 'application/json',
        }
      });

      const text = response.text || '';
      const parsed = JSON.parse(cleanJsonString(text)) as RawSyllabusAnalysisResult;
      if (parsed && Array.isArray(parsed.units) && parsed.units.length > 0) {
        return parsed;
      }
    } catch (err) {
      console.warn(`Gemini analysis attempt ${attempt} failed:`, err);
      if (attempt === 2) {
        return fallbackSyllabusParser(syllabusText, subjectName);
      }
    }
  }

  return fallbackSyllabusParser(syllabusText, subjectName);
}

/**
 * Generate diverse, university-level practice questions with Gemini
 */
export async function generateQuestionsWithGemini(
  syllabusText: string,
  topicList: string[],
  pastPapersText?: string
): Promise<RawQuestionResult[]> {
  const ai = getAI();
  const targetTopics = topicList.slice(0, 10);

  // Diverse patterns for realistic exam preparation
  const getExamQuestionPattern = (topic: string, index: number): string => {
    const patterns = [
      `Compare ${topic} with standard alternative approaches in terms of prerequisites, operational trade-offs, and runtime efficiency.`,
      `Analyze the best-case, average-case, and worst-case time complexity of ${topic}. What specific input structures cause worst-case performance?`,
      `Trace ${topic} step-by-step on a representative input example of your choice. Illustrate intermediate stages with a neat diagram.`,
      `Differentiate the core algorithmic mechanisms and memory requirements of ${topic} from related foundational techniques.`,
      `Apply ${topic} to solve a practical problem scenario. Show the computational progression and state any assumptions.`,
      `Explain the theoretical guarantees, termination conditions, and edge-case limitations of ${topic}.`
    ];
    return patterns[index % patterns.length];
  };

  if (!ai) {
    // Generate deterministic diverse practice questions
    return targetTopics.map((topic, i) => ({
      topic,
      question: getExamQuestionPattern(topic, i),
      category: i % 3 === 0 ? 'High Priority' : i % 3 === 1 ? 'Medium Priority' : 'Quick Revision',
      priority: i % 3 === 0 ? 'HIGH' : i % 3 === 1 ? 'MEDIUM' : 'LOW',
      difficulty: i % 3 === 0 ? 'Hard' : i % 3 === 1 ? 'Medium' : 'Easy',
      estimatedMinutes: i % 3 === 0 ? 25 : i % 3 === 1 ? 15 : 10,
    }));
  }

  const prompt = `You generate university-level practice examination questions using the supplied syllabus and optional past papers.

CRITICAL QUESTION QUALITY GUIDELINES:
- DO NOT make generic questions starting with "Explain the fundamental concepts and practical application of...".
- Vary question types across university exam standards:
  * Compare / Differentiate (e.g. "Compare linear search and binary search with respect to prerequisites and time complexity...")
  * Trace / Step-by-Step execution on sample input
  * Complexity Analysis (best, average, worst-case bounds)
  * Problem Solving & Practical Application
  * Short-answer active recall definitions (for Quick Revision)
- Return valid JSON only.

Categories:
- "High Priority" (priority: "HIGH", 8-15 mark university exam questions, derivations, complex proofs, multi-step traces)
- "Medium Priority" (priority: "MEDIUM", 4-7 mark analytical or comparison questions)
- "Quick Revision" (priority: "LOW", 2-3 mark crisp recall questions)

Topics to generate questions for:
${targetTopics.join(', ')}

${pastPapersText ? `Previous Year Exam Paper Context:\n${pastPapersText}` : ''}

Output JSON Schema:
[
  {
    "topic": "Topic Name",
    "question": "Specific, exam-level question text?",
    "category": "High Priority",
    "priority": "HIGH",
    "difficulty": "Medium",
    "estimatedMinutes": 20
  }
]`;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
        }
      });

      const text = response.text || '';
      const parsed = JSON.parse(cleanJsonString(text)) as RawQuestionResult[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (err) {
      console.warn(`Gemini question generation attempt ${attempt} failed:`, err);
    }
  }

  // Fallback questions with diverse patterns
  return targetTopics.map((topic, i) => ({
    topic,
    question: getExamQuestionPattern(topic, i),
    category: i % 2 === 0 ? 'High Priority' : 'Medium Priority',
    priority: i % 2 === 0 ? 'HIGH' : 'MEDIUM',
    difficulty: 'Medium',
    estimatedMinutes: 20,
  }));
}
