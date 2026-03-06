import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { TherapistProfile } from '@/lib/db/models/TherapistProfile';
import { getIsraelCities } from '@/lib/gov/govApi';

export const dynamic = 'force-dynamic';

interface Suggestion {
  type: 'therapist' | 'city' | 'specialisation';
  label: string;
  value: string;
}

const SPECIALISATION_LABELS: Record<string, string> = {
  paediatrics: 'Child Development',
  neurological: 'Neurological Rehab',
  'mental-health': 'Mental Health',
  'hand-therapy': 'Hand Rehabilitation',
  geriatrics: 'Geriatrics',
  'sensory-processing': 'Sensory Processing',
  vocational: 'Vocational Rehab',
  ergonomic: 'Ergonomics',
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() ?? '';

  if (q.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  const suggestions: Suggestion[] = [];

  try {
    // Therapist name matches
    await connectDB();
    const profiles = await TherapistProfile.find(
      {
        isActive: true,
        $or: [
          { 'displayName.he': { $regex: q, $options: 'i' } },
          { 'displayName.en': { $regex: q, $options: 'i' } },
        ],
      },
      { displayName: 1, slug: 1 }
    )
      .limit(4)
      .lean();

    for (const p of profiles) {
      const name = (p.displayName as { he?: string; en?: string }).he ?? (p.displayName as { en?: string }).en ?? '';
      if (name) {
        suggestions.push({ type: 'therapist', label: name, value: name });
      }
    }
  } catch {
    // DB unavailable — skip therapist suggestions
  }

  try {
    // City prefix matches
    const cities = await getIsraelCities();
    const cityMatches = cities
      .filter((c) => c.name.includes(q))
      .slice(0, 3);
    for (const c of cityMatches) {
      suggestions.push({ type: 'city', label: c.name, value: c.name });
    }
  } catch {
    // skip city suggestions
  }

  // Specialisation keyword matches
  for (const [key, label] of Object.entries(SPECIALISATION_LABELS)) {
    if (label.toLowerCase().includes(q.toLowerCase()) || key.includes(q.toLowerCase())) {
      suggestions.push({ type: 'specialisation', label, value: key });
      if (suggestions.length >= 8) break;
    }
  }

  return NextResponse.json({ suggestions: suggestions.slice(0, 8) });
}
