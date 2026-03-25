'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

function CompleteProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  const [department, setDepartment] = useState('dx'); 
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); 
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // メールアドレスがない場合はログイン画面に追い出す（不正アクセス防止）
  useEffect(() => {
    if (!email) {
      router.push('/login');
    }
  }, [email, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!password || password !== confirmPassword) {
      setError("パスワードが一致しないか、入力されていません。");
      setLoading(false);
      return;
    }

    try {
      // APIパスを /api/signup/complete-profile に修正済み
      const response = await fetch('/api/signup/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          department: department.toUpperCase() 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "設定中にエラーが発生しました。");
      }

      setSuccess(true);
      // 成功したら2秒後にログイン画面へ
      setTimeout(() => {
        router.push('/login');
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || "エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 border border-white p-8 lg:p-10 relative z-10"
    >
      <div className="mb-6 text-center">
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm shadow-indigo-200/50">
          <CheckCircle2 size={32} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">あと少しで完了です！</h2>
        <p className="text-slate-500 font-medium text-sm mt-2">
          Googleアカウントの連携が成功しました。<br/>
          ログイン用のパスワードと部署を設定してください。
        </p>
        <div className="mt-4 py-2 px-4 bg-slate-100 rounded-xl text-sm font-bold text-slate-600 inline-block border border-slate-200">
          {email}
        </div>
      </div>

      {success ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-emerald-50 text-emerald-600 p-4 rounded-xl text-center font-bold border border-emerald-100 shadow-sm"
        >
          設定が完了しました！<br/>ログイン画面へ移動します...
        </motion.div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-xl flex items-start gap-3 text-sm font-bold shadow-sm"
            >
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p>{error}</p>
            </motion.div>
          )}

          <div>
            <label className="block text-xs font-black uppercase tracking-widest ml-1 mb-1.5 text-slate-400">
              部署
            </label>
            <select 
              value={department} 
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-4 py-3 h-12 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-900 shadow-sm"
            >
              {/* lib/auth.ts の設定上、DX部でないとログインできないため dx をデフォルトにしています */}
              <option value="dx">DX推進部</option>
              <option value="engineering">開発部</option>
              <option value="sales">営業部</option>
              <option value="hr">人事・総務部</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-black uppercase tracking-widest ml-1 mb-1.5 text-slate-400">
              パスワード
            </label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 h-12 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-900 pr-10 shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest ml-1 mb-1.5 text-slate-400">
              確認用パスワード
            </label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 h-12 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-900 pr-10 shadow-sm"
              />
            </div>
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-full shadow-xl shadow-indigo-200 transition-all active:scale-[0.98] mt-6 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : "設定を完了してログイン"}
          </button>
        </form>
      )}
    </motion.div>
  );
}

// Next.js の useSearchParams を安全に使うための Suspense ラッパー
export default function CompleteProfilePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* 背景の装飾 */}
      <div className="absolute top-[-10%] right-[-10%] w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] bg-indigo-200/40 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[30vw] h-[30vw] max-w-[500px] max-h-[500px] bg-emerald-200/40 rounded-full blur-[100px] pointer-events-none" />

      <Suspense fallback={<Loader2 className="animate-spin text-indigo-600" size={40} />}>
        <CompleteProfileForm />
      </Suspense>
    </div>
  );
}