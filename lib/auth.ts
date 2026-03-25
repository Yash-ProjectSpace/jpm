import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google"; // ★追加
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    // --- 1. Google Provider ---
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    
    // --- 2. Credentials Provider (既存のメール/パスワード) ---
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
    // エラー時のリダイレクト先も設定しておくと安心です
    error: '/login', 
  },
  session: { strategy: "jwt" },
  callbacks: {
    // ★ ここが超重要！Googleログイン時のフローを制御します
    async signIn({ user, account, profile }) {
      // Googleログインの場合
      if (account?.provider === "google") {
        if (!profile?.email) return false;

        // DBにユーザーが存在するかチェック
        const existingUser = await prisma.user.findUnique({
          where: { email: profile.email }
        });

        // パターンA: 完全に新規のユーザー
        if (!existingUser) {
          // とりあえずDBに名前とメールだけでユーザーを作成
          await prisma.user.create({
            data: {
              email: profile.email,
              name: profile.name || "Google User",
              // passwordはまだnull
              // departmentはPrismaのデフォルトで"DX"になりますが、後で確認させます
            }
          });
          // サインアップ直後にプロフィール補完ページへ強制リダイレクト（URLにメールアドレスを付与）
          return `/register/complete-profile?email=${encodeURIComponent(profile.email)}`;
        }

        // パターンB: 過去にGoogleでサインインしたが、パスワード設定を終わらせていないユーザー
        if (!existingUser.password) {
          return `/register/complete-profile?email=${encodeURIComponent(profile.email)}`;
        }

        // パターンC: 既存のユーザー（DX部署のみ許可のルールを適用）
        if (existingUser.department !== "DX") {
          return "/login?error=AccessDenied"; // DX部以外は弾く
        }

        return true; // 全てのチェックを通過したらログイン許可
      }

      // 既存のCredentialsログインの場合はそのまま許可
      return true;
    },

    // Tokenに最新のDB情報を含める（Googleログイン時、デフォルトだとroleやidが欠けるため）
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

    // SessionにTokenの情報を渡す
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