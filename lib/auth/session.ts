import { auth } from "@/auth";
import { Session } from "next-auth";

/**
 * Get the current server session
 * Use this in Server Components and API routes
 */
export async function getServerSession(): Promise<Session | null> {
  return await auth();
}

/**
 * Get the current user from session
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const session = await getServerSession();
  return session?.user || null;
}

/**
 * Require authentication - throws if user is not authenticated
 */
export async function requireAuth() {
  const session = await getServerSession();
  if (!session?.user) {
    throw new Error("Unauthorized: User not authenticated");
  }
  return session.user;
}

/**
 * Require specific role - throws if user doesn't have the required role
 */
export async function requireRole(requiredRole: string | string[]) {
  const user = await requireAuth();
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

  if (!user.role || !roles.includes(user.role)) {
    throw new Error(`Unauthorized: Required role(s): ${roles.join(", ")}`);
  }

  return user;
}

/**
 * Check if user has a specific role
 */
export async function hasRole(requiredRole: string | string[]): Promise<boolean> {
  const session = await getServerSession();
  if (!session?.user?.role) return false;

  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return roles.includes(session.user.role);
}

/**
 * Get user ID from session
 */
export async function getUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id || null;
}
