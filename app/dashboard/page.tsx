'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link'; 
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Bell, BarChart3, Loader2, FolderKanban, 
  Users, ChevronRight, ChevronLeft, CheckCircle2, Info, Clock
} from 'lucide-react';

import waveAnimationData from '@/public/animations/wave-animation.json';
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [memberCount, setMemberCount] = useState<number>(0);
  
  const [aiInsights, setAiInsights] = useState<any[]>([]); 
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [currentInsightIdx, setCurrentInsightIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false); 

  const [currentIdx, setCurrentIdx] = useState(0);
  const userName = session?.user?.name || "ゲスト";

  // ROLE-BASED ROUTING: Bounces MANAGERS to the Admin Dashboard
  useEffect(() => {
    if (status === 'authenticated' && (session?.user as any)?.role === 'MANAGER') {
      router.push('/admin/dashboard');
    }
  }, [session, status, router]);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/stats');
        const result = await res.json();
        setData(result);
        if (result.projects && result.projects.length > 0) {
          generateDynamicInsights(result.projects);
        }
      } catch (e) {
        console.error("Stats load failed");
      }

      try {
        const memberRes = await fetch('/api/members');
        if (memberRes.ok) {
          const membersData = await memberRes.json();
          const dbCount = Array.isArray(membersData) ? membersData.length : (membersData.members?.length || 0);
          setMemberCount(dbCount);
        } else {
          const userRes = await fetch('/api/users');
          if (userRes.ok) {
            const usersData = await userRes.json();
            const dbCount = Array.isArray(usersData) ? usersData.length : 0;
            setMemberCount(dbCount);
          } else {
            setMemberCount(0);
          }
        }
      } catch (e) {
        console.error("Dynamic members load failed");
        setMemberCount(0);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const generateDynamicInsights = (projects: any[]) => {
    setIsAiLoading(true);
    setTimeout(() => {
      const insights = projects.map(project => {
        const isUrgent = project.daysRemaining <= 3 && project.completionRate < 100;
        const isStagnant = project.activeTasks > project.doneTasks && project.completionRate < 50;

        if (isUrgent) {
          return {
            category: "期限間近のアラート", 
            message: `${project.name}の締切が迫っています`,
            coachingTip: `完了率が${project.completionRate}%です。残り${project.daysRemaining}日で完了させるために、リソースを集中させる必要があります。`,
            alertType: "busy"
          };
        } else if (isStagnant) {
          return {
            category: "進捗遅延の兆候", 
            message: `${project.name}の進捗を改善できます`,
            coachingTip: `アクティブなタスクが${project.activeTasks}件滞留しています。優先順位を見直し、ボトルネックを解消しましょう。`,
            alertType: "normal"
          };
        } else {
          return {
            category: "順調な進捗", 
            message: `${project.name}は順調に進行中です`,
            coachingTip: `現在のペース（${project.completionRate}%完了）は理想的です。引き続き現在のワークフローを維持してください。`,
            alertType: "success"
          };
        }
      });
      setAiInsights(insights);
      setIsAiLoading(false);
    }, 800);
  };

  useEffect(() => {
    if (aiInsights.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentInsightIdx((prev) => (prev + 1) % aiInsights.length);
    }, 10000); 
    return () => clearInterval(interval);
  }, [aiInsights, isPaused]);

  // FIX: Added `status === 'loading'` to prevent UI flashing before redirect!
  if (
    loading || 
    status === 'loading' || 
    (status === 'authenticated' && (session?.user as any)?.role === 'MANAGER')
  ) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  const allProjects = data?.projects || [];
  
  const shinchokuProjects = allProjects.filter((project: any) => {
    if ((project.completionRate || 0) < 100) return true;
    if (project.completedAt) {
      const completedDate = new Date(project.completedAt).getTime();
      const now = new Date().getTime();
      const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
      return (now - completedDate) < twoDaysInMs;
    }
    return false;
  });

  const currentProject = shinchokuProjects[currentIdx];
  const completionRate = currentProject?.completionRate || 0;

  const handleNext = () => setCurrentIdx((prev) => (prev + 1) % (shinchokuProjects.length || 1));
  const handlePrev = () => setCurrentIdx((prev) => (prev - 1 + shinchokuProjects.length) % (shinchokuProjects.length || 1));

  const activeInsight = aiInsights[currentInsightIdx];
  
  const rawNotices = Array.isArray(data?.notices) ? data.notices : [];
  const notices = rawNotices.filter((notice: any) => 
    !notice.title?.includes('新しいお知らせはありません')
  );

  const getNoticeStyle = (type: string) => {
    switch(type) {
      case 'EVENT':
      case 'URGENT': return { bg: 'bg-amber-50/50', border: 'border-amber-100', text: 'text-amber-700', icon: <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> };
      case 'PROJECT':
      case 'SUCCESS': return { bg: 'bg-emerald-50/50', border: 'border-emerald-100', text: 'text-emerald-700', icon: <CheckCircle2 size={12} className="text-emerald-500" /> };
      case 'COMPANY':
      default: return { bg: 'bg-blue-50/50', border: 'border-blue-100', text: 'text-blue-700', icon: <Info size={12} className="text-blue-500" /> };
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen animate-in fade-in duration-500 overflow-x-hidden">
      <div className="max-w-[1400px] mx-auto p-8">
        
        <header className="mb-10">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center">
            お疲れ様です, {userName}さん 
            <div className="ml-3 flex-shrink-0"> 
              <Lottie animationData={waveAnimationData} loop={true} style={{ width: 34, height: 34 }} />
            </div>
          </h1>
          <p className="text-slate-500 mt-1 text-[10px] font-black uppercase tracking-[0.3em]">今日も頑張りましょう！</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div 
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className={`lg:col-span-2 rounded-[2rem] p-8 shadow-sm transition-all duration-700 relative overflow-hidden flex flex-col h-[380px] border
            ${activeInsight?.alertType === 'busy' ? 'bg-rose-50/30 border-rose-100' : 'bg-white border-slate-200'}`}
          >
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${activeInsight?.alertType === 'busy' ? 'bg-rose-500' : 'bg-indigo-600'}`}></div>
            <div className="flex justify-between items-start mb-6 shrink-0 relative z-10">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${activeInsight?.alertType === 'busy' ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
                  {isAiLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                </div>
                <div>
                  <h3 className="text-[11px] font-black tracking-[0.2em] text-slate-500 uppercase">AIインテリジェンス</h3>
                  <p className={`text-[10px] font-bold ${activeInsight?.alertType === 'busy' ? 'text-rose-500' : 'text-indigo-600'}`}>
                    {isAiLoading ? "Analyzing Data..." : "分析"}
                  </p>
                </div>
              </div>
              <div className="flex gap-1.5 mt-2">
                {aiInsights.map((_, i) => (
                  <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === currentInsightIdx ? 'w-6 bg-indigo-600' : 'w-1.5 bg-slate-300'}`} />
                ))}
              </div>
            </div>

            <div className="relative flex-1 min-h-0 z-10">
              <AnimatePresence mode="wait">
                {activeInsight && !isAiLoading ? (
                  <motion.div 
                    key={currentInsightIdx}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="absolute inset-0 flex flex-col"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${activeInsight.alertType === 'busy' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white'}`}>
                        {activeInsight.category}
                      </span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 leading-tight mb-4 tracking-tight line-clamp-2 min-h-[60px]">
                      {activeInsight.message}
                    </h2>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex-1 max-h-[90px] overflow-hidden">
                      <p className="text-slate-600 text-sm font-medium italic leading-relaxed">"{activeInsight.coachingTip}"</p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500">
                    <Loader2 className="animate-spin mb-4" size={32} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Generating Insights...</span>
                  </div>
                )}
              </AnimatePresence>
            </div>
            <div className="absolute right-8 bottom-8 flex gap-2 z-20">
                <button onClick={() => setCurrentInsightIdx(prev => (prev - 1 + aiInsights.length) % aiInsights.length)} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 transition-all active:scale-95"><ChevronLeft size={20}/></button>
                <button onClick={() => setCurrentInsightIdx(prev => (prev + 1) % aiInsights.length)} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 transition-all active:scale-95"><ChevronRight size={20}/></button>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-200/60 flex flex-col items-center justify-between h-[380px] overflow-hidden backdrop-blur-sm">
            <div className="w-full flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 text-slate-900 font-black">
                <BarChart3 size={18} className="text-indigo-600" />
                <h3 className="text-[11px] uppercase tracking-widest">進捗
                </h3>
              </div>
              {shinchokuProjects.length > 1 && (
                <div className="flex gap-1 bg-white p-1 rounded-xl border border-slate-100">
                  <button onClick={handlePrev} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-indigo-600 transition-all"><ChevronLeft size={16} /></button>
                  <button onClick={handleNext} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-indigo-600 transition-all"><ChevronRight size={16} /></button>
                </div>
              )}
            </div>
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-2">{currentProject?.name || "プロジェクトなし"}</span>
            <div className="relative flex items-center justify-center">
              <svg className="w-36 h-36 transform -rotate-90">
                <circle cx="72" cy="72" r="62" stroke="#f1f5f9" strokeWidth="10" fill="transparent" />
                <circle cx="72" cy="72" r="62" stroke="currentColor" strokeWidth="10" strokeDasharray={2 * Math.PI * 62} style={{ strokeDashoffset: (2 * Math.PI * 62) - (completionRate / 100) * (2 * Math.PI * 62), transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }} strokeLinecap="round" fill="transparent" className="text-indigo-600" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-900 leading-none tracking-tighter">{completionRate}%</span>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">完了です</span>
              </div>
            </div>
            <div className="w-full mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
              <div className="text-center"><p className="text-[9px] font-black text-slate-500 uppercase">アクティブ</p><p className="text-xl font-black text-slate-900 mt-1">{currentProject?.activeTasks || 0}</p></div>
              <div className="text-center"><p className="text-[9px] font-black text-slate-500 uppercase">終了</p><p className="text-xl font-black text-indigo-600 mt-1">{currentProject?.doneTasks || 0}</p></div>
            </div>
            <div className="flex gap-1.5 mt-4 mb-1">
              {shinchokuProjects.map((_: any, idx: number) => (
                <div key={idx} className={`h-1 rounded-full transition-all duration-500 ${idx === currentIdx ? 'bg-indigo-600 w-4' : 'bg-slate-300 w-1'}`} />
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <div 
              onClick={() => router.push('/dashboard/projects')} 
              className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl flex flex-col justify-between h-52 hover:-translate-y-1 active:scale-[0.98] transition-all group overflow-hidden relative cursor-pointer"
            >
              <div className="absolute -right-2 -bottom-2 text-white/5 opacity-10 transform rotate-12 group-hover:scale-110 transition-transform duration-700"><FolderKanban size={140} /></div>
              <div className="flex justify-between items-start relative z-10">
                <span className="bg-white/10 text-indigo-200 border border-white/10 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md">ポートフォリオ</span>
                <div className="p-2 bg-white/5 rounded-xl"><FolderKanban size={20} className="text-indigo-400" /></div>
              </div>
              <div className="relative z-10">
                <p className="text-slate-400 text-[10px] font-black mb-1 uppercase tracking-[0.2em]">総プロジェクト数</p>
                <div className="flex items-end gap-8">
                  <h3 className="text-6xl font-black tracking-tighter italic leading-none">{allProjects.length}<span className="text-xl ml-2 not-italic text-indigo-500">件</span></h3>
                  <div className="flex flex-col gap-2.5 pb-1 border-l border-white/10 pl-6">
                    <div className="flex items-center">
                      <span className="text-[10px] font-bold text-slate-300 tracking-widest uppercase w-16">進行中</span>
                      <div className="flex items-center ml-2">
                         <span className="text-sm font-black text-white tabular-nums">{allProjects.filter((p: any) => (p.completionRate || 0) < 100).length}</span>
                         <span className="ml-3 text-xs">🔥</span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="text-[10px] font-bold text-slate-300 tracking-widest uppercase w-16">完了</span>
                      <div className="flex items-center ml-2">
                        <span className="text-sm font-black text-white tabular-nums">{allProjects.filter((p: any) => (p.completionRate || 0) >= 100).length}</span>
                        <span className="ml-3 text-xs font-bold">✓</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div 
              onClick={() => router.push('/dashboard/members')} 
              className="bg-emerald-50 rounded-[2.5rem] p-8 shadow-sm border border-emerald-100 flex flex-col justify-between h-52 hover:-translate-y-1 active:scale-[0.98] transition-all relative overflow-hidden group cursor-pointer"
            >
              <div className="absolute -right-4 -bottom-4 text-emerald-100/50 transform rotate-12 group-hover:scale-110 transition-transform duration-700"><Users size={120} /></div>
              <div className="relative z-10 flex justify-between items-start">
                <span className="bg-emerald-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200/50">ワークスペース</span>
                <div className="p-2 bg-white rounded-xl shadow-sm border border-emerald-100"><Users size={20} className="text-emerald-600" /></div>
              </div>
              <div className="relative z-10">
                <p className="text-emerald-900 text-[11px] font-black mb-1 uppercase tracking-[0.2em]">チームメンバー</p>
                <h3 className="text-6xl font-black text-emerald-900 tracking-tighter italic leading-none">
                  {memberCount}
                  <span className="text-xl ml-2 not-italic text-emerald-600 font-black">名</span>
                </h3>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col h-[380px]">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <div className="flex items-center gap-2 text-slate-900 font-black">
                <div className="bg-rose-100 p-2 rounded-xl text-rose-600">
                  <Bell size={20} />
                </div>
                <h3 className="text-[11px] uppercase tracking-[0.2em]">お知らせ</h3>
              </div>
              
              {notices.length > 0 && (
                <span className="bg-rose-50 text-rose-600 text-[10px] font-black px-2 py-1 rounded-md border border-rose-100 animate-pulse">
                  {notices.length}件の新規
                </span>
              )}

              {notices.length === 0 && (
                <span className="text-slate-500 text-[10px] font-black px-2 py-1 uppercase tracking-widest">
                  0件
                </span>
              )}
            </div>

            <div className="flex-1 overflow-hidden">
              {notices.length > 0 ? (
                <div className="space-y-3 h-full overflow-y-auto pr-2 no-scrollbar">
                  {notices.slice(0, 3).map((notice: any) => {
                    const style = getNoticeStyle(notice.category || notice.type);
                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        key={notice.id} 
                        className={`p-4 rounded-3xl ${style.bg} border ${style.border} group transition-all hover:shadow-md cursor-pointer`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            {style.icon}
                            <span className={`text-[9px] font-black ${style.text} uppercase tracking-widest`}>
                              {notice.category || notice.type}
                            </span>
                          </div>
                          <span className="text-[9px] text-slate-500 font-bold">
                            {notice.createdAt ? new Date(notice.createdAt).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }) : notice.date}
                          </span>
                        </div>
                        <p className="text-sm font-black text-slate-800 line-clamp-1">{notice.title}</p>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4 border-2 border-slate-300 shadow-sm">
                    <CheckCircle2 size={32} className="text-slate-600" />
                  </div>
                  <p className="text-slate-900 font-black text-sm">新しいお知らせはありません</p>
                  <p className="text-slate-500 text-[10px] font-bold mt-1 uppercase tracking-tighter">
                    現在、すべての業務は正常に進行しています。
                  </p>
                </div>
              )}
            </div>

            <Link 
              href="/dashboard/noticeboard"
              className="mt-4 w-full py-3 rounded-2xl bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 shrink-0 block text-center"
            >
              もっと見る
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}