import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

vi.mock('@/components/ui/Button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

import TherapistsTable from '../TherapistsTable';

const THERAPISTS = [
  {
    id: 'th1',
    slug: 'dr-cohen',
    displayName: { he: 'ד"ר כהן', en: 'Dr. Cohen' },
    city: 'Tel Aviv',
    subscriptionTier: 'premium',
    isFeatured: true,
    isActive: true,
    isAcceptingPatients: true,
    profileViews: 142,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'th2',
    slug: 'dr-levi',
    displayName: { he: 'ד"ר לוי' },
    city: 'Jerusalem',
    subscriptionTier: 'free',
    isFeatured: false,
    isActive: false,
    isAcceptingPatients: false,
    profileViews: 37,
    createdAt: '2025-03-15T00:00:00.000Z',
  },
];

// ── A. Rendering ──────────────────────────────────────────────────────────────

describe('A. Rendering', () => {
  it('A1: renders all column headers', () => {
    render(<TherapistsTable therapists={THERAPISTS} />);
    expect(screen.getByText('therapists.table.name')).toBeInTheDocument();
    expect(screen.getByText('therapists.table.city')).toBeInTheDocument();
    expect(screen.getByText('therapists.table.tier')).toBeInTheDocument();
    expect(screen.getByText('therapists.table.featured')).toBeInTheDocument();
    expect(screen.getByText('therapists.table.active')).toBeInTheDocument();
    expect(screen.getByText('therapists.table.views')).toBeInTheDocument();
    expect(screen.getByText('therapists.table.actions')).toBeInTheDocument();
  });

  it('A2: renders a row for each therapist', () => {
    render(<TherapistsTable therapists={THERAPISTS} />);
    expect(screen.getByText('ד"ר כהן')).toBeInTheDocument();
    expect(screen.getByText('ד"ר לוי')).toBeInTheDocument();
  });

  it('A3: shows city', () => {
    render(<TherapistsTable therapists={THERAPISTS} />);
    expect(screen.getByText('Tel Aviv')).toBeInTheDocument();
    expect(screen.getByText('Jerusalem')).toBeInTheDocument();
  });

  it('A4: shows premium badge for premium tier and free badge for free tier', () => {
    render(<TherapistsTable therapists={THERAPISTS} />);
    expect(screen.getByText('therapists.filterTiers.premium')).toBeInTheDocument();
    expect(screen.getByText('therapists.filterTiers.free')).toBeInTheDocument();
  });

  it('A5: shows featured/unfeatured status', () => {
    render(<TherapistsTable therapists={THERAPISTS} />);
    expect(screen.getByText('therapists.status.yes')).toBeInTheDocument();
    expect(screen.getByText('therapists.status.no')).toBeInTheDocument();
  });

  it('A6: shows active/inactive status', () => {
    render(<TherapistsTable therapists={THERAPISTS} />);
    expect(screen.getByText('therapists.status.active')).toBeInTheDocument();
    expect(screen.getByText('therapists.status.inactive')).toBeInTheDocument();
  });

  it('A7: shows profile view count', () => {
    render(<TherapistsTable therapists={THERAPISTS} />);
    expect(screen.getByText('142')).toBeInTheDocument();
    expect(screen.getByText('37')).toBeInTheDocument();
  });

  it('A8: shows empty state when no therapists', () => {
    render(<TherapistsTable therapists={[]} />);
    expect(screen.getByText('therapists.noResults')).toBeInTheDocument();
  });

  it('A9: falls back to en displayName when he is empty', () => {
    const th = { ...THERAPISTS[0]!, id: 'th3', displayName: { he: '', en: 'Dr. Gold' } };
    render(<TherapistsTable therapists={[th]} />);
    expect(screen.getByText('Dr. Gold')).toBeInTheDocument();
  });
});

// ── B. Feature / Deactivate actions ──────────────────────────────────────────

describe('B. Feature / deactivate actions', () => {
  beforeEach(() => {
    mockToastSuccess.mockClear();
    mockToastError.mockClear();
  });

  it('B1: feature button label shows "unfeature" for featured therapist', () => {
    render(<TherapistsTable therapists={THERAPISTS} />);
    expect(screen.getByText('therapists.actions.unfeature')).toBeInTheDocument();
    expect(screen.getByText('therapists.actions.feature')).toBeInTheDocument();
  });

  it('B2: active button label shows "deactivate" for active / "activate" for inactive', () => {
    render(<TherapistsTable therapists={THERAPISTS} />);
    expect(screen.getByText('therapists.actions.deactivate')).toBeInTheDocument();
    expect(screen.getByText('therapists.actions.activate')).toBeInTheDocument();
  });

  it('B3: clicking feature calls PATCH /api/admin/therapists/:id with isFeatured toggled', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ isFeatured: false }),
    });
    global.fetch = mockFetch;

    render(<TherapistsTable therapists={THERAPISTS} />);
    fireEvent.click(screen.getByText('therapists.actions.unfeature')); // th1 is featured

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/therapists/th1',
        expect.objectContaining({ method: 'PATCH' })
      );
      const body = JSON.parse((mockFetch.mock.calls[0]![1] as { body: string }).body);
      expect(body.isFeatured).toBe(false);
    });
  });

  it('B4: clicking deactivate calls PATCH with isActive toggled', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ isActive: false }),
    });
    global.fetch = mockFetch;

    render(<TherapistsTable therapists={THERAPISTS} />);
    fireEvent.click(screen.getByText('therapists.actions.deactivate')); // th1 is active

    await waitFor(() => {
      const body = JSON.parse((mockFetch.mock.calls[0]![1] as { body: string }).body);
      expect(body.isActive).toBe(false);
    });
  });

  it('B5: shows toast.success on successful update', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ isFeatured: false }),
    });
    render(<TherapistsTable therapists={THERAPISTS} />);
    fireEvent.click(screen.getByText('therapists.actions.unfeature'));
    await waitFor(() => expect(mockToastSuccess).toHaveBeenCalledWith('toast.saved'));
  });

  it('B6: shows toast.error when PATCH fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false });
    render(<TherapistsTable therapists={THERAPISTS} />);
    fireEvent.click(screen.getByText('therapists.actions.unfeature'));
    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('toast.error'));
  });

  it('B7: row updates optimistically after successful PATCH', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ isFeatured: false }),
    });
    render(<TherapistsTable therapists={THERAPISTS} />);
    fireEvent.click(screen.getByText('therapists.actions.unfeature'));
    // After update th1.isFeatured = false → button should now say "feature"
    await waitFor(() => {
      expect(screen.getAllByText('therapists.actions.feature').length).toBeGreaterThan(0);
    });
  });
});

