'use client';

import React, { useState } from 'react';
import Link from 'next/link';
// CHANGED: Imported getSession so we can check the role after login
import { signIn, getSession } from 'next-auth/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Loader2, AlertCircle } from 'lucide-react';

import loginAnimationData from '@/public/animations/login-animation.json';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      setError(result.error === "CredentialsSignin" 
        ? "メールアドレスまたはパスワードが正しくありません。" 
        : result.error);
      setLoading(false);
    } else {
      // --- NEW: THE TRAFFIC COP LOGIC ---
      // 1. Grab the fresh session data we just created
      const session = await getSession();
      
      // 2. Read their ID badge (role)
      const userRole = (session?.user as any)?.role;

      // 3. Send them to the correct tower
      if (userRole === 'MANAGER') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard'); 
      }
      // Note: We don't set loading to false here because the redirect 
      // is happening, and keeping the spinner going looks smoother!
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] bg-indigo-200/40 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[30vw] h-[30vw] max-w-[500px] max-h-[500px] bg-blue-200/40 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="hidden md:flex flex-col items-center justify-center text-center"
        >
          <div className="w-full max-w-[400px]">
            <Lottie 
              animationData={loginAnimationData} 
              loop={true}
            />
          </div>
          
          <h1 className="text-4xl font-black text-indigo-600 tracking-tighter mt-4">JPM</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">JMC プロジェクト管理システム</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="w-full max-w-md mx-auto bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-slate-200/60 border border-white p-8 lg:p-10"
        >
          <div className="mb-8 text-left">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">おかえりなさい</h2>
            <p className="text-slate-500 font-medium text-sm mt-1">詳細を入力してログインしてください。</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-xl flex items-start gap-3 text-sm font-bold"
              >
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </motion.div>
            )}

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 ml-1 mb-2">
                メールアドレス
              </label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 h-12 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center ml-1 mb-2">
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400">
                  パスワード
                </label>
              </div>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 h-12 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : "ログイン"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-slate-500 font-medium text-sm">
              アカウントをお持ちでないですか？{' '}
              <Link href="/signup" className="text-indigo-600 font-black hover:underline">
                新規登録
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}