'use client'; // This is essential for the animation logic!

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  // --- Animation State Logic ---
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 1. We simulate loading by incrementing the progress bar
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          // 2. Short delay once 100% is reached to show the full bar
          setTimeout(() => setIsLoading(false), 200); 
          return 100;
        }
        return prev + 10; // Progress increment (adjust speed here)
      });
    }, 100); // Speed of the progress bar (adjust time here)

    return () => clearInterval(interval);
  }, []);

  // --- 1. The Animated Loading Screen (visible while isLoading is true) ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center animate-fadeOut">
        <div className="w-full max-w-sm flex flex-col items-center gap-12">
          {/* Animated Logo (simple fade-in) */}
          <h1 className="text-6xl font-black text-indigo-600 tracking-tighter animate-fadeInSlow">
            JPM
          </h1>

          {/* Loading Bar Container (the track) */}
          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden border border-slate-200">
            {/* The Animated Line (the moving part) */}
            <div 
              className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-slate-400 font-medium">JMC Project Management System</p>
        </div>

        {/* Custom CSS for Animations */}
        <style jsx global>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
          }
          .animate-fadeInSlow {
            animation: fadeIn 1s ease-out forwards;
          }
          .animate-fadeOut {
            animation: fadeOut 0.5s ease-in-out forwards;
            animation-delay: 1.2s; /* Adjust based on your loading speed */
          }
          .animate-landingFadeIn {
            animation: fadeIn 0.8s ease-out forwards;
          }
        `}</style>
      </div>
    );
  }

  // --- 2. The Final Landing Page Content (visible after loading ends) ---
  // (All text has been translated into professional Japanese for JMC)
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center animate-landingFadeIn">
      <h1 className="text-6xl font-black text-indigo-600 tracking-tighter mb-4">
        JPM
      </h1>
      <p className="text-xl text-slate-600 max-w-2xl mb-10 font-medium">
        JMC プロジェクト管理システム: タスク追跡、チーム管理、成果報告を一本化する高精度ワークスペース。
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link 
          href="/login" 
          className="px-10 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg hover:bg-indigo-700 transition-all active:scale-95"
        >
          ワークスペースにサインイン
        </Link>
        <Link 
          href="/signup" 
          className="px-10 py-4 bg-white text-slate-900 font-bold rounded-2xl shadow-md border border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
        >
          新規アカウント作成
        </Link>
      </div>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-5xl">
        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 text-lg">タスク管理</h3>
          <p className="text-slate-500 mt-2 text-sm">詳細なタスク管理システムにより、あらゆる進捗を確実に把握します。</p>
        </div>
        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 text-lg">チームレポート</h3>
          <p className="text-slate-500 mt-2 text-sm">JMCの取り組みに関する視覚的なデータレポートを即座に生成します。</p>
        </div>
        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 text-lg">社内掲示板</h3>
          <p className="text-slate-500 mt-2 text-sm">全社的なお知らせやアップデートを共有し、チームの連携を強化します。</p>
        </div>
      </div>
    </div>
  );
}