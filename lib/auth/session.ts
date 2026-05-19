import { auth } from "@/auth";
import { Session } from "next-auth";

export async function getServerSession(): Promise<Session | null> {
  return await auth();
}

export async function getCurrentUser() {
  const session = await getServerSession();
  return session?.user || null;
}

export async function requireAuth() {
  const session = await getServerSession();
  if (!session?.user) {
    throw new Error("Unauthorized: User not authenticated");
  }
  return session.user;
}

export async function requireRole(requiredRole: string | string[]) {
  const user = await requireAuth();
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

  if (!user.role || !roles.includes(user.role)) {
    throw new Error(`Unauthorized: Required role(s): ${roles.join(", ")}`);
  }

  return user;
}

export async function hasRole(requiredRole: string | string[]): Promise<boolean> {
  const session = await getServerSession();
  if (!session?.user?.role) return false;

  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return roles.includes(session.user.role);
}

export async function getUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id || null;
}
