import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      otProfileId: string | null;
    } & DefaultSession['user'];
  }

  interface User {
    role: string;
    otProfileId: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    otProfileId?: string | null;
  }
}
