/**
 * Auth layout — full-screen overlay that covers the root Navbar/Footer.
 * Auth pages are self-contained: they include their own back button.
 *
 * Desktop: two-column split — brand panel on the end side, form on the start side.
 * Mobile: single column, form only.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] overflow-auto bg-bg">
      <div className="flex min-h-full">

        {/* Form column */}
        <div className="relative flex flex-1 flex-col">
          {children}
        </div>

        {/* Brand panel — desktop only */}
        <div
          aria-hidden="true"
          className="hidden lg:flex lg:w-[42%] lg:flex-col lg:items-center lg:justify-center lg:gap-8 lg:bg-bg-dark lg:px-16"
          style={{
            backgroundImage: 'radial-gradient(circle at 70% 30%, rgba(255,214,10,0.08) 0%, transparent 60%)',
          }}
        >
          {/* Dot texture */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          <div className="relative text-center">
            <p className="mb-3 font-display text-3xl font-normal tracking-tight text-white">
              Therapio
            </p>
            <div className="mx-auto h-0.5 w-10 rounded-full bg-accent" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
              מחברים בין מרפאים בעיסוק לבין מטופלים ברחבי ישראל
            </p>
          </div>

          {/* Decorative accent blobs */}
          <div className="pointer-events-none absolute bottom-16 end-8 h-32 w-32 rounded-full bg-accent/10 blur-[40px]" />
          <div className="pointer-events-none absolute start-8 top-16 h-24 w-24 rounded-full bg-primary/20 blur-[50px]" />
        </div>

      </div>
    </div>
  );
}
