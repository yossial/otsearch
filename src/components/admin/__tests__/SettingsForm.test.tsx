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

vi.mock('@/components/ui/FormSelect', () => ({
  default: ({
    value,
    onChange,
    options,
  }: {
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
  }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="settings.fields.defaultSort"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  ),
}));

import SettingsForm from '../SettingsForm';

const DEFAULT_SETTINGS = {
  showTherapistFee: true,
  showTherapistRating: false,
  showTherapistMap: true,
  featuredSectionEnabled: false,
  newRegistrationsEnabled: true,
  requireAdminApproval: false,
  contactEmail: 'admin@therapio.co.il',
  defaultSortOrder: 'rating' as const,
  premiumMonthlyPrice: 149,
  premiumAnnualPrice: 999,
};

// ── A. Rendering ──────────────────────────────────────────────────────────────

describe('A. Rendering', () => {
  it('A1: renders all four section headings', () => {
    render(<SettingsForm settings={DEFAULT_SETTINGS} />);
    expect(screen.getByText('settings.sections.featureFlags')).toBeInTheDocument();
    expect(screen.getByText('settings.sections.registration')).toBeInTheDocument();
    expect(screen.getByText('settings.sections.platform')).toBeInTheDocument();
    expect(screen.getByText('settings.sections.pricing')).toBeInTheDocument();
  });

  it('A2: renders all six toggle switches', () => {
    render(<SettingsForm settings={DEFAULT_SETTINGS} />);
    const switches = screen.getAllByRole('switch');
    expect(switches).toHaveLength(6);
  });

  it('A3: toggles reflect initial settings via aria-checked', () => {
    render(<SettingsForm settings={DEFAULT_SETTINGS} />);
    const switches = screen.getAllByRole('switch');
    // showTherapistFee=true → aria-checked="true"
    expect(switches[0]).toHaveAttribute('aria-checked', 'true');
    // showTherapistRating=false → aria-checked="false"
    expect(switches[1]).toHaveAttribute('aria-checked', 'false');
  });

  it('A4: renders contact email input with initial value', () => {
    render(<SettingsForm settings={DEFAULT_SETTINGS} />);
    const emailInput = screen.getByDisplayValue('admin@therapio.co.il');
    expect(emailInput).toBeInTheDocument();
  });

  it('A5: renders sort order select with initial value', () => {
    render(<SettingsForm settings={DEFAULT_SETTINGS} />);
    const select = screen.getByLabelText('settings.fields.defaultSort');
    expect((select as HTMLSelectElement).value).toBe('rating');
  });

  it('A6: renders monthly and annual price inputs', () => {
    render(<SettingsForm settings={DEFAULT_SETTINGS} />);
    expect(screen.getByDisplayValue('149')).toBeInTheDocument();
    expect(screen.getByDisplayValue('999')).toBeInTheDocument();
  });
});

// ── B. Toggle behaviour ───────────────────────────────────────────────────────

describe('B. Toggle behaviour', () => {
  beforeEach(() => {
    mockToastSuccess.mockClear();
    mockToastError.mockClear();
  });

  it('B1: clicking a toggle calls PATCH /api/admin/settings with the toggled key', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ...DEFAULT_SETTINGS, showTherapistFee: false }),
    });
    global.fetch = mockFetch;

    render(<SettingsForm settings={DEFAULT_SETTINGS} />);
    // First switch = showTherapistFee (currently true)
    fireEvent.click(screen.getAllByRole('switch')[0]!);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/settings',
        expect.objectContaining({ method: 'PATCH' })
      );
      const body = JSON.parse((mockFetch.mock.calls[0]![1] as { body: string }).body);
      expect(body.showTherapistFee).toBe(false);
    });
  });

  it('B2: aria-checked updates optimistically before server responds', async () => {
    // Return a never-resolving promise to test the optimistic update
    global.fetch = vi.fn().mockReturnValue(new Promise(() => {}));

    render(<SettingsForm settings={DEFAULT_SETTINGS} />);
    const firstSwitch = screen.getAllByRole('switch')[0]!;
    expect(firstSwitch).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(firstSwitch);
    // Optimistic update happens synchronously inside startTransition
    await waitFor(() => {
      expect(screen.getAllByRole('switch')[0]).toHaveAttribute('aria-checked', 'false');
    });
  });

  it('B3: shows toast.success after successful toggle', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => DEFAULT_SETTINGS,
    });
    render(<SettingsForm settings={DEFAULT_SETTINGS} />);
    fireEvent.click(screen.getAllByRole('switch')[0]!);
    await waitFor(() => expect(mockToastSuccess).toHaveBeenCalledWith('toast.saved'));
  });

  it('B4: shows toast.error when toggle PATCH fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false });
    render(<SettingsForm settings={DEFAULT_SETTINGS} />);
    fireEvent.click(screen.getAllByRole('switch')[0]!);
    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('toast.error'));
  });

  it('B5: toggling a false switch calls PATCH with value true', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => DEFAULT_SETTINGS,
    });
    global.fetch = mockFetch;
    render(<SettingsForm settings={DEFAULT_SETTINGS} />);
    // second switch = showTherapistRating (currently false)
    fireEvent.click(screen.getAllByRole('switch')[1]!);
    await waitFor(() => {
      const body = JSON.parse((mockFetch.mock.calls[0]![1] as { body: string }).body);
      expect(body.showTherapistRating).toBe(true);
    });
  });
});

