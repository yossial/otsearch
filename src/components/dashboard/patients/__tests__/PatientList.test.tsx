import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/components/ui/FormSelect', () => ({
  default: ({
    value,
    onChange,
    options,
    placeholder,
  }: {
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
  }) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label="status-filter">
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  ),
}));

import PatientList from '../PatientList';

const PATIENTS = [
  {
    _id: 'p1',
    firstName: 'Sarah',
    lastName: 'Cohen',
    dateOfBirth: '1990-01-01T00:00:00.000Z',
    type: 'direct' as const,
    insurance: 'clalit',
    status: 'active' as const,
  },
  {
    _id: 'p2',
    firstName: 'Ben',
    lastName: 'Levi',
    dateOfBirth: '2018-06-15T00:00:00.000Z',
    type: 'child' as const,
    status: 'inactive' as const,
  },
  {
    _id: 'p3',
    firstName: 'Miriam',
    lastName: 'Gold',
    dateOfBirth: '1975-11-30T00:00:00.000Z',
    type: 'direct' as const,
    status: 'archived' as const,
  },
];

// ── A. Rendering ──────────────────────────────────────────────────────────────

describe('A. Rendering', () => {
  it('A1: renders all patient rows from initialPatients', () => {
    render(<PatientList initialPatients={PATIENTS} initialTotal={3} />);
    expect(screen.getByText('Sarah Cohen')).toBeInTheDocument();
    expect(screen.getByText('Ben Levi')).toBeInTheDocument();
    expect(screen.getByText('Miriam Gold')).toBeInTheDocument();
  });

  it('A2: shows total count', () => {
    render(<PatientList initialPatients={PATIENTS} initialTotal={3} />);
    expect(screen.getByText(/^3/)).toBeInTheDocument();
  });

  it('A3: renders a link to each patient detail page', () => {
    render(<PatientList initialPatients={PATIENTS} initialTotal={3} />);
    expect(screen.getByRole('link', { name: /Sarah Cohen/ })?.getAttribute('href')).toContain('p1');
  });

  it('A4: shows empty state when no patients', () => {
    render(<PatientList initialPatients={[]} initialTotal={0} />);
    expect(screen.getByText('noPatients')).toBeInTheDocument();
  });

  it('A5: shows type badge (direct vs child)', () => {
    render(<PatientList initialPatients={PATIENTS} initialTotal={3} />);
    // 2 direct patients, 1 child
    expect(screen.getAllByText('typeDirect').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('typeChild').length).toBeGreaterThanOrEqual(1);
  });

  it('A6: shows status badges for each patient', () => {
    render(<PatientList initialPatients={PATIENTS} initialTotal={3} />);
    expect(screen.getByText('statusActive')).toBeInTheDocument();
    expect(screen.getByText('statusInactive')).toBeInTheDocument();
    expect(screen.getByText('statusArchived')).toBeInTheDocument();
  });
});

// ── B. Search ─────────────────────────────────────────────────────────────────

describe('B. Client-side search via API', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.runAllTimers(); vi.useRealTimers(); });

  it('B1: fetches patients from API after debounce when search is typed', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ patients: [PATIENTS[0]], total: 1 }),
    });
    global.fetch = mockFetch;

    render(<PatientList initialPatients={PATIENTS} initialTotal={3} />);
    const searchInput = screen.getByPlaceholderText('searchPlaceholder');

    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'sarah' } });
      vi.advanceTimersByTime(350); // past the 300ms debounce
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('search=sarah')
    );
  });

  it('B2: restores initialPatients when search is cleared', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ patients: [PATIENTS[0]], total: 1 }),
    });
    global.fetch = mockFetch;

    render(<PatientList initialPatients={PATIENTS} initialTotal={3} />);
    const searchInput = screen.getByPlaceholderText('searchPlaceholder');

    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'sarah' } });
      vi.advanceTimersByTime(350);
    });
    expect(mockFetch).toHaveBeenCalled();

    await act(async () => {
      fireEvent.change(searchInput, { target: { value: '' } });
      vi.advanceTimersByTime(350);
    });

    // all 3 patients from initialPatients visible again
    expect(screen.getByText('Sarah Cohen')).toBeInTheDocument();
    expect(screen.getByText('Ben Levi')).toBeInTheDocument();
  });
});

// ── C. Status filter ──────────────────────────────────────────────────────────

describe('C. Status filter', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.runAllTimers(); vi.useRealTimers(); });

  it('C1: fetches with status param when status filter is changed', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ patients: [PATIENTS[0]], total: 1 }),
    });
    global.fetch = mockFetch;

    render(<PatientList initialPatients={PATIENTS} initialTotal={3} />);
    const statusSelect = screen.getByLabelText('status-filter');

    await act(async () => {
      fireEvent.change(statusSelect, { target: { value: 'active' } });
      vi.advanceTimersByTime(350);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('status=active')
    );
  });
});
