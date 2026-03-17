'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic'; // <-- NEW: Imported dynamic
import { 
  Zap, LayoutDashboard, Database, BarChart3, 
  FolderKanban, Users, Search, Target, Laptop, 
  Monitor, ClipboardCheck, User
} from 'lucide-react';

// --- NEW: Import your landing page animation ---
import landingAnimationData from '@/public/animations/landing-animation.json';

// --- NEW: Dynamically load Lottie ---
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 5;
      });
    }, 75);

    const screenTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 3000); 

    return () => {
      clearInterval(progressInterval);
      clearTimeout(screenTimeout);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-6 transition-opacity duration-500">
        <div className="w-full max-w-sm flex flex-col items-center">
          <div className="flex gap-4 mb-12 items-center justify-center animate-pulse">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg"><span className="text-white text-3xl font-black italic">J</span></div>
            <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg"><span className="text-white text-3xl font-black italic">P</span></div>
            <div className="w-16 h-16 bg-indigo-400 rounded-2xl flex items-center justify-center shadow-lg"><span className="text-white text-3xl font-black italic">M</span></div>
          </div>
          <div className="w-64 h-1 bg-slate-100 rounded-full overflow-hidden mb-6">
            <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[10px] text-slate-400 font-bold tracking-[0.3em] uppercase">JMC Portal Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-hidden relative selection:bg-indigo-100">
      
      {/* Background Illustrations */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.8] animate-fadeInSlow">
        <div className="absolute -left-10 top-1/4 rotate-[15deg]"><FolderKanban size={180} className="text-indigo-50" /></div>
        <div className="absolute -right-20 top-1/3 rotate-[-15deg]"><BarChart3 size={200} className="text-indigo-100" /></div>
        
        {/* Soft Ambient Shapes */}
        <div className="absolute top-[10%] left-[10%] w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-[10%] right-[10%] w-80 h-80 bg-indigo-50 rounded-full blur-3xl opacity-60" />
      </div>

      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center animate-landingFadeIn">
        
        {/* J P M Logo Area */}
        <div className="mb-8 flex gap-1 items-center justify-center mt-12">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg"><span className="text-white text-2xl font-black italic">J</span></div>
          <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg"><span className="text-white text-2xl font-black italic">P</span></div>
          <div className="w-14 h-14 bg-indigo-400 rounded-2xl flex items-center justify-center shadow-lg"><span className="text-white text-2xl font-black italic">M</span></div>
        </div>

        {/* --- NEW: Hero Lottie Animation --- */}
        <div className="w-full max-w-[350px] md:max-w-[450px] mb-4">
          <Lottie 
            animationData={landingAnimationData} 
            loop={true} 
          />
        </div>
        
        {/* Headline Section */}
        <div className="relative inline-block mb-8">
          <h3 className="font-black text-slate-900 tracking-tighter leading-[1.1]">
            <span className="text-5xl md:text-7xl">
              JMCの
            </span>
            <br />
            <span className="text-indigo-600 text-4xl md:text-6xl">
              プロジェクト管理アプリ
            </span>
          </h3>
          
          {/* Person 1: Beside the Title (Hidden on small screens) */}
          <div className="hidden lg:flex absolute -right-20 top-0 flex-col items-center animate-bounce duration-[3000ms]">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
              <User className="text-blue-600" size={24} />
            </div>
            <Monitor size={16} className="text-slate-300 mt-1" />
          </div>
        </div>

       {/* Updated Description Text */}
        <p className="text-lg md:text-xl text-slate-500 max-w-2xl mb-12 font-medium leading-relaxed">
          プロジェクト、タスク、レポート、そしてチームコラボレーション。<br className="hidden md:block" />
          JMCのすべてを一本化する、高精度ワークスペースへようこそ。
        </p>

        {/* Actions */}
        <div className="relative flex flex-col sm:flex-row gap-4 items-center mb-12">
          <Link href="/login" className="px-10 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2">
            ログイン <LayoutDashboard size={20} />
          </Link>
          <Link href="/signup" className="px-10 py-4 bg-white text-slate-900 font-bold rounded-2xl shadow-md border border-slate-200 hover:bg-slate-50 transition-all active:scale-95">
            新規登録
          </Link>
        </div>
      </main>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-landingFadeIn {
          animation: fadeIn 0.8s ease-out forwards;
        }
        .animate-fadeInSlow {
          animation: fadeIn 1.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}