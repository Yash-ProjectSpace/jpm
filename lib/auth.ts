import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    // --- 1. Google Provider ---
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    
    // --- 2. Credentials Provider ---
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

        if (user.department !== "DX") {
          throw new Error("Access Denied: Only DX department employees can log in.");
        }

        const isPasswordCorrect = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordCorrect) return null;

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role, 
          department: user.department,
        };
      }
    })
  ],
  pages: { 
    signIn: "/login",
    error: '/login', 
  },
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        if (!profile?.email) return false;

        const existingUser = await prisma.user.findUnique({
          where: { email: profile.email }
        });

        // パターンA: 完全に新規のユーザー
        if (!existingUser) {
          await prisma.user.create({
            data: {
              email: profile.email,
              name: profile.name || "Google User",
              department: "DX", // デフォルト値を設定
            }
          });
          // 修正ポイント: /register ではなく /signup にリダイレクト
          return `/signup/complete-profile?email=${encodeURIComponent(profile.email)}`;
        }

        // パターンB: Google認証済みだがパスワード未設定
        if (!existingUser.password) {
          // 修正ポイント: /register ではなく /signup にリダイレクト
          return `/signup/complete-profile?email=${encodeURIComponent(profile.email)}`;
        }

        // パターンC: 既存ユーザーの部署チェック
        if (existingUser.department !== "DX") {
          return "/login?error=AccessDenied";
        }

        return true;
      }
      return true;
    },

    async jwt({ token }) {
      if (token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email }
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.department = dbUser.department;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).department = token.department as string;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};