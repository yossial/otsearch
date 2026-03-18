import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockSignIn = vi.fn();

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// RegisterForm uses useRouter from next/navigation (not @/i18n/navigation)
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('next-auth/react', () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
}));

vi.mock('../SocialAuthButtons', () => ({
  default: () => <div data-testid="social-auth" />,
}));

vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <button {...props}>{children}</button>
  ),
}));

import RegisterForm from '../RegisterForm';

// ── helpers ──────────────────────────────────────────────────────────────────

function fillForm(email = 'test@example.com', password = 'Password1', confirm = 'Password1') {
  fireEvent.change(screen.getByLabelText('register.email'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('register.password'), { target: { value: password } });
  fireEvent.change(screen.getByLabelText('register.confirmPassword'), { target: { value: confirm } });
}

// ── A. Rendering ──────────────────────────────────────────────────────────────

describe('A. Rendering', () => {
  it('A1: renders email, password, confirm password inputs and submit button', () => {
    render(<RegisterForm />);
    expect(screen.getByLabelText('register.email')).toBeInTheDocument();
    expect(screen.getByLabelText('register.password')).toBeInTheDocument();
    expect(screen.getByLabelText('register.confirmPassword')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register\.submit/i })).toBeInTheDocument();
  });

  it('A2: renders social auth buttons', () => {
    render(<RegisterForm />);
    expect(screen.getByTestId('social-auth')).toBeInTheDocument();
  });

  it('A3: shows login link', () => {
    render(<RegisterForm />);
    expect(screen.getByText('register.login')).toBeInTheDocument();
  });
});

// ── B. Password strength indicators ──────────────────────────────────────────

describe('B. Password strength rules', () => {
  it('B1: no rules shown when password is empty', () => {
    render(<RegisterForm />);
    expect(screen.queryByText('errors.passwordRule_min8')).not.toBeInTheDocument();
  });

  it('B2: shows all three rules when password is typed', () => {
    render(<RegisterForm />);
    fireEvent.change(screen.getByLabelText('register.password'), { target: { value: 'a' } });
    expect(screen.getByText('errors.passwordRule_min8')).toBeInTheDocument();
    expect(screen.getByText('errors.passwordRule_letter')).toBeInTheDocument();
    expect(screen.getByText('errors.passwordRule_number')).toBeInTheDocument();
  });

  it('B3: confirm checkmark appears when passwords match', () => {
    render(<RegisterForm />);
    fireEvent.change(screen.getByLabelText('register.password'), { target: { value: 'Password1' } });
    fireEvent.change(screen.getByLabelText('register.confirmPassword'), { target: { value: 'Password1' } });
    // checkmark character visible
    expect(screen.getAllByText('✓').length).toBeGreaterThan(0);
  });

  it('B4: mismatch indicator when passwords differ', () => {
    render(<RegisterForm />);
    fireEvent.change(screen.getByLabelText('register.password'), { target: { value: 'Password1' } });
    fireEvent.change(screen.getByLabelText('register.confirmPassword'), { target: { value: 'Password2' } });
    expect(screen.getByText('✗')).toBeInTheDocument();
  });
});

// ── C. Client-side validation ─────────────────────────────────────────────────

describe('C. Client-side validation', () => {
  it('C1: shows required error when fields empty on submit', async () => {
    render(<RegisterForm />);
    fireEvent.submit(screen.getByRole('button', { name: /register\.submit/i }).closest('form')!);
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('errors.required');
    });
  });

  it('C2: shows invalidEmail error for malformed email', async () => {
    render(<RegisterForm />);
    fillForm('notanemail', 'Password1', 'Password1');
    fireEvent.submit(screen.getByRole('button').closest('form')!);
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('errors.invalidEmail');
    });
  });

  it('C3: shows passwordWeak error for short/simple password', async () => {
    render(<RegisterForm />);
    fillForm('test@example.com', 'short', 'short');
    fireEvent.submit(screen.getByRole('button').closest('form')!);
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('errors.passwordWeak');
    });
  });

  it('C4: shows passwordMismatch error when passwords differ', async () => {
    render(<RegisterForm />);
    fillForm('test@example.com', 'Password1', 'Password2');
    fireEvent.submit(screen.getByRole('button').closest('form')!);
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('errors.passwordMismatch');
    });
  });

  it('C5: does not call fetch when validation fails', async () => {
    const mockFetch = vi.fn();
    global.fetch = mockFetch;
    render(<RegisterForm />);
    fireEvent.submit(screen.getByRole('button').closest('form')!);
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

// ── D. Submission ─────────────────────────────────────────────────────────────

describe('D. Submission', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockSignIn.mockClear();
  });

  it('D1: calls POST /api/auth/register with correct payload on valid submit', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    global.fetch = mockFetch;
    mockSignIn.mockResolvedValue({ error: null });

    render(<RegisterForm />);
    fillForm('Test@Example.com', 'Password1', 'Password1');
    fireEvent.submit(screen.getByRole('button').closest('form')!);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/auth/register',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com', password: 'Password1' }),
        })
      );
    });
  });

  it('D2: redirects to /onboarding/therapist after successful registration', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    mockSignIn.mockResolvedValue({ error: null });

    render(<RegisterForm />);
    fillForm();
    fireEvent.submit(screen.getByRole('button').closest('form')!);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/onboarding/therapist');
    });
  });

  it('D3: shows emailExists error when server returns emailExists', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'emailExists' }),
    });

    render(<RegisterForm />);
    fillForm();
    fireEvent.submit(screen.getByRole('button').closest('form')!);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('errors.emailExists');
    });
  });

  it('D4: shows serverError for unknown server error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'unknownError' }),
    });

    render(<RegisterForm />);
    fillForm();
    fireEvent.submit(screen.getByRole('button').closest('form')!);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('errors.serverError');
    });
  });

  it('D5: redirects to /auth/login if signIn returns an error', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    mockSignIn.mockResolvedValue({ error: 'CredentialsSignin' });

    render(<RegisterForm />);
    fillForm();
    fireEvent.submit(screen.getByRole('button').closest('form')!);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });
  });
});
