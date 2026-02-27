import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import type { OTProfilePublic } from '@/types';

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock @/i18n/navigation
vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock @/lib/utils
vi.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

import OTCard from '../OTCard';

const mockProfile: OTProfilePublic = {
  id: '1',
  slug: 'dr-test',
  displayName: { he: 'ד"ר בדיקה', ar: 'د. اختبار', en: 'Dr. Test' },
  bio: { he: 'ביו בעברית', ar: 'السيرة بالعربية', en: 'Bio in English' },
  photo: null,
  mohRegistrationNumber: 'MOH-1234',
  specialisations: ['paediatrics', 'neurological'],
  languages: ['he', 'en'],
  location: { type: 'Point', coordinates: [34.78, 32.08], city: 'תל אביב', address: 'רחוב הרצל 1' },
  sessionTypes: ['in-person', 'telehealth'],
  insuranceAccepted: ['maccabi', 'clalit'],
  feeRange: { min: 250, max: 400, currency: 'ILS' },
  contactEmail: 'dr@example.com',
  contactPhone: '050-1234567',
  subscriptionTier: 'free',
  isFeatured: false,
  isAcceptingPatients: true,
  profileViews: 42,
  createdAt: '2024-01-01T00:00:00.000Z',
};

describe('OTCard', () => {
  it('renders the OT name in the given locale', () => {
    render(<OTCard ot={mockProfile} locale="en" />);
    expect(screen.getByText('Dr. Test')).toBeInTheDocument();
  });

  it('falls back to Hebrew name when locale name is missing', () => {
    const noFr = { ...mockProfile, displayName: { he: 'ד"ר בדיקה', ar: 'د. اختبار', en: '' } };
    render(<OTCard ot={noFr} locale="fr" />);
    // locale 'fr' not in displayName keys → fallback to .he
    expect(screen.getByText('ד"ר בדיקה')).toBeInTheDocument();
  });

  it('renders the city', () => {
    render(<OTCard ot={mockProfile} locale="he" />);
    expect(screen.getByText('תל אביב')).toBeInTheDocument();
  });

  it('renders fee range', () => {
    render(<OTCard ot={mockProfile} locale="he" />);
    expect(screen.getByText(/₪250/)).toBeInTheDocument();
  });

  it('shows accepting patients badge when isAcceptingPatients is true', () => {
    render(<OTCard ot={mockProfile} locale="he" />);
    expect(screen.getByText(/מקבל/)).toBeInTheDocument();
  });

  it('shows PRO badge for premium subscription', () => {
    const premium = { ...mockProfile, subscriptionTier: 'premium' as const };
    render(<OTCard ot={premium} locale="he" />);
    expect(screen.getByText('PRO')).toBeInTheDocument();
  });

  it('does not show PRO badge for free subscription', () => {
    render(<OTCard ot={mockProfile} locale="he" />);
    expect(screen.queryByText('PRO')).not.toBeInTheDocument();
  });

  it('renders a link to the OT profile page', () => {
    render(<OTCard ot={mockProfile} locale="he" />);
    const link = screen.getByRole('link', { name: /פרופיל/i });
    expect(link).toHaveAttribute('href', '/ot/dr-test');
  });
});
