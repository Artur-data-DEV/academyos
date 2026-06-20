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

export const baseAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [],
  callbacks: {
    session({ session, user }: any) {
      if (session.user && user) {
        session.user.id = user.id;
        session.user.role = user.role || 'STUDENT';
        session.user.organizationId = user.organizationId;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(baseAuthConfig);
