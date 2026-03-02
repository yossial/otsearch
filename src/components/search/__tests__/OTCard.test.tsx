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
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock @/lib/utils
vi.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

// Mock next-intl hooks
vi.mock('next-intl', () => ({
  useTranslations: (_ns: string) => (key: string) => {
    const map: Record<string, string> = {
      otTitle: 'מרפא/ה בעיסוק',
      acceptingPatientsFilter: 'מקבל/ת מטופלים חדשים',
      messageButton: 'הודעה',
      viewProfile: 'צפה בפרופיל',
      insuranceLabel: 'ביטוח:',
      sessionLabel: 'טיפול:',
      feePerSession: 'לטיפול',
      noFeeInfo: 'מחיר לפי פניה',
    };
    return map[key] ?? key;
  },
  useLocale: () => 'he',
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
  it('renders the OT name', () => {
    render(<OTCard ot={mockProfile} />);
    expect(screen.getByText('ד"ר בדיקה')).toBeInTheDocument();
  });

  it('falls back to Hebrew name when locale name is missing', () => {
    const noEn = { ...mockProfile, displayName: { he: 'ד"ר בדיקה', ar: 'د. اختبار', en: '' } };
    render(<OTCard ot={noEn} />);
    expect(screen.getByText('ד"ר בדיקה')).toBeInTheDocument();
  });

  it('renders the city', () => {
    render(<OTCard ot={mockProfile} />);
    expect(screen.getByText('תל אביב')).toBeInTheDocument();
  });

  it('renders fee range', () => {
    render(<OTCard ot={mockProfile} />);
    expect(screen.getByText('250–400')).toBeInTheDocument();
  });

  it('shows accepting patients badge when isAcceptingPatients is true', () => {
    render(<OTCard ot={mockProfile} />);
    expect(screen.getByText(/מקבל/)).toBeInTheDocument();
  });

  it('shows PRO badge for premium subscription', () => {
    const premium = { ...mockProfile, subscriptionTier: 'premium' as const };
    render(<OTCard ot={premium} />);
    expect(screen.getByText('PRO')).toBeInTheDocument();
  });

  it('does not show PRO badge for free subscription', () => {
    render(<OTCard ot={mockProfile} />);
    expect(screen.queryByText('PRO')).not.toBeInTheDocument();
  });

  it('renders a link to the OT profile page', () => {
    render(<OTCard ot={mockProfile} />);
    const link = screen.getByRole('link', { name: /פרופיל/i });
    expect(link).toHaveAttribute('href', '/ot/dr-test');
  });
});
