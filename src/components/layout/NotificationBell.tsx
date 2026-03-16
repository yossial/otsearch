'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';

interface NotificationItem {
  _id: string;
  title: string;
  body: string;
  status: 'pending' | 'sent' | 'read';
  createdAt: string;
}

export default function NotificationBell() {
  const t = useTranslations('dashboard.notifications');
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=10');
      if (!res.ok) return;
      const data = (await res.json()) as { notifications: NotificationItem[]; unreadCount: number };
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
    const interval = setInterval(() => { void fetchNotifications(); }, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  async function markAllRead() {
    setMarkingAll(true);
    try {
      await fetch('/api/notifications/read-all', { method: 'PUT' });
      setNotifications((prev) => prev.map((n) => ({ ...n, status: 'read' as const })));
      setUnreadCount(0);
    } catch {
      // silently ignore
    } finally {
      setMarkingAll(false);
    }
  }

  async function markRead(id: string) {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      setNotifications((prev) =>
        prev.map((n) => n._id === id ? { ...n, status: 'read' as const } : n)
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silently ignore
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg-alt hover:text-primary"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -end-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-2xs font-normal text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute end-0 top-full z-50 mt-2 w-80 rounded-xl border border-border bg-surface shadow-dropdown">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-normal text-text-primary">{t('title')}</p>
            {unreadCount > 0 && (
              <button
                onClick={() => { void markAllRead(); }}
                disabled={markingAll}
                className="text-xs text-primary hover:underline disabled:opacity-50"
              >
                {t('markAllRead')}
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-sm text-text-muted">{t('empty')}</p>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((n) => (
                  <div
                    key={n._id}
                    className={`px-4 py-3 transition-colors ${n.status !== 'read' ? 'bg-primary-light/40' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-normal text-text-primary">{n.title}</p>
                        <p className="mt-0.5 text-xs text-text-muted">{n.body}</p>
                      </div>
                      {n.status !== 'read' && (
                        <button
                          onClick={() => { void markRead(n._id); }}
                          className="shrink-0 rounded-full bg-primary-light p-1 text-primary hover:bg-primary/20"
                          aria-label="Mark as read"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
