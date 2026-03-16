import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

import InvoiceList from '../InvoiceList';

const INVOICES = [
  {
    _id: 'inv1',
    invoiceNumber: '2026-001',
    patientId: 'p1',
    patientName: 'John Doe',
    issueDate: '2026-03-01T00:00:00.000Z',
    total: 350,
    status: 'paid' as const,
    type: 'invoice_receipt' as const,
  },
  {
    _id: 'inv2',
    invoiceNumber: '2026-002',
    patientId: 'p2',
    patientName: 'Jane Smith',
    issueDate: '2026-03-10T00:00:00.000Z',
    total: 420,
    status: 'sent' as const,
    type: 'invoice' as const,
  },
  {
    _id: 'inv3',
    invoiceNumber: '2026-003',
    patientId: 'p3',
    patientName: 'Bob Levi',
    issueDate: '2026-02-15T00:00:00.000Z',
    total: 200,
    status: 'overdue' as const,
    type: 'invoice' as const,
  },
];

function mockFetchWith(invoices = INVOICES) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ invoices }),
  });
}

// ── A. Rendering ──────────────────────────────────────────────────────────────

describe('A. Rendering', () => {
  it('A1: shows loading skeleton initially', () => {
    global.fetch = vi.fn().mockReturnValue(new Promise(() => {})); // never resolves
    render(<InvoiceList locale="en" />);
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('A2: renders invoice rows after loading', async () => {
    mockFetchWith();
    render(<InvoiceList locale="en" />);
    await waitFor(() => {
      expect(screen.getByText('2026-001')).toBeInTheDocument();
      expect(screen.getByText('2026-002')).toBeInTheDocument();
    });
  });

  it('A3: shows empty state when no invoices', async () => {
    mockFetchWith([]);
    render(<InvoiceList locale="en" />);
    await waitFor(() => {
      expect(screen.getByText('noInvoices')).toBeInTheDocument();
    });
  });

  it('A4: shows patient name for each invoice', async () => {
    mockFetchWith();
    render(<InvoiceList locale="en" />);
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('A5: shows formatted total for each invoice', async () => {
    mockFetchWith();
    render(<InvoiceList locale="en" />);
    await waitFor(() => {
      // ₪420 is unique — inv2 is sent (not paid) so not in revenueThisMonth stats bar
      expect(screen.getByText('₪420')).toBeInTheDocument();
      expect(screen.getByText('₪200')).toBeInTheDocument();
    });
  });

  it('A6: shows stats bar with revenue and unpaid count', async () => {
    mockFetchWith();
    render(<InvoiceList locale="en" />);
    await waitFor(() => {
      expect(screen.getByText('revenueThisMonth:')).toBeInTheDocument();
      expect(screen.getByText('unpaidCount:')).toBeInTheDocument();
    });
  });
});

// ── B. View link ──────────────────────────────────────────────────────────────

describe('B. View links', () => {
  it('B1: renders a view link for each invoice pointing to /dashboard/billing/[id]', async () => {
    mockFetchWith();
    render(<InvoiceList locale="en" />);
    await waitFor(() => {
      const viewLinks = screen.getAllByText('view');
      expect(viewLinks).toHaveLength(3);
      expect(viewLinks[0]!.closest('a')).toHaveAttribute('href', '/dashboard/billing/inv1');
      expect(viewLinks[1]!.closest('a')).toHaveAttribute('href', '/dashboard/billing/inv2');
    });
  });
});

// ── C. Mark as paid ──────────────────────────────────────────────────────────

describe('C. Mark as paid', () => {
  beforeEach(() => { mockFetchWith(); });

  it('C1: shows markPaid button only for sent/draft invoices (not overdue)', async () => {
    render(<InvoiceList locale="en" />);
    await waitFor(() => {
      // inv2 is sent → has markPaid; inv1 is paid, inv3 is overdue → neither has markPaid
      const markPaidBtns = screen.getAllByText('markPaid');
      expect(markPaidBtns).toHaveLength(1);
    });
  });

  it('C2: calls PUT /api/invoices/[id] and updates status when markPaid clicked', async () => {
    const updatedInvoice = { ...INVOICES[1], status: 'paid' };
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ invoices: INVOICES }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ invoice: updatedInvoice }) });

    render(<InvoiceList locale="en" />);
    await waitFor(() => screen.getAllByText('markPaid'));

    const markPaidBtns = screen.getAllByText('markPaid');
    fireEvent.click(markPaidBtns[0]!);

    await waitFor(() => {
      const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
      const putCall = calls.find((c: unknown[]) => (c[1] as { method?: string })?.method === 'PUT');
      expect(putCall).toBeTruthy();
      expect(putCall![0]).toContain('/api/invoices/');
    });
  });
});

// ── D. patientId filter ───────────────────────────────────────────────────────

describe('D. Patient-scoped view', () => {
  it('D1: does not show patient name column when patientId is provided', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ invoices: [INVOICES[0]] }),
    });
    render(<InvoiceList locale="en" patientId="p1" />);
    await waitFor(() => {
      expect(screen.queryByText('patientDetails')).not.toBeInTheDocument();
    });
  });

  it('D2: appends patientId to fetch URL when provided', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ invoices: [] }),
    });
    global.fetch = mockFetch;
    render(<InvoiceList locale="en" patientId="p1" />);
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('patientId=p1')
      );
    });
  });
});
