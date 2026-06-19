import NextAuth, { type DefaultSession } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@academyos/database';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
      organizationId?: string | null;
    } & DefaultSession['user'];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    // Providers devem ser configurados nos apps específicos ou injetados aqui via env vars
  ],
  callbacks: {
    session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
        // Precisamos garantir que role e organizationId venham do banco
        // O PrismaAdapter estende o User com esses campos se estiverem no schema
        session.user.role = (user as any).role || 'STUDENT';
        session.user.organizationId = (user as any).organizationId;
      }
      return session;
    },
  },
});
