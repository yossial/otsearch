import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockPush = vi.fn();
const mockBack = vi.fn();

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
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
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label="selectPatient">
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  ),
}));

import InvoiceForm from '../InvoiceForm';

const PATIENTS = [
  { _id: 'p1', name: 'John Doe' },
  { _id: 'p2', name: 'Jane Smith' },
];

const DEFAULT_PROPS = {
  locale: 'en',
  patients: PATIENTS,
  therapistName: 'Dr. Cohen',
  businessNumber: '123456789',
};

// ── A. Rendering ──────────────────────────────────────────────────────────────

describe('A. Rendering', () => {
  it('A1: renders patient selector, line item row, VAT checkbox, and save button', () => {
    render(<InvoiceForm {...DEFAULT_PROPS} />);
    expect(screen.getByLabelText('selectPatient')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('description')).toBeInTheDocument();
    expect(screen.getByText(/vatIncluded/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'save' })).toBeInTheDocument();
  });

  it('A2: pre-fills therapistName and businessNumber inputs', () => {
    render(<InvoiceForm {...DEFAULT_PROPS} />);
    const textboxes = screen.getAllByRole('textbox');
    const therapistInput = textboxes.find((el) => (el as HTMLInputElement).value === 'Dr. Cohen');
    const bnInput = textboxes.find((el) => (el as HTMLInputElement).value === '123456789');
    expect(therapistInput).toBeTruthy();
    expect(bnInput).toBeTruthy();
  });

  it('A3: renders one line item row by default', () => {
    render(<InvoiceForm {...DEFAULT_PROPS} />);
    expect(screen.getAllByPlaceholderText('description')).toHaveLength(1);
  });

  it('A4: VAT checkbox is checked by default', () => {
    render(<InvoiceForm {...DEFAULT_PROPS} />);
    const checkbox = document.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(checkbox?.checked).toBe(true);
  });
});

// ── B. Line item management ───────────────────────────────────────────────────

describe('B. Line item management', () => {
  it('B1: adds a new line item row when + addLine is clicked', () => {
    render(<InvoiceForm {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByText(/\+ addLine/i));
    expect(screen.getAllByPlaceholderText('description')).toHaveLength(2);
  });

  it('B2: remove button is disabled when only one line item exists', () => {
    render(<InvoiceForm {...DEFAULT_PROPS} />);
    const removeBtn = screen.getByRole('button', { name: '✕' });
    expect(removeBtn).toBeDisabled();
  });

  it('B3: remove button removes a line item when multiple exist', () => {
    render(<InvoiceForm {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByText(/\+ addLine/i));
    expect(screen.getAllByPlaceholderText('description')).toHaveLength(2);
    const removeBtns = screen.getAllByRole('button', { name: '✕' });
    fireEvent.click(removeBtns[0]!);
    expect(screen.getAllByPlaceholderText('description')).toHaveLength(1);
  });
});

// ── C. VAT calculation ────────────────────────────────────────────────────────

describe('C. VAT calculation', () => {
  it('C1: shows VAT line and correct totals when VAT is enabled', () => {
    render(<InvoiceForm {...DEFAULT_PROPS} />);
    const priceInput = screen.getAllByRole('spinbutton')[1]!; // unitPrice
    fireEvent.change(priceInput, { target: { value: '100' } });
    expect(screen.getByText('₪100.00')).toBeInTheDocument(); // subtotal
    expect(screen.getByText('₪18.00')).toBeInTheDocument();  // vat
    expect(screen.getByText('₪118.00')).toBeInTheDocument(); // total
  });

  it('C2: hides VAT line when VAT is disabled', () => {
    render(<InvoiceForm {...DEFAULT_PROPS} />);
    const priceInput = screen.getAllByRole('spinbutton')[1]!;
    fireEvent.change(priceInput, { target: { value: '100' } });
    const checkbox = document.querySelector('input[type="checkbox"]') as HTMLInputElement;
    fireEvent.click(checkbox);
    // VAT amount row should be gone
    expect(screen.queryByText('₪18.00')).not.toBeInTheDocument();
    // vat label (the dt) should be gone too
    expect(screen.queryByText('vat')).not.toBeInTheDocument();
  });
});

// ── D. Validation ─────────────────────────────────────────────────────────────

describe('D. Client-side validation', () => {
  beforeEach(() => mockPush.mockClear());

  it('D1: shows selectPatient error when no patient is selected on submit', async () => {
    render(<InvoiceForm {...DEFAULT_PROPS} />);
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() => {
      // error is rendered in a red div (not the label which has a * suffix)
      const errorDiv = document.querySelector('.text-red-700');
      expect(errorDiv?.textContent).toBe('selectPatient');
    });
  });

  it('D2: shows lineItems error when line items have no description', async () => {
    render(<InvoiceForm {...DEFAULT_PROPS} />);
    fireEvent.change(screen.getByLabelText('selectPatient'), { target: { value: 'p1' } });
    // description is empty by default
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() => {
      const errorDiv = document.querySelector('.text-red-700');
      expect(errorDiv?.textContent).toBe('lineItems');
    });
  });
});

// ── E. Submission ─────────────────────────────────────────────────────────────

describe('E. Submission', () => {
  beforeEach(() => mockPush.mockClear());

  it('E1: calls POST /api/invoices with correct payload on valid submit', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ invoice: { _id: 'inv1' } }),
    });
    global.fetch = mockFetch;

    render(<InvoiceForm {...DEFAULT_PROPS} />);
    fireEvent.change(screen.getByLabelText('selectPatient'), { target: { value: 'p1' } });
    fireEvent.change(screen.getByPlaceholderText('description'), { target: { value: 'Therapy session' } });
    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/invoices',
        expect.objectContaining({ method: 'POST' })
      );
    });
    const body = JSON.parse((mockFetch.mock.calls[0]![1] as { body: string }).body);
    expect(body.patientId).toBe('p1');
    expect(body.lineItems[0].description).toBe('Therapy session');
  });

  it('E2: redirects to /dashboard/billing after successful submission', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ invoice: { _id: 'inv1' } }),
    });

    render(<InvoiceForm {...DEFAULT_PROPS} />);
    fireEvent.change(screen.getByLabelText('selectPatient'), { target: { value: 'p1' } });
    fireEvent.change(screen.getByPlaceholderText('description'), { target: { value: 'Session' } });
    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard/billing');
    });
  });

  it('E3: shows API error message when submission fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Patient not found' }),
    });

    render(<InvoiceForm {...DEFAULT_PROPS} />);
    fireEvent.change(screen.getByLabelText('selectPatient'), { target: { value: 'p1' } });
    fireEvent.change(screen.getByPlaceholderText('description'), { target: { value: 'Session' } });
    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() => {
      expect(screen.getByText('Patient not found')).toBeInTheDocument();
    });
  });
});
