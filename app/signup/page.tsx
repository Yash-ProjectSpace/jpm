'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  
  // 1. State for form data
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  // 2. Form submission logic
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        body: JSON.stringify(formData),
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        alert("アカウントが正常に作成されました。");
        router.push('/login'); 
      } else {
        const data = await res.json();
        alert(data.error || "登録に失敗しました。");
      }
    } catch (error) {
      alert("エラーが発生しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Branding Side (Left) */}
      <div className="hidden lg:flex w-1/2 bg-indigo-700 p-12 flex-col justify-between text-white">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter">JPM</h1>
          <p className="text-indigo-200 text-sm">JMC プロジェクト管理システム</p>
        </div>
        <div>
          <h2 className="text-5xl font-light leading-tight">
            JMCのプロジェクトを <br /> 
            <span className="font-semibold text-white">より精密に管理。</span>
          </h2>
          <p className="mt-6 text-indigo-100 max-w-md">
            タスクの追跡、レポートの生成、リアルタイムでのコラボレーションを実現する、JMCチームのためのオールインワン・ワークスペース。
          </p>
        </div>
        <div className="text-sm text-indigo-300">
          © 2026 JMC Project Management System
        </div>
      </div>

      {/* Form Side (Right) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <div className="max-w-md w-full">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-900">新規アカウント作成</h2>
            <p className="text-slate-500 mt-2">JPMワークスペースを始めましょう。</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-slate-700 ml-1">氏名</label>
              <input 
                type="text" 
                required
                placeholder="お名前を入力してください"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 ml-1">メールアドレス</label>
              <input 
                type="email" 
                required
                placeholder="name@jmc.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 ml-1">パスワード</label>
              <input 
                type="password" 
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all mt-1"
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "アカウント作成中..." : "アカウントを作成する"}
            </button>
          </form>

          <p className="text-center mt-8 text-slate-600">
            すでにアカウントをお持ちですか？{' '}
            <Link href="/login" className="text-indigo-600 font-bold hover:underline">
              サインイン
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}