import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/lib/models/User";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        try {
          await connectDB();

          // Find user by email
          const user = await User.findOne({ email: credentials.email }).select("+password");

          if (!user) {
            throw new Error("Invalid email or password");
          }

          // Check if password is set (credentials provider)
          if (!user.password) {
            throw new Error("This account uses a different sign-in method");
          }

          // Compare passwords
          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password as string
          );

          if (!isPasswordValid) {
            throw new Error("Invalid email or password");
          }

          // Return user object for JWT
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
          } as any;
        } catch (error) {
          console.error("Auth error:", error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    /**
     * Sign in callback - auto-create Google users
     */
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && profile && user.email) {
        try {
          await connectDB();

          // Check if user exists
          let existingUser = await User.findOne({ email: user.email });

          if (!existingUser) {
            // Create new user for Google OAuth
            existingUser = await User.create({
              name: user.name || (profile as any).name || "User",
              email: user.email,
              image: user.image || (profile as any).picture,
              role: "employee",
              provider: "google",
              isActive: true,
            });
          }

          // Update user object with MongoDB ID
          user.id = existingUser._id.toString();
        } catch (error) {
          console.error("Error in signIn callback:", error);
          return false;
        }
      }

      return true;
    },

    /**
     * JWT callback - attach user data to token
     */
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;

        // Fetch full user data from database
        try {
          await connectDB();
          const dbUser = await User.findById(user.id);

          if (dbUser) {
            token.role = dbUser.role;
            token.department = dbUser.department;
            token.managerId = dbUser.managerId?.toString();
            token.employeeId = dbUser.employeeId;
            token.provider = dbUser.provider;
          }
        } catch (error) {
          console.error("Error fetching user in JWT callback:", error);
        }
      }

      return token;
    },

    /**
     * Session callback - expose token data to session
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        (session.user as any).department = token.department as string;
        (session.user as any).managerId = token.managerId as string;
        (session.user as any).employeeId = token.employeeId as string;
      }

      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  events: {
    async signIn({ user, account }) {
      console.log(`User ${user.email} signed in via ${account?.provider}`);
    },
    async signOut() {
      console.log("User signed out");
    },
  },
});
