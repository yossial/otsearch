import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

import NotificationBell from '../NotificationBell';

const NOTIFICATIONS = [
  { _id: 'n1', title: 'Invoice paid', body: 'Invoice #001 was paid', status: 'pending' as const, createdAt: new Date().toISOString() },
  { _id: 'n2', title: 'New appointment', body: 'A new appointment was booked', status: 'sent' as const, createdAt: new Date().toISOString() },
  { _id: 'n3', title: 'Old notification', body: 'Already seen', status: 'read' as const, createdAt: new Date().toISOString() },
];

function mockFetchNotifications(notifications = NOTIFICATIONS, unreadCount = 2) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ notifications, unreadCount }),
  });
}

// ── A. Initial state ──────────────────────────────────────────────────────────

describe('A. Initial state', () => {
  it('A1: renders bell button', () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false });
    render(<NotificationBell />);
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
  });

  it('A2: no unread badge when fetch fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false });
    render(<NotificationBell />);
    // let the failed fetch settle, badge should never appear
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByText('2')).not.toBeInTheDocument();
  });

  it('A3: shows unread badge with correct count after fetch', async () => {
    mockFetchNotifications();
    render(<NotificationBell />);
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('A4: shows 9+ when unreadCount exceeds 9', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ notifications: [], unreadCount: 15 }),
    });
    render(<NotificationBell />);
    await waitFor(() => {
      expect(screen.getByText('9+')).toBeInTheDocument();
    });
  });

  it('A5: dropdown is closed by default', () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false });
    render(<NotificationBell />);
    expect(screen.queryByText('title')).not.toBeInTheDocument();
  });
});

// ── B. Open / close dropdown ──────────────────────────────────────────────────

describe('B. Dropdown open/close', () => {
  it('B1: opens dropdown on bell click', async () => {
    mockFetchNotifications();
    render(<NotificationBell />);
    await waitFor(() => screen.getByText('2')); // wait for fetch

    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    expect(screen.getByText('title')).toBeInTheDocument(); // t('title')
  });

  it('B2: renders notification items when open', async () => {
    mockFetchNotifications();
    render(<NotificationBell />);
    await waitFor(() => screen.getByText('2'));

    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    await waitFor(() => {
      expect(screen.getByText('Invoice paid')).toBeInTheDocument();
      expect(screen.getByText('New appointment')).toBeInTheDocument();
    });
  });

  it('B3: shows empty state when no notifications', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ notifications: [], unreadCount: 0 }),
    });
    render(<NotificationBell />);
    await waitFor(() => expect(screen.queryByText('2')).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    expect(screen.getByText('empty')).toBeInTheDocument();
  });

  it('B4: closes on second bell click', async () => {
    mockFetchNotifications();
    render(<NotificationBell />);
    await waitFor(() => screen.getByText('2'));

    const bell = screen.getByRole('button', { name: 'Notifications' });
    fireEvent.click(bell);
    expect(screen.getByText('title')).toBeInTheDocument();
    fireEvent.click(bell);
    expect(screen.queryByText('title')).not.toBeInTheDocument();
  });
});

// ── C. Mark all read ─────────────────────────────────────────────────────────

describe('C. Mark all read', () => {
  it('C1: shows markAllRead button when there are unread notifications', async () => {
    mockFetchNotifications();
    render(<NotificationBell />);
    await waitFor(() => screen.getByText('2'));

    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    await waitFor(() => {
      expect(screen.getByText('markAllRead')).toBeInTheDocument();
    });
  });

  it('C2: calls PUT /api/notifications/read-all and removes badge', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ notifications: NOTIFICATIONS, unreadCount: 2 }) })
      .mockResolvedValueOnce({ ok: true });
    global.fetch = mockFetch;

    render(<NotificationBell />);
    await waitFor(() => screen.getByText('2'));

    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    await waitFor(() => screen.getByText('markAllRead'));
    fireEvent.click(screen.getByText('markAllRead'));

    await waitFor(() => {
      const putCall = mockFetch.mock.calls.find(
        (c: unknown[]) => (c[1] as { method?: string })?.method === 'PUT'
      );
      expect(putCall).toBeTruthy();
      expect(putCall![0]).toContain('/api/notifications/read-all');
    });

    // badge should disappear
    await waitFor(() => {
      expect(screen.queryByText('2')).not.toBeInTheDocument();
    });
  });

  it('C3: does not show markAllRead button when no unread notifications', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ notifications: [NOTIFICATIONS[2]], unreadCount: 0 }),
    });
    render(<NotificationBell />);
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    await waitFor(() => screen.getByText('Old notification'));
    expect(screen.queryByText('markAllRead')).not.toBeInTheDocument();
  });
});
