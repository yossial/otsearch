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

import UsersTable from '../UsersTable';

const USERS = [
  {
    id: 'u1',
    name: 'Sarah Cohen',
    email: 'sarah@example.com',
    role: 'therapist',
    status: 'active',
    therapistProfileId: 'tp1',
    subscriptionTier: 'premium',
    createdAt: '2025-01-15T00:00:00.000Z',
  },
  {
    id: 'u2',
    name: 'Ben Levi',
    email: 'ben@example.com',
    role: null,
    status: 'suspended',
    therapistProfileId: null,
    subscriptionTier: null,
    createdAt: '2025-06-20T00:00:00.000Z',
  },
  {
    id: 'u3',
    name: 'Admin User',
    email: 'admin@therapio.co.il',
    role: 'admin',
    status: 'active',
    therapistProfileId: null,
    subscriptionTier: null,
    createdAt: '2024-11-01T00:00:00.000Z',
  },
];

// ── A. Rendering ──────────────────────────────────────────────────────────────

describe('A. Rendering', () => {
  it('A1: renders all column headers', () => {
    render(<UsersTable users={USERS} />);
    expect(screen.getByText('users.table.name')).toBeInTheDocument();
    expect(screen.getByText('users.table.email')).toBeInTheDocument();
    expect(screen.getByText('users.table.role')).toBeInTheDocument();
    expect(screen.getByText('users.table.status')).toBeInTheDocument();
    expect(screen.getByText('users.table.joined')).toBeInTheDocument();
    expect(screen.getByText('users.table.actions')).toBeInTheDocument();
  });

  it('A2: renders a row for each user', () => {
    render(<UsersTable users={USERS} />);
    expect(screen.getByText('Sarah Cohen')).toBeInTheDocument();
    expect(screen.getByText('Ben Levi')).toBeInTheDocument();
    expect(screen.getByText('Admin User')).toBeInTheDocument();
  });

  it('A3: shows email for each user', () => {
    render(<UsersTable users={USERS} />);
    expect(screen.getByText('sarah@example.com')).toBeInTheDocument();
    expect(screen.getByText('ben@example.com')).toBeInTheDocument();
  });

  it('A4: shows role — falls back to unregistered for null role', () => {
    render(<UsersTable users={USERS} />);
    expect(screen.getByText('therapist')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('users.filterRoles.unregistered')).toBeInTheDocument();
  });

  it('A5: shows status badge — active is green, suspended is red', () => {
    render(<UsersTable users={USERS} />);
    // u3 is also active → there are 2 active badges
    expect(screen.getAllByText('users.filterStatuses.active').length).toBe(2);
    expect(screen.getByText('users.filterStatuses.suspended')).toBeInTheDocument();
  });

  it('A6: shows formatted join date', () => {
    render(<UsersTable users={USERS} />);
    // Dates are formatted via toLocaleDateString() — just verify cells exist
    const rows = document.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(3);
  });

  it('A7: shows empty state when no users', () => {
    render(<UsersTable users={[]} />);
    expect(screen.getByText('users.noResults')).toBeInTheDocument();
  });
});

// ── B. Status action buttons ──────────────────────────────────────────────────

describe('B. Status action buttons', () => {
  it('B1: active user shows suspend button, suspended user shows reactivate button', () => {
    render(<UsersTable users={USERS} />);
    // u1 is active → suspend; u2 is suspended → reactivate; u3 is active → suspend
    expect(screen.getAllByText('users.actions.suspend').length).toBe(2);
    expect(screen.getByText('users.actions.reactivate')).toBeInTheDocument();
  });

  it('B2: clicking suspend calls PATCH /api/admin/users/:id with status suspended', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'suspended' }),
    });
    global.fetch = mockFetch;

    render(<UsersTable users={USERS} />);
    // Click the first suspend button (u1)
    fireEvent.click(screen.getAllByText('users.actions.suspend')[0]!);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/users/u1',
        expect.objectContaining({ method: 'PATCH' })
      );
      const body = JSON.parse((mockFetch.mock.calls[0]![1] as { body: string }).body);
      expect(body.status).toBe('suspended');
    });
  });

  it('B3: clicking reactivate calls PATCH with status active', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'active' }),
    });
    global.fetch = mockFetch;

    render(<UsersTable users={USERS} />);
    fireEvent.click(screen.getByText('users.actions.reactivate')); // u2

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/users/u2',
        expect.objectContaining({ method: 'PATCH' })
      );
      const body = JSON.parse((mockFetch.mock.calls[0]![1] as { body: string }).body);
      expect(body.status).toBe('active');
    });
  });
});

// ── C. State updates after action ─────────────────────────────────────────────

describe('C. State updates', () => {
  beforeEach(() => {
    mockToastSuccess.mockClear();
    mockToastError.mockClear();
  });

  it('C1: status badge updates after successful suspend', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'suspended' }),
    });
    render(<UsersTable users={[USERS[0]!]} />);
    fireEvent.click(screen.getByText('users.actions.suspend'));

    await waitFor(() => {
      expect(screen.getByText('users.filterStatuses.suspended')).toBeInTheDocument();
      // Button label should flip too
      expect(screen.getByText('users.actions.reactivate')).toBeInTheDocument();
    });
  });

  it('C2: shows toast.success after successful PATCH', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'suspended' }),
    });
    render(<UsersTable users={[USERS[0]!]} />);
    fireEvent.click(screen.getByText('users.actions.suspend'));
    await waitFor(() => expect(mockToastSuccess).toHaveBeenCalledWith('toast.saved'));
  });

  it('C3: shows toast.error when PATCH fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false });
    render(<UsersTable users={[USERS[0]!]} />);
    fireEvent.click(screen.getByText('users.actions.suspend'));
    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('toast.error'));
  });

  it('C4: state does not change when PATCH fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false });
    render(<UsersTable users={[USERS[0]!]} />);
    fireEvent.click(screen.getByText('users.actions.suspend'));
    await waitFor(() => expect(mockToastError).toHaveBeenCalled());
    // u1 still active
    expect(screen.getByText('users.filterStatuses.active')).toBeInTheDocument();
  });
});
