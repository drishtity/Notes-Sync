import { NextRequest, NextResponse } from 'next/server';
import { generateQuestionsWithGemini } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { syllabusText, topics, pastPapersText } = body;

    if (!Array.isArray(topics) || topics.length === 0) {
      return NextResponse.json(
        { error: 'A list of topics is required to generate practice questions.' },
        { status: 400 }
      );
    }

    const questions = await generateQuestionsWithGemini(
      syllabusText || '',
      topics,
      pastPapersText
    );

    return NextResponse.json({ questions });
  } catch (err: unknown) {
    console.error('API /generate-questions error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate practice questions.' },
      { status: 500 }
    );
  }
}
