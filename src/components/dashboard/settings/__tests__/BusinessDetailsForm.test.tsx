import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

import BusinessDetailsForm from '../BusinessDetailsForm';

const EMPTY = {
  businessName: '',
  businessNumber: '',
  vatNumber: '',
  businessAddress: '',
  businessType: undefined as 'licensed' | 'exempt' | 'company' | undefined,
};

const FILLED = {
  businessName: 'Cohen Therapy',
  businessNumber: '123456789',
  vatNumber: '987654321',
  businessAddress: 'Dizengoff 1, Tel Aviv',
  businessType: 'licensed' as const,
};

// ── A. Rendering ──────────────────────────────────────────────────────────────

describe('A. Rendering', () => {
  it('A1: renders all five fields', () => {
    render(<BusinessDetailsForm initial={EMPTY} />);
    expect(screen.getByPlaceholderText('businessNamePlaceholder')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('businessNumberPlaceholder')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('vatNumberPlaceholder')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('businessAddressPlaceholder')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument(); // businessType select
  });

  it('A2: pre-fills with initial values', () => {
    render(<BusinessDetailsForm initial={FILLED} />);
    expect(screen.getByPlaceholderText('businessNamePlaceholder')).toHaveValue('Cohen Therapy');
    expect(screen.getByPlaceholderText('businessNumberPlaceholder')).toHaveValue('123456789');
    expect(screen.getByDisplayValue('businessTypeLicensed')).toBeInTheDocument();
  });

  it('A3: renders save button', () => {
    render(<BusinessDetailsForm initial={EMPTY} />);
    expect(screen.getByRole('button', { name: 'save' })).toBeInTheDocument();
  });
});

// ── B. Save flow ──────────────────────────────────────────────────────────────

describe('B. Save flow', () => {
  it('B1: calls PUT /api/settings/business on submit', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    global.fetch = mockFetch;

    render(<BusinessDetailsForm initial={FILLED} />);
    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/settings/business',
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

  it('B2: sends current form values in the request body', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    global.fetch = mockFetch;

    render(<BusinessDetailsForm initial={EMPTY} />);
    fireEvent.change(screen.getByPlaceholderText('businessNamePlaceholder'), {
      target: { value: 'New Clinic' },
    });
    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() => {
      const body = JSON.parse((mockFetch.mock.calls[0]![1] as { body: string }).body);
      expect(body.businessName).toBe('New Clinic');
    });
  });

  it('B3: shows saved confirmation after successful save', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    render(<BusinessDetailsForm initial={FILLED} />);
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() => {
      expect(screen.getByText('saved')).toBeInTheDocument();
    });
  });

  it('B4: shows error message when save fails', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    render(<BusinessDetailsForm initial={FILLED} />);
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() => {
      expect(screen.getByText('error')).toBeInTheDocument();
    });
  });

  it('B5: saved message disappears when user edits a field after saving', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    render(<BusinessDetailsForm initial={FILLED} />);
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() => screen.getByText('saved'));

    fireEvent.change(screen.getByPlaceholderText('businessNamePlaceholder'), {
      target: { value: 'Changed Name' },
    });
    expect(screen.queryByText('saved')).not.toBeInTheDocument();
  });
});

// ── C. businessType select ────────────────────────────────────────────────────

describe('C. Business type select', () => {
  it('C1: renders all four options including the empty option', () => {
    render(<BusinessDetailsForm initial={EMPTY} />);
    const select = screen.getByRole('combobox');
    const options = Array.from(select.querySelectorAll('option')).map((o) => o.value);
    expect(options).toContain('');
    expect(options).toContain('licensed');
    expect(options).toContain('exempt');
    expect(options).toContain('company');
  });

  it('C2: selecting a type updates the select value', () => {
    render(<BusinessDetailsForm initial={EMPTY} />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'exempt' } });
    expect((select as HTMLSelectElement).value).toBe('exempt');
  });
});
