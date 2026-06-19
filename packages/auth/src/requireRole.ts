import { auth } from './index';
import { redirect } from 'next/navigation';

export async function requireRole(allowedRoles: Array<'ADMIN' | 'INSTRUCTOR' | 'STUDENT'>) {
  const session = await auth();

  if (!session?.user) {
    redirect('/api/auth/signin');
  }

  if (!allowedRoles.includes(session.user.role)) {
    // Pode redirecionar para um "not-authorized" ou "forbidden"
    redirect('/forbidden');
  }

  return session.user;
}
