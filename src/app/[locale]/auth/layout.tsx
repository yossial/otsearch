/**
 * Auth layout — full-screen overlay that covers the root Navbar/Footer.
 * Auth pages are self-contained: they include their own back button.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] overflow-auto bg-bg">
      {children}
    </div>
  );
}
