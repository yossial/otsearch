import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock @/i18n/navigation
vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import SessionNoteForm from '../SessionNoteForm';

describe('SessionNoteForm', () => {
  it('renders in SOAP mode by default', () => {
    render(<SessionNoteForm patientId="p1" locale="he" />);
    // SOAP mode button should be present and active
    expect(screen.getByRole('button', { name: 'soapMode' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'freeTextMode' })).toBeInTheDocument();
  });

  it('shows all 4 SOAP fields in SOAP mode', () => {
    render(<SessionNoteForm patientId="p1" locale="he" />);
    // All 4 SOAP labels
    expect(screen.getByText('subjective')).toBeInTheDocument();
    expect(screen.getByText('objective')).toBeInTheDocument();
    expect(screen.getByText('assessment')).toBeInTheDocument();
    expect(screen.getByText('plan')).toBeInTheDocument();
    // freeText label should NOT be visible in SOAP mode
    expect(screen.queryByText('freeText')).not.toBeInTheDocument();
  });

  it('can toggle to free text mode', () => {
    render(<SessionNoteForm patientId="p1" locale="he" />);
    // Click free text mode
    fireEvent.click(screen.getByRole('button', { name: 'freeTextMode' }));
    // freeText label should now be visible
    expect(screen.getByText('freeText')).toBeInTheDocument();
    // SOAP fields should not be visible
    expect(screen.queryByText('subjective')).not.toBeInTheDocument();
    expect(screen.queryByText('objective')).not.toBeInTheDocument();
    expect(screen.queryByText('assessment')).not.toBeInTheDocument();
    expect(screen.queryByText('plan')).not.toBeInTheDocument();
  });

  it('shows single textarea in free text mode', () => {
    render(<SessionNoteForm patientId="p1" locale="he" />);
    fireEvent.click(screen.getByRole('button', { name: 'freeTextMode' }));
    // In free text mode there is one big textarea
    const textareas = screen.getAllByRole('textbox');
    // Only one textarea (the free text one)
    expect(textareas.length).toBe(1);
  });

  it('save draft button is disabled when date or duration is missing', () => {
    render(<SessionNoteForm patientId="p1" locale="he" />);
    // Clear the date field
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '' } });
    const saveDraftBtn = screen.getByRole('button', { name: 'saveDraft' });
    expect(saveDraftBtn).toBeDisabled();
  });

  it('shows signed badge when session prop has status=signed', () => {
    const signedSession = {
      _id: 'sess1',
      date: new Date().toISOString(),
      duration: 45,
      status: 'signed' as const,
      signedAt: new Date().toISOString(),
      notes: { subjective: 'Test note' },
      goalsAddressed: [],
    };
    render(<SessionNoteForm patientId="p1" locale="he" session={signedSession} />);
    // "signed" translation key should appear as badge text (at least once)
    expect(screen.getAllByText(/signed/i).length).toBeGreaterThan(0);
    // Unsign button should be present
    expect(screen.getByRole('button', { name: 'unsign' })).toBeInTheDocument();
    // Save draft and sign buttons should NOT be in signed view
    expect(screen.queryByRole('button', { name: 'saveDraft' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'signAndLock' })).not.toBeInTheDocument();
  });
});
