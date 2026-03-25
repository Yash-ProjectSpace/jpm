'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";
import dynamic from 'next/dynamic';
import { 
  ShieldCheck, Users, Briefcase, Clock, Loader2, 
  AlertCircle, X, ExternalLink, Calendar, Sparkles,
  ChevronLeft, ChevronRight, Folder, TrendingUp
} from 'lucide-react';

// --- NEW: RECHARTS IMPORTS ---
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

import waveAnimation from '@/public/animations/wave-animation.json'; 

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

export default function AdminDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  
  const [members, setMembers] = useState<any[]>([]);
  const [allProjects, setAllProjects] = useState<any[]>([]); 
  // --- NEW: STATE FOR CHART DATA ---
  const [chartData, setChartData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    inProgress: 0,
    finished: 0,
    nearDeadlines: [] as any[]
  });

  const [currentAiIndex, setCurrentAiIndex] = useState(0);

  useEffect(() => {
    if (status === 'authenticated' && (session?.user as any)?.role !== 'MANAGER') {
      router.push('/dashboard');
    }
  }, [session, status, router]);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const timestamp = new Date().getTime();
        // --- UPDATED: FETCH STATS API FOR CHART DATA ---
        const [memberRes, projectRes, statsRes] = await Promise.all([
          fetch(`/api/members?t=${timestamp}`, { cache: 'no-store' }),
          fetch(`/api/projects?t=${timestamp}`, { cache: 'no-store' }),
          fetch(`/api/admin/stats?t=${timestamp}`, { cache: 'no-store' })
        ]);
        
        if (memberRes.ok && projectRes.ok && statsRes.ok) {
          const mData = await memberRes.json();
          const pData = await projectRes.json();
          const sData = await statsRes.json();

          setMembers(mData);
          setAllProjects(pData); 
          setChartData(sData.chartData || []); // Set the velocity data

          const twoDaysFromNow = new Date();
          twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

          const near = pData.filter((p: any) => {
            if (!p.endDate) return false;
            const dueDate = new Date(p.endDate);
            return dueDate <= twoDaysFromNow && p.status !== 'COMPLETED';
          });

          setStats({
            totalProjects: pData.length,
            inProgress: pData.filter((p: any) => p.status === 'IN_PROGRESS' || p.status === 'STARTED' || p.status === '進行中').length,
            finished: pData.filter((p: any) => p.status === 'COMPLETED' || p.status === '完了').length,
            nearDeadlines: near
          });
        }
      } catch (error) {
        console.error("Dashboard Load Error:", error);
      } finally {
        setLoading(false); 
      }
    };

    fetchAdminData();
    const intervalId = setInterval(fetchAdminData, 10000);
    return () => clearInterval(intervalId);
  }, []);

  const getUserAnalysis = (user: any) => {
    // ... (Keep existing getUserAnalysis logic as fallback or for other uses)
    if (!user) return null;
    const userProjects = allProjects.filter(p => p.members?.some((m: any) => m.id === user.id));
    const active = userProjects.filter(p => p.status !== 'COMPLETED' && p.status !== '完了').length;
    const finished = userProjects.length - active;

    if (userProjects.length === 0) {
      return {
        tag: '待機中', tagColor: 'bg-slate-800',
        title: `${user.name}は現在アサイン待ちです`,
        text: '"現在割り当てられているプロジェクトはありません。リソースを活用するため、新しいタスクの割り当てを検討してください。"'
      };
    }
    // ... rest of logic
    return { tag: '順調', title: 'Loading...', text: '...' }; 
  };

  const handlePrevAi = () => {
    setCurrentAiIndex((prev) => (prev === 0 ? members.length - 1 : prev - 1));
  };
  const handleNextAi = () => {
    setCurrentAiIndex((prev) => (prev === members.length - 1 ? 0 : prev + 1));
  };

  if (loading || status === 'loading' || (status === 'authenticated' && (session?.user as any)?.role !== 'MANAGER')) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  const userName = (session?.user as any)?.name || '管理者';

  return (
    <div className="h-screen flex flex-col bg-[#f8fafc] overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0 max-w-[1500px] mx-auto w-full p-6 lg:p-8">
        
        <header className="mb-6 shrink-0">
          <div className="flex items-center flex-wrap gap-2">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              お疲れ様です, {userName}さん
            </h1>
            <div className="w-12 h-12 md:w-16 md:h-16 flex-shrink-0 -mt-1 sm:-mt-2 flex items-center justify-center overflow-hidden">
              <Lottie animationData={waveAnimation} loop={true} style={{ width: '100%', height: '100%' }} />
            </div>
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">
            管理者ワークスペース概要
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0 mb-6">
          {/* Top Cards (Projects, Members, Deadlines) - Kept exactly the same */}
          <div onClick={() => router.push('/admin/projects')} className="h-44 bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl hover:-translate-y-1 transition-transform cursor-pointer flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="border border-slate-600 rounded-full px-4 py-1.5 text-xs font-bold tracking-widest text-slate-100">ポートフォリオ</div>
              <div className="text-indigo-400 bg-slate-800 p-3 rounded-2xl"><Briefcase size={20} /></div>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs font-bold text-slate-400 mb-1 tracking-wider">総プロジェクト数</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-white italic tracking-tighter">{stats.totalProjects}</span>
                  <span className="text-sm font-bold text-slate-400">件</span>
                </div>
              </div>
<div className="space-y-2 pb-2">
  {/* Row: 進行中 */}
  <div className="flex items-center justify-end">
    {/* Fixed width for Label */}
    <span className="text-[10px] font-black tracking-widest text-slate-500 w-10 text-left">
      進行中
    </span>
    
    {/* Fixed width for Number (Centered or Right aligned) */}
    <span className="text-white text-base font-black w-5 text-center font-mono">
      {stats.inProgress}
    </span>
    
    {/* Fixed width for Emoji */}
    <span className="text-amber-500 text-sm w-5 flex justify-center">
      🔥
    </span>
  </div>

  {/* Row: 完了 */}
  <div className="flex items-center justify-end">
    {/* Fixed width for Label */}
    <span className="text-[10px] font-black tracking-widest text-slate-500 w-10 text-left">
      完了
    </span>
    
    {/* Fixed width for Number (Must match the one above) */}
    <span className="text-white text-base font-black w-5 text-center font-mono">
      {stats.finished}
    </span>
    
    {/* Fixed width for Emoji */}
    <span className="text-purple-400 text-sm font-black w-5 flex justify-center">
      ✓
    </span>
  </div>
</div>
   </div>
          </div>

          <div onClick={() => router.push('/admin/members')} className="h-44 bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 hover:-translate-y-1 transition-transform cursor-pointer flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="bg-emerald-500 rounded-full px-4 py-1.5 text-xs font-bold tracking-widest text-white shadow-md shadow-emerald-500/20">ワークスペース</div>
              <div className="text-white bg-emerald-500 p-3 rounded-2xl shadow-sm"><Users size={20} /></div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 mb-1 tracking-widest">チームメンバー</p>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black text-emerald-500 italic tracking-tighter">{members.length}</span>
                <span className="text-sm font-bold text-emerald-500">名</span>
              </div>
            </div>
          </div>

          <div onClick={() => setShowDeadlineModal(true)} className="h-44 bg-rose-50 rounded-[2rem] p-6 shadow-sm border border-rose-100 hover:-translate-y-1 transition-transform cursor-pointer flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-1.5 bg-rose-100 text-rose-600 rounded-full px-4 py-1.5 text-xs font-bold tracking-widest border border-rose-200 shadow-sm"><AlertCircle size={14} /> 締切アラート</div>
              {stats.nearDeadlines.length > 0 ? (
                 <div className="text-xs font-bold text-white bg-rose-500 px-3 py-1.5 rounded-full shadow-sm">{stats.nearDeadlines.length}件の新規</div>
              ) : (
                 <div className="text-xs font-bold text-rose-400 bg-white px-3 py-1.5 rounded-full shadow-sm border border-rose-100">0件の新規</div>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 mb-1 tracking-widest">締切間近 (48時間以内)</p>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black text-rose-600 italic tracking-tighter">{stats.nearDeadlines.length}</span>
                <span className="text-sm font-bold text-rose-400">件</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- REPLACED: AI ANALYSIS BOX WITH PROJECT VELOCITY CHART --- */}
        <div className="flex-1 flex flex-col min-h-0 bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm relative overflow-hidden">
          <div className="absolute left-0 top-10 bottom-10 w-2.5 bg-indigo-600 rounded-r-xl"></div>
          
          <div className="flex items-center justify-between mb-6 pl-4 shrink-0">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-50 text-indigo-600 p-3.5 rounded-2xl">
                <TrendingUp size={24} />
              </div>
              <div className="flex flex-col">
                <h3 className="font-black text-slate-800 text-sm tracking-tight">プロジェクト・ベロシティ</h3>
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-0.5">作成 vs 完了 トレンド</p>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                <Line 
                  type="monotone" 
                  dataKey="created" 
                  name="新規作成" 
                  stroke="#6366f1" 
                  strokeWidth={4} 
                  dot={{ r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 8 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  name="完了済み" 
                  stroke="#10b981" 
                  strokeWidth={4} 
                  dot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* DYNAMIC CURVED MODAL - Kept exactly the same */}
      {showDeadlineModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={() => setShowDeadlineModal(false)} />
          <div style={{ borderRadius: '60px' }} className="bg-white w-full max-w-xl shadow-2xl relative z-10 animate-in zoom-in-95 duration-300 flex flex-col max-h-[80vh] border border-white/20 overflow-hidden">
            <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-rose-50/20">
              <div className="flex items-center gap-4">
                <div style={{ borderRadius: '18px' }} className="p-3 bg-rose-600 text-white shadow-lg shadow-rose-200"><Clock size={22}/></div>
                <div className="flex flex-col">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">Urgent Deadlines</h2>
                  <p className="text-[9px] font-black text-rose-600 uppercase tracking-[0.2em] mt-1.5">Action within 48h</p>
                </div>
              </div>
              <button onClick={() => setShowDeadlineModal(false)} className="p-2.5 bg-white border border-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-full transition-all shadow-sm"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 space-y-4 custom-scrollbar">
              {stats.nearDeadlines.length > 0 ? (
                stats.nearDeadlines.map((p: any) => (
                  <div key={p.id} style={{ borderRadius: '30px' }} className="group p-5 bg-slate-50/50 border border-slate-100 flex items-center justify-between hover:bg-white hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div style={{ borderRadius: '14px' }} className="w-12 h-12 bg-white flex items-center justify-center shadow-sm text-slate-400 group-hover:text-rose-600 transition-all"><Calendar size={20} /></div>
                      <div>
                        <h4 className="font-black text-slate-900 text-md tracking-tight">{p.name}</h4>
                        <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mt-0.5">Ends: {new Date(p.endDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button onClick={() => router.push(`/admin/projects/${p.id}`)} className="p-3.5 bg-white text-slate-400 rounded-xl hover:text-white hover:bg-indigo-600 shadow-sm transition-all"><ExternalLink size={18} /></button>
                  </div>
                ))
              ) : (
                <div style={{ borderRadius: '40px' }} className="text-center py-20 bg-slate-50/50 border-2 border-dashed border-slate-100">
                  <AlertCircle size={40} className="text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 font-black uppercase tracking-widest text-[9px]">No urgent deadlines found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}