// ── C. Field updates ──────────────────────────────────────────────────────────

describe('C. Field updates', () => {
  beforeEach(() => {
    mockToastSuccess.mockClear();
    mockToastError.mockClear();
  });

  it('C1: blurring contact email calls PATCH with new email value', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => DEFAULT_SETTINGS,
    });
    global.fetch = mockFetch;

    render(<SettingsForm settings={DEFAULT_SETTINGS} />);
    const emailInput = screen.getByDisplayValue('admin@therapio.co.il');
    fireEvent.change(emailInput, { target: { value: 'new@therapio.co.il' } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/settings',
        expect.objectContaining({ method: 'PATCH' })
      );
      const body = JSON.parse((mockFetch.mock.calls[0]![1] as { body: string }).body);
      expect(body.contactEmail).toBe('new@therapio.co.il');
    });
  });

  it('C2: changing sort order select calls PATCH with new sort value', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => DEFAULT_SETTINGS,
    });
    global.fetch = mockFetch;

    render(<SettingsForm settings={DEFAULT_SETTINGS} />);
    const select = screen.getByLabelText('settings.fields.defaultSort');
    fireEvent.change(select, { target: { value: 'newest' } });

    await waitFor(() => {
      const body = JSON.parse((mockFetch.mock.calls[0]![1] as { body: string }).body);
      expect(body.defaultSortOrder).toBe('newest');
    });
  });

  it('C3: blurring monthly price calls PATCH with numeric value', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => DEFAULT_SETTINGS,
    });
    global.fetch = mockFetch;

    render(<SettingsForm settings={DEFAULT_SETTINGS} />);
    const monthlyInput = screen.getByDisplayValue('149');
    fireEvent.change(monthlyInput, { target: { value: '199' } });
    fireEvent.blur(monthlyInput);

    await waitFor(() => {
      const body = JSON.parse((mockFetch.mock.calls[0]![1] as { body: string }).body);
      expect(body.premiumMonthlyPrice).toBe(199);
    });
  });

  it('C4: blurring annual price calls PATCH with numeric value', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => DEFAULT_SETTINGS,
    });
    global.fetch = mockFetch;

    render(<SettingsForm settings={DEFAULT_SETTINGS} />);
    const annualInput = screen.getByDisplayValue('999');
    fireEvent.change(annualInput, { target: { value: '1299' } });
    fireEvent.blur(annualInput);

    await waitFor(() => {
      const body = JSON.parse((mockFetch.mock.calls[0]![1] as { body: string }).body);
      expect(body.premiumAnnualPrice).toBe(1299);
    });
  });

  it('C5: shows toast.success after successful field update', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => DEFAULT_SETTINGS,
    });
    render(<SettingsForm settings={DEFAULT_SETTINGS} />);
    const emailInput = screen.getByDisplayValue('admin@therapio.co.il');
    fireEvent.change(emailInput, { target: { value: 'x@y.com' } });
    fireEvent.blur(emailInput);
    await waitFor(() => expect(mockToastSuccess).toHaveBeenCalledWith('toast.saved'));
  });

  it('C6: shows toast.error when field PATCH fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false });
    render(<SettingsForm settings={DEFAULT_SETTINGS} />);
    const emailInput = screen.getByDisplayValue('admin@therapio.co.il');
    fireEvent.blur(emailInput);
    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('toast.error'));
  });
});

// ── D. Toggle labels ──────────────────────────────────────────────────────────

describe('D. Toggle labels', () => {
  it('D1: renders all 6 feature flag and registration labels', () => {
    render(<SettingsForm settings={DEFAULT_SETTINGS} />);
    expect(screen.getByText('settings.flags.showFee')).toBeInTheDocument();
    expect(screen.getByText('settings.flags.showRating')).toBeInTheDocument();
    expect(screen.getByText('settings.flags.showMap')).toBeInTheDocument();
    expect(screen.getByText('settings.flags.featuredSection')).toBeInTheDocument();
    expect(screen.getByText('settings.flags.newRegistrations')).toBeInTheDocument();
    expect(screen.getByText('settings.flags.requireApproval')).toBeInTheDocument();
  });
});
