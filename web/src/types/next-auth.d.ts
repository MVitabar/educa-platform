import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
    };
    accessToken: string;
    refreshToken: string;
    expires: string;
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
    accessToken: string;
    refreshToken: string;
    token: string; // Required by NextAuth
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role?: string;
    accessToken: string;
    refreshToken: string;
  }
}
