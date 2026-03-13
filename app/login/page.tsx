'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  // 1. Logic: State to remember what the user types
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 2. Logic: The function that talks to NextAuth
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      // Translated error message
      alert("メールアドレスまたはパスワードが正しくありません。");
    } else {
      // If login is successful, go to the dashboard
      router.push('/dashboard'); 
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      {/* Logo Section */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-black text-indigo-600 tracking-tighter">JPM</h1>
        <p className="text-slate-500 font-medium text-sm">JMC プロジェクト管理システム</p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8 lg:p-10">
        <div className="mb-8 text-left">
          <h2 className="text-2xl font-bold text-slate-900">おかえりなさい</h2>
          <p className="text-slate-500 text-sm mt-1">詳細を入力してサインインしてください。</p>
        </div>

        {/* 3. Logic: Added onSubmit={handleSubmit} */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-semibold text-slate-700 ml-1 text-left">
              メールアドレス
            </label>
            <input 
              type="email" 
              required
              placeholder="example@jmc.com"
              // 4. Logic: value and onChange
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all mt-1"
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center ml-1">
              <label className="block text-sm font-semibold text-slate-700">
                パスワード
              </label>
              <a href="#" className="text-xs font-bold text-indigo-600 hover:text-indigo-500">
                パスワードをお忘れですか？
              </a>
            </div>
            <input 
              type="password" 
              required
              placeholder="••••••••"
              // 4. Logic: value and onChange
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all mt-1 text-slate-900 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 ml-1">
            <input type="checkbox" id="remember" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
            <label htmlFor="remember" className="text-sm text-slate-600 font-medium cursor-pointer">
              ログイン状態を保持する
            </label>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-[0.98] mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "サインイン中..." : "サインイン"}
          </button>
        </form>

        <div className="mt-10 pt-6 border-t border-slate-100 text-center">
          <p className="text-slate-600 text-sm">
            アカウントをお持ちでないですか？{' '}
            <Link href="/signup" className="text-indigo-600 font-bold hover:underline">
              新規登録
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}