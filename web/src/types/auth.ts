import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      token: string; // Añadir el token a la sesión
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
    token: string; // Añadir el token al usuario
  }
}

// La declaración del módulo JWT se manejará en next-auth.d.ts
