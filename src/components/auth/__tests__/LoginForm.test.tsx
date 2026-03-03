import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

// Mock next-auth/react signIn
vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => ({ get: () => null }),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => (key: string) => `${ns}.${key}`,
}));

// Mock @/i18n/navigation
vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import LoginForm from '../LoginForm';

describe('LoginForm', () => {
  it('renders email, password inputs and submit button', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/auth\.login\.email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/auth\.login\.password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /auth\.login\.submit/i })).toBeInTheDocument();
  });

  it('shows required error when submitting empty form', async () => {
    render(<LoginForm />);
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('calls signIn with credentials on valid submit', async () => {
    const { signIn } = await import('next-auth/react');
    (signIn as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ error: null });

    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('credentials', expect.objectContaining({
        email: 'test@example.com',
        password: 'password123',
        redirect: false,
      }));
    });
  });

  it('shows invalid credentials error on failed signIn', async () => {
    const { signIn } = await import('next-auth/react');
    (signIn as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ error: 'CredentialsSignin' });

    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
