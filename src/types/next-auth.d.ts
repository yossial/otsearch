import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string | null; // null until role-select step is completed
      otProfileId: string | null;
    } & DefaultSession['user'];
  }

  interface User {
    role: string | null; // null for new users before role selection
    otProfileId: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string | null;
    otProfileId?: string | null;
  }
}
