# NotesSync ⚡
> **"Your syllabus. Your time. Your plan."**  
> AI-powered exam preparation decision engine for college students.

---

## 🎯 The Problem NotesSync Solves

Most study apps and timetable generators produce impossible, fictitious schedules. If your syllabus takes **14 hours** of study, but your exam is tomorrow and you only have **6 hours** available, traditional tools dump a full 14-hour schedule on you—inducing panic and cramming.

### The NotesSync Differentiator
NotesSync is **NOT** a timetable generator. It is an **exam preparation decision engine**.

When faced with time constraints, NotesSync computes:
> *"You have 6 hours available but approximately 14 hours of material. We've prioritized the highest-impact topics for your available time."*

It then creates a focused, high-yield schedule that guarantees you master the highest-leverage concepts first.

---

## 🚀 Key Features

1. **Deterministic Priority Engine**:
   Rather than letting an LLM arbitrarily hallucinate priorities, NotesSync uses deterministic math:
   - **25%** Syllabus Importance
   - **15%** Topic Difficulty
   - **25%** Student Weakness
   - **15%** Topic Dependencies & Prerequisites
   - **20%** Past-Paper Frequency (automatically redistributed across the other 4 parameters if past papers are omitted)
   - Normalized 0–100 score: **HIGH** (80–100), **MEDIUM** (50–79), **LOW** (0–49).

2. **"What should I study now?"**:
   A prominent real-time decision engine that examines incomplete topics, priority, weakness, exam urgency, and available runway to recommend the single best next study block with clear justification.

3. **Adaptive Replanning**:
   When you skip a task, NotesSync does **NOT** blindly shift the entire schedule forward. It recomputes remaining available hours, recalibrates priority scores, protects high-yield weak topics, and emits: *"Your plan has been updated."*

4. **Limited Time Mode**:
   Choose **30 minutes**, **1 hour**, **3 hours**, **1 day**, **3 days**, or **Custom** to instantly generate focused study sprints (e.g. 3-Hour Focus Plan with topic-by-topic breakdown).

5. **Timed Daily Schedules with Final-Day Emphasis**:
   Day-by-day blocks with cognitive reset breaks. The final day before the exam reserves time specifically for **active recall, high-yield revision, and practice questions** instead of introducing heavy new theories.

6. **Exam Practice Bank**:
   High-priority practice questions categorized by priority, difficulty, and estimated time, with 1-click "Add to Plan" integration.

7. **One-Click DBMS Demo Mode**:
   Pre-configured with realistic Database Management Systems syllabus data, 5-day runway, 2 hrs/day budget, and confidence tags. Evaluators can experience the entire end-to-end workflow without configuring credentials.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14+ / 16 (App Router)](https://nextjs.org/)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Visualizations**: Recharts
- **Icons**: Lucide React
- **AI Backend**: `@google/genai` (Google Gemini API with auto-retry and schema validation)
- **Delight**: Canvas Confetti

---

## 🏃 Quick Start

### 1. Clone & Install
```bash
git clone <repository-url>
cd notessync
npm install
```

### 2. Configure Environment Variables (Optional)
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Add your Gemini API key from [Google AI Studio](https://aistudio.google.com/):
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
*(Note: NotesSync includes smart deterministic fallbacks, so the application runs 100% offline even without an API key!)*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Automated Tests
```bash
npm test
```

### 5. Production Build
```bash
npm run build
npm start
```

---

## 📂 Project Architecture

```
notessync/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── analyze-syllabus/    # Server route for Gemini syllabus analysis
│   │   │   └── generate-questions/  # Server route for practice question generation
│   │   ├── globals.css              # Theme, typography & animations
│   │   ├── layout.tsx               # Root layout & NotesSyncProvider
│   │   └── page.tsx                 # Dynamic view controller
│   ├── components/
│   │   ├── Navbar.tsx               # Subject switcher, views, and action triggers
│   │   ├── LandingView.tsx          # Hero, feature cards & problem statement
│   │   ├── DashboardView.tsx        # Next exam countdown, readiness, today's targets
│   │   ├── AddSubjectView.tsx       # Syllabus upload/paste & confidence setup
│   │   ├── SyllabusAnalysisView.tsx # Priority score breakdown & interactive table
│   │   ├── QuestionsView.tsx        # Categorized practice questions & plan toggles
│   │   ├── StudyPlanView.tsx        # Timed multi-day schedule & discrepancy notices
│   │   ├── TodaysPlanView.tsx       # Active checklist & Pomodoro sprint timer
│   │   ├── ProgressView.tsx         # Recharts readiness & unit mastery analytics
│   │   ├── WhatToStudyModal.tsx     # Real-time study decision recommendation
│   │   └── LimitedTimeModal.tsx     # 30m / 1h / 3h / custom micro-plan generator
│   └── lib/
│       ├── types.ts                 # Type definitions
│       ├── priority-engine.ts       # Deterministic priority scoring algorithm
│       ├── planner-engine.ts        # Adaptive replanning & time-budget generator
│       ├── demo-data.ts             # Pre-seeded DBMS dataset
│       ├── gemini.ts                # Gemini API client & fallback parser
│       └── store.tsx                # Context provider & LocalStorage persistence
└── tests/
    └── engine.test.ts               # Test suite for priority math, planner & replanning
```

---

## 🔒 Security & Academic Integrity

- **API Keys**: Stored exclusively in server-side API routes; never exposed to the client.
- **Academic Disclaimer**: Practice questions are clearly designated as high-priority revision tools and never guarantee exam appearance.
- **Deterministic Transparency**: Scoring formulas are auditable and explained in-app with full weight breakdowns.
