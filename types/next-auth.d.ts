import type { DefaultSession, DefaultUser } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'citizen' | 'employee' | 'admin';
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    role: 'citizen' | 'employee' | 'admin';
    id: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'citizen' | 'employee' | 'admin';
  }
}