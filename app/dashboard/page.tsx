'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSession } from "next-auth/react";
import { 
  Sparkles, Bell, BarChart3, Loader2, FolderKanban, 
  Users, ChevronRight, ChevronLeft, AlertCircle, RefreshCw, CheckCircle2, Info
} from 'lucide-react';

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // --- AI Insight States ---
  const [aiInsights, setAiInsights] = useState<any[]>([]); 
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [currentInsightIdx, setCurrentInsightIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false); 

  const [currentIdx, setCurrentIdx] = useState(0);
  const userName = session?.user?.name || "ゲスト";

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/stats');
        const result = await res.json();
        setData(result);
        if (result.projects && result.projects.length > 0) {
          fetchAiInsights(result);
        }
      } catch (e) {
        console.error("Stats load failed");
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  // --- Auto-Slide Logic (5 seconds) ---
  useEffect(() => {
    if (aiInsights.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentInsightIdx((prev) => (prev + 1) % aiInsights.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [aiInsights, isPaused]);

  const fetchAiInsights = async (statsData: any) => {
    setIsAiLoading(true);
    setCurrentInsightIdx(0); 
    try {
      const res = await fetch('/api/ai/dashboard-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projects: statsData.projects,
          totalTasks: statsData.totalTasks || 0 
        }),
      });
      const insightData = await res.json();
      const insightsArray = Array.isArray(insightData) ? insightData : [insightData];
      setAiInsights(insightsArray);
    } catch (e) {
      console.error("AI Insights failed", e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleRefreshInsights = () => {
    if (data && data.projects) {
      fetchAiInsights(data);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  const projects = data?.projects || [];
  const currentProject = projects[currentIdx];
  const completionRate = currentProject?.completionRate || 0;

  const handleNext = () => setCurrentIdx((prev) => (prev + 1) % projects.length);
  const handlePrev = () => setCurrentIdx((prev) => (prev - 1 + projects.length) % projects.length);

  const activeInsight = aiInsights[currentInsightIdx];

  // --- DYNAMIC NOTICES SETUP ---
  // If your backend doesn't send data.notices yet, it uses these defaults
  const notices = data?.notices || [
    { id: 1, type: 'URGENT', title: 'サーバーメンテナンス', date: '3月18日 02:00 - 05:00' },
    { id: 2, type: 'SUCCESS', title: 'Q1目標達成！', date: '3月16日 09:00' },
    { id: 3, type: 'INFO', title: '新しいUI機能が追加されました', date: '3月15日 14:30' }
  ];

  const getNoticeStyle = (type: string) => {
    switch(type) {
      case 'URGENT': 
        return { bg: 'bg-amber-50/50', border: 'border-amber-100', text: 'text-amber-700', hover: 'hover:bg-amber-50', icon: <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> };
      case 'SUCCESS': 
        return { bg: 'bg-emerald-50/50', border: 'border-emerald-100', text: 'text-emerald-700', hover: 'hover:bg-emerald-50', icon: <CheckCircle2 size={12} className="text-emerald-500" /> };
      default: 
        return { bg: 'bg-blue-50/50', border: 'border-blue-100', text: 'text-blue-700', hover: 'hover:bg-blue-50', icon: <Info size={12} className="text-blue-500" /> };
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          お疲れ様です, {userName}さん <span className="inline-block animate-wave">👋</span>
        </h1>
        <p className="text-slate-400 mt-1 text-[10px] font-black uppercase tracking-[0.3em]">JMC Command Center</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. AI SLIDER CARD */}
        <div 
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className={`lg:col-span-2 rounded-[2.5rem] p-8 shadow-xl transition-all duration-700 relative overflow-hidden flex flex-col h-[360px] border
          ${activeInsight?.alertType === 'busy' 
            ? 'bg-gradient-to-br from-rose-50 to-white border-rose-100' 
            : 'bg-gradient-to-br from-indigo-50/50 via-white to-white border-indigo-100/50'}`}
        >
          <div className={`absolute left-0 top-12 bottom-12 w-1.5 rounded-r-full
            ${activeInsight?.alertType === 'busy' ? 'bg-rose-500' : 'bg-indigo-600'}`}></div>
          
          <div className="flex justify-between items-start mb-4">
            <div className={`flex items-center gap-2 font-black text-[10px] tracking-[0.2em] 
              ${activeInsight?.alertType === 'busy' ? 'text-rose-600' : 'text-indigo-600'}`}>
              {isAiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              <span>GEMINI AI ANALYTICS</span>
            </div>
            
            <div className="flex items-center gap-3">
              {aiInsights.length > 1 && (
                <div className="flex gap-1.5 bg-slate-100/50 p-1.5 rounded-full backdrop-blur-sm">
                  {aiInsights.map((_, i) => (
                    <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === currentInsightIdx ? 'w-4 bg-indigo-600' : 'w-1 bg-slate-300'}`} />
                  ))}
                </div>
              )}
              <button 
                onClick={handleRefreshInsights}
                disabled={isAiLoading}
                title="新しいインサイトを取得"
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-full transition-all shadow-sm border border-transparent hover:border-slate-200 disabled:opacity-50"
              >
                <RefreshCw size={14} className={isAiLoading ? "animate-spin text-indigo-600" : ""} />
              </button>
            </div>
          </div>

          <div className="relative flex-1 flex flex-col justify-center">
            {activeInsight && !isAiLoading ? (
              <div key={currentInsightIdx} className="animate-in fade-in slide-in-from-right duration-500 pr-10">
                <h2 className="text-2xl font-black text-slate-900 leading-tight mb-4 tracking-tight">
                  {activeInsight.message}
                </h2>
                <p className="text-slate-500 text-sm font-bold leading-relaxed mb-8 max-w-xl">
                  {activeInsight.coachingTip}
                </p>
                <div className="flex items-center gap-4">
                  <span className="bg-white shadow-sm border border-emerald-100 text-emerald-600 text-[10px] font-black px-4 py-1.5 rounded-xl uppercase">
                    効率性: {activeInsight.efficiency}
                  </span>
                  {activeInsight.alertType === 'busy' && (
                    <span className="flex items-center gap-1.5 text-rose-600 text-[10px] font-black uppercase bg-rose-100/50 px-3 py-1.5 rounded-xl border border-rose-200">
                      <AlertCircle size={14} /> Critical Priority
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-300 py-10">
                <Loader2 className="animate-spin mb-4" size={32} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Syncing Insights...</span>
              </div>
            )}
          </div>

          <div className="absolute right-8 bottom-8 flex gap-3">
             <button onClick={() => setCurrentInsightIdx(prev => (prev - 1 + aiInsights.length) % aiInsights.length)} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 hover:shadow-md active:scale-95 transition-all"><ChevronLeft size={18}/></button>
             <button onClick={() => setCurrentInsightIdx(prev => (prev + 1) % aiInsights.length)} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 hover:shadow-md active:scale-95 transition-all"><ChevronRight size={18}/></button>
          </div>
        </div>

        {/* 2. DYNAMIC DONUT CARD */}
        <div className="bg-slate-50/50 rounded-[2.5rem] p-6 shadow-sm border border-slate-200/60 flex flex-col items-center justify-between h-[360px] overflow-hidden backdrop-blur-sm">
          <div className="w-full flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 text-slate-900 font-black">
              <BarChart3 size={18} className="text-indigo-600" />
              <h3 className="text-[11px] uppercase tracking-widest">Progress</h3>
            </div>
            {projects.length > 1 && (
              <div className="flex gap-1 bg-white p-1 rounded-xl border border-slate-100">
                <button onClick={handlePrev} className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-all"><ChevronLeft size={16} /></button>
                <button onClick={handleNext} className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-all"><ChevronRight size={16} /></button>
              </div>
            )}
          </div>
          <span className="text-[10px] font-black text-indigo-600/60 uppercase tracking-[0.2em] mb-2">{currentProject?.name || "No Projects Found"}</span>
          <div className="relative flex items-center justify-center">
            <svg className="w-36 h-36 transform -rotate-90">
              <circle cx="72" cy="72" r="62" stroke="#e2e8f0" strokeWidth="10" fill="transparent" />
              <circle cx="72" cy="72" r="62" stroke="currentColor" strokeWidth="10" strokeDasharray={2 * Math.PI * 62} style={{ strokeDashoffset: (2 * Math.PI * 62) - (completionRate / 100) * (2 * Math.PI * 62), transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }} strokeLinecap="round" fill="transparent" className="text-indigo-600" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-slate-900 leading-none tracking-tighter">{completionRate}%</span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Complete</span>
            </div>
          </div>
          <div className="w-full mt-4 grid grid-cols-2 gap-4 border-t border-slate-200/50 pt-4">
            <div className="text-center"><p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Active</p><p className="text-xl font-black text-slate-900 mt-1">{currentProject?.activeTasks || 0}</p></div>
            <div className="text-center"><p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Done</p><p className="text-xl font-black text-indigo-600 mt-1">{currentProject?.doneTasks || 0}</p></div>
          </div>
          <div className="flex gap-1.5 mt-4 mb-1">
            {projects.map((_: any, idx: number) => (
              <div key={idx} className={`h-1 rounded-full transition-all duration-500 ${idx === currentIdx ? 'bg-indigo-600 w-4' : 'bg-slate-300 w-1'}`} />
            ))}
          </div>
        </div>

        {/* 3. Global Stats */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-900/20 flex flex-col justify-between h-52 hover:-translate-y-1 transition-all duration-300">
            <div className="flex justify-between items-start">
              <span className="bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Portfolio</span>
              <FolderKanban size={24} className="text-indigo-400" />
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-black mb-1 uppercase tracking-[0.2em]">Total Projects</p>
              <h3 className="text-6xl font-black tracking-tighter italic">{projects.length}</h3>
            </div>
          </div>
          <div className="bg-emerald-50 rounded-[2.5rem] p-8 shadow-sm border border-emerald-100 flex flex-col justify-between h-52 hover:-translate-y-1 transition-all duration-300 group cursor-pointer overflow-hidden relative">
            <div className="absolute -right-4 -bottom-4 text-emerald-100/50 transform rotate-12 group-hover:scale-110 transition-transform duration-700">
              <Users size={120} />
            </div>
            <div className="flex justify-between items-start relative z-10">
              <span className="bg-emerald-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Workspace</span>
              <Users size={24} className="text-emerald-600 group-hover:rotate-6 transition-transform" />
            </div>
            <div className="relative z-10">
              <p className="text-emerald-700/60 text-[10px] font-black mb-1 uppercase tracking-[0.2em]">Team Members</p>
              <h3 className="text-6xl font-black text-emerald-900 tracking-tighter italic">{data?.teamMembers || 0}</h3>
            </div>
          </div>
        </div>

        {/* 4. DYNAMIC NOTICES (Broadcasts) */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-slate-900 font-black">
              <div className="bg-rose-100 p-2 rounded-xl text-rose-600">
                <Bell size={20} />
              </div>
              <h3 className="text-[11px] uppercase tracking-[0.2em]">Broadcasts</h3>
            </div>
            <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-1 rounded-md">{notices.length} New</span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-2 no-scrollbar max-h-[220px]">
            {notices.map((notice: any) => {
              const style = getNoticeStyle(notice.type);
              return (
                <div key={notice.id} className={`p-4 rounded-3xl ${style.bg} border ${style.border} group ${style.hover} transition-colors cursor-pointer`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      {style.icon}
                      <span className={`text-[9px] font-black ${style.text} uppercase tracking-widest`}>{notice.type}</span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-bold">{notice.date}</span>
                  </div>
                  <p className="text-sm font-black text-slate-800 transition-colors">{notice.title}</p>
                </div>
              );
            })}
          </div>

          <button className="mt-4 w-full py-3 rounded-2xl bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95">View Archive</button>
        </div>

      </div>
    </div>
  );
}