import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

// Mock @/i18n/navigation
vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import PatientForm from '../PatientForm';

describe('PatientForm', () => {
  it('renders all main form sections', () => {
    render(<PatientForm />);
    // Type selection section
    expect(screen.getByText('patientType')).toBeInTheDocument();
    // Date of birth input
    const dateInput = document.querySelector('input[type="date"]');
    expect(dateInput).toBeInTheDocument();
    // Submit button
    expect(screen.getByRole('button', { name: 'savePatient' })).toBeInTheDocument();
    // Gender select
    const genderSelect = screen.getAllByRole('combobox');
    expect(genderSelect.length).toBeGreaterThan(0);
  });

  it('shows consent section', () => {
    render(<PatientForm />);
    expect(screen.getByText('consentSection')).toBeInTheDocument();
    // consentRequired appears as a paragraph in the consent section
    expect(screen.getAllByText('consentRequired').length).toBeGreaterThan(0);
    expect(screen.getByTestId('consent-checkbox')).toBeInTheDocument();
  });

  it('shows contact info fields by default (direct type)', () => {
    render(<PatientForm />);
    // contactInfo heading
    expect(screen.getByText('contactInfo')).toBeInTheDocument();
    // parentInfo should NOT be visible
    expect(screen.queryByText('parentInfo')).not.toBeInTheDocument();
  });

  it('shows parent info fields when child type is selected', () => {
    render(<PatientForm />);
    // Select child type
    const childRadio = screen.getByRole('radio', { name: 'typeChild' });
    fireEvent.click(childRadio);
    expect(screen.getByText('parentInfo')).toBeInTheDocument();
    expect(screen.queryByText('contactInfo')).not.toBeInTheDocument();
  });

  it('shows consent validation error when submitting without consent', async () => {
    render(<PatientForm />);

    // Fill required textbox fields (firstName, lastName at minimum)
    const textboxes = screen.getAllByRole('textbox');
    fireEvent.change(textboxes[0]!, { target: { value: 'Test' } });
    fireEvent.change(textboxes[1]!, { target: { value: 'Patient' } });

    // Fill date of birth
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    if (dateInput) fireEvent.change(dateInput, { target: { value: '2000-01-01' } });

    // Do NOT check the consent checkbox
    fireEvent.click(screen.getByRole('button', { name: 'savePatient' }));

    // Validation error for consent — it renders in an error <p> with text-red-600
    await waitFor(() => {
      const errorEl = document.querySelector('p.text-xs.text-red-600');
      expect(errorEl).toBeTruthy();
    });
  });

  it('calls fetch with POST on valid submit with consent', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ patient: { _id: '123' } }),
    });
    global.fetch = mockFetch;

    render(<PatientForm />);

    // Fill required fields
    const textboxes = screen.getAllByRole('textbox');
    // firstName
    fireEvent.change(textboxes[0]!, { target: { value: 'John' } });
    // lastName
    fireEvent.change(textboxes[1]!, { target: { value: 'Doe' } });

    // Date of birth
    const dateInputs = document.querySelectorAll('input[type="date"]');
    if (dateInputs[0]) fireEvent.change(dateInputs[0], { target: { value: '1990-05-15' } });

    // Check consent checkbox
    const consentCheckbox = screen.getByTestId('consent-checkbox');
    fireEvent.click(consentCheckbox);

    // Fill consentSignedBy — it's a textbox later in the form (after consent section)
    const updatedTextboxes = screen.getAllByRole('textbox');
    const lastTextbox = updatedTextboxes[updatedTextboxes.length - 1];
    if (lastTextbox) fireEvent.change(lastTextbox, { target: { value: 'John Doe' } });

    fireEvent.click(screen.getByRole('button', { name: 'savePatient' }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/patients',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });
});