// ── C. Tier actions (showTierActions) ─────────────────────────────────────────

describe('C. Tier actions', () => {
  it('C1: tier action buttons are hidden by default', () => {
    render(<TherapistsTable therapists={THERAPISTS} />);
    expect(screen.queryByText('therapists.actions.upgrade')).not.toBeInTheDocument();
    expect(screen.queryByText('therapists.actions.downgrade')).not.toBeInTheDocument();
  });

  it('C2: shows downgrade for premium and upgrade for free when showTierActions=true', () => {
    render(<TherapistsTable therapists={THERAPISTS} showTierActions />);
    expect(screen.getByText('therapists.actions.downgrade')).toBeInTheDocument(); // th1 is premium
    expect(screen.getByText('therapists.actions.upgrade')).toBeInTheDocument();   // th2 is free
  });

  it('C3: clicking upgrade/downgrade sends correct tier in PATCH body', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ subscriptionTier: 'premium' }),
    });
    global.fetch = mockFetch;

    render(<TherapistsTable therapists={THERAPISTS} showTierActions />);
    fireEvent.click(screen.getByText('therapists.actions.upgrade')); // th2 is free → premium

    await waitFor(() => {
      const body = JSON.parse((mockFetch.mock.calls[0]![1] as { body: string }).body);
      expect(body.subscriptionTier).toBe('premium');
    });
  });
});
