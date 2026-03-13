'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from "next-auth/react";
import { 
  Sparkles, Bell, BarChart3, Loader2, FolderKanban, 
  Users, ChevronRight, ChevronLeft, Target 
} from 'lucide-react';

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // TECHNICAL: Track which project is currently displayed in the donut card
  const [currentIdx, setCurrentIdx] = useState(0);

  const userName = session?.user?.name || "ゲスト";

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/stats');
        const result = await res.json();
        setData(result);
      } catch (e) {
        console.error("Stats load failed");
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  // Logic to handle current project data
  const projects = data?.projects || [];
  const currentProject = projects[currentIdx];
  
  // Radial Chart Calculation for the specific project
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const completionRate = currentProject?.completionRate || 0;
  const strokeDashoffset = circumference - (completionRate / 100) * circumference;

  // Navigation Handlers
  const handleNext = () => setCurrentIdx((prev) => (prev + 1) % projects.length);
  const handlePrev = () => setCurrentIdx((prev) => (prev - 1 + projects.length) % projects.length);

  return (
    <div className="p-8 bg-slate-50 min-h-screen animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          お疲れ様です, {userName}さん <span className="inline-block animate-wave">👋</span>
        </h1>
        <p className="text-slate-500 mt-1 text-sm font-medium">JMC Project Management Command Center</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. AI Analysis Card - Dynamically updates based on selected project */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 relative overflow-hidden flex flex-col justify-center">
          <div className="absolute left-0 top-12 bottom-12 w-1.5 bg-blue-600 rounded-r-full"></div>
          <div className="pl-4">
            <div className="flex items-center gap-2 text-blue-600 font-bold text-xs tracking-wider mb-4">
              <Sparkles size={16} />
              <span>GEMINI AI 分析</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 leading-tight mb-4">
              {currentProject?.name || "プロジェクト"} の進捗は<br />
              <span className="text-blue-600">{completionRate}%</span> です。
            </h2>
            <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-lg">
              このプロジェクトには現在 {currentProject?.activeTasks} 件のアクティブタスクがあります。
              期限内に完了する見込みです。
            </p>
          </div>
        </div>

       {/* 2. DYNAMIC DONUT CARD WITH INTERNAL NAVIGATION */}
        <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 flex flex-col items-center justify-between h-[360px] overflow-hidden">
          <div className="w-full flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <BarChart3 size={18} className="text-indigo-600" />
              <h3 className="text-sm">進捗ステータス</h3>
            </div>
            
            {/* Side Navigation Buttons */}
            {projects.length > 1 && (
              <div className="flex gap-1">
                <button onClick={handlePrev} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-all">
                  <ChevronLeft size={18} />
                </button>
                <button onClick={handleNext} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-all">
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Project Name Label */}
          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">
            {currentProject?.name || "No Projects Found"}
          </span>
          
          {/* Reduced SVG size from 44 to 36 to fit the 360px height */}
          <div className="relative flex items-center justify-center">
            <svg className="w-36 h-36 transform -rotate-90">
              <circle cx="72" cy="72" r="60" stroke="#f1f5f9" strokeWidth="12" fill="transparent" />
              <circle
                cx="72" cy="72" r="60" stroke="currentColor" strokeWidth="12"
                strokeDasharray={2 * Math.PI * 60}
                style={{ 
                  strokeDashoffset: (2 * Math.PI * 60) - (completionRate / 100) * (2 * Math.PI * 60), 
                  transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' 
                }}
                strokeLinecap="round" fill="transparent"
                className="text-indigo-600 shadow-xl"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-slate-900 leading-none">{completionRate}%</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Done</span>
            </div>
          </div>

          {/* Tightened margins: mt-8 to mt-4, pt-6 to pt-4 */}
          <div className="w-full mt-4 grid grid-cols-2 gap-4 border-t border-slate-50 pt-4">
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">進行中</p>
              <p className="text-lg font-black text-slate-900 leading-none mt-1">{currentProject?.activeTasks || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">完了済み</p>
              <p className="text-lg font-black text-indigo-600 leading-none mt-1">{currentProject?.doneTasks || 0}</p>
            </div>
          </div>

          {/* Project Page Indicator (Dots) */}
          <div className="flex gap-1.5 mt-4 mb-1">
            {projects.map((_: any, idx: number) => (
              <div 
                key={idx} 
                className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentIdx ? 'bg-indigo-600 w-4' : 'bg-slate-200'}`}
              />
            ))}
          </div>
        </div>

        {/* 3. Global Quick Access Stats */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-sm flex flex-col justify-between h-48 hover:shadow-lg transition-all">
            <div className="flex justify-between items-start">
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">Overview</span>
              <FolderKanban size={20} className="text-indigo-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-bold mb-1 uppercase tracking-wider text-[10px]">Total Projects</p>
              <h3 className="text-5xl font-black tracking-tighter">{projects.length}</h3>
            </div>
          </div>
          
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col justify-between h-48 hover:shadow-md transition-all group cursor-pointer">
            <div className="flex justify-between items-start">
              <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">Team</span>
              <Users size={20} className="text-slate-400 group-hover:text-indigo-600" />
            </div>
            <div>
              <p className="text-slate-500 text-[10px] font-bold mb-1 uppercase tracking-wider">Members</p>
              <h3 className="text-5xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tighter">
                {data?.teamMembers || 0}
              </h3>
            </div>
          </div>
        </div>

        {/* 4. Updates -> Notices */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-slate-900 font-bold mb-6">
            <Bell size={20} className="text-rose-500" />
            <h3>最新のお知らせ</h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-bold text-rose-600 mb-1 block">重要</span>
              <p className="text-sm font-medium text-slate-900">サーバーメンテナンス</p>
              <p className="text-xs text-slate-500 mt-1">3月15日 02:00 - 05:00</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}