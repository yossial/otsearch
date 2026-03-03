import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string | null; // null until onboarding is completed
      therapistProfileId: string | null;
    } & DefaultSession['user'];
  }

  interface User {
    role: string | null;
    therapistProfileId: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string | null;
    therapistProfileId?: string | null;
  }
}
