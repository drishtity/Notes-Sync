import { NextRequest, NextResponse } from 'next/server';
import { analyzeSyllabusWithGemini } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { syllabusText, subjectName } = body;

    if (!syllabusText || typeof syllabusText !== 'string' || syllabusText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Syllabus content cannot be empty. Please paste or upload your syllabus.' },
        { status: 400 }
      );
    }

    if (syllabusText.trim().length < 10) {
      return NextResponse.json(
        { error: 'Syllabus text is too short. Please provide at least a few topics or units.' },
        { status: 400 }
      );
    }

    const result = await analyzeSyllabusWithGemini(syllabusText, subjectName || 'New Subject');
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('API /analyze-syllabus error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error processing syllabus.' },
      { status: 500 }
    );
  }
}
