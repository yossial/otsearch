import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (!session?.user || role !== 'therapist') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { patientContext, sessionDate, duration, goalsAddressed, mode } = body;

  // Build prompt from context
  const contextParts: string[] = [];
  if (sessionDate && typeof sessionDate === 'string') {
    contextParts.push(`Session date: ${sessionDate}`);
  }
  if (duration && typeof duration === 'number') {
    contextParts.push(`Duration: ${duration} minutes`);
  }
  if (Array.isArray(goalsAddressed) && goalsAddressed.length > 0) {
    contextParts.push(`Goals addressed: ${(goalsAddressed as string[]).join(', ')}`);
  }
  if (patientContext && typeof patientContext === 'string') {
    contextParts.push(`Patient context: ${patientContext}`);
  }

  const isSoap = mode !== 'freetext';
  const formatInstructions = isSoap
    ? `Return a JSON object with keys: subjective, objective, assessment, plan. Each value is a short paragraph (2-4 sentences) in Hebrew, written in professional occupational therapy clinical language.`
    : `Return a JSON object with key: freeText. The value is a structured clinical note in Hebrew (3-6 sentences) in professional occupational therapy language.`;

  const systemPrompt = `You are an experienced occupational therapist (מרפא בעיסוק) writing clinical session notes. Write concise, professional, evidence-based notes in Hebrew. ${formatInstructions} Only return valid JSON, no extra text.`;

  const userPrompt = contextParts.length > 0
    ? `Generate a clinical session note draft based on the following context:\n${contextParts.join('\n')}`
    : `Generate a generic occupational therapy session note draft.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected response from AI' }, { status: 500 });
    }

    let draft: Record<string, string>;
    try {
      // Strip markdown code fences if present
      const cleaned = content.text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
      draft = JSON.parse(cleaned) as Record<string, string>;
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    return NextResponse.json({ draft });
  } catch (err) {
    console.error('AI draft error:', err);
    return NextResponse.json({ error: 'AI service error' }, { status: 500 });
  }
}
