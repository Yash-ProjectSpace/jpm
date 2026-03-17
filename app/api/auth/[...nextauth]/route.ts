import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) return null;

        // --- NEW: Block anyone who is NOT in the DX Department ---
        if (user.department !== "DX") {
          throw new Error("Access Denied: Only DX department employees can log in.");
        }
        // ---------------------------------------------------------

        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordCorrect) return null;

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role, 
          department: user.department, // <-- NEW: Pass department to the session token
        };
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  // --- NEW: The Callbacks to pass the role to the frontend ---
  callbacks: {
    async jwt({ token, user }) {
      // The 'user' object is only passed in the very first time the user logs in.
      // We take the role and id and save it inside the encrypted token.
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Every time the frontend calls useSession(), this runs.
      // We take the role from the token and put it in the session object.
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };