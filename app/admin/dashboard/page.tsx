'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";
import { 
  ShieldCheck, Users, Briefcase, Clock, Loader2, 
  AlertCircle, X, ExternalLink, Calendar, Sparkles,
  ChevronLeft, ChevronRight, Folder
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  
  const [members, setMembers] = useState<any[]>([]);
  const [allProjects, setAllProjects] = useState<any[]>([]); 
  const [stats, setStats] = useState({
    totalProjects: 0,
    inProgress: 0,
    finished: 0,
    nearDeadlines: [] as any[]
  });

  // --- NEW: Tracks which member's AI analysis we are currently viewing ---
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
        const [memberRes, projectRes] = await Promise.all([
          fetch(`/api/members?t=${timestamp}`, { cache: 'no-store' }),
          fetch(`/api/projects?t=${timestamp}`, { cache: 'no-store' })
        ]);
        
        if (memberRes.ok && projectRes.ok) {
          const mData = await memberRes.json();
          const pData = await projectRes.json();

          setMembers(mData);
          setAllProjects(pData); 

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
    if (active > 3) {
      return {
        tag: 'オーバーワーク注意', tagColor: 'bg-rose-600',
        title: `${user.name}の負荷が高くなっています`,
        text: `"現在${active}件のプロジェクトを同時に抱えています。パフォーマンス低下を防ぐため、タスクの再配分を推奨します。"`
      };
    }
    if (active > 0) {
      return {
        tag: '順調な進捗', tagColor: 'bg-slate-900',
        title: `${user.name}のワークフローは理想的です`,
        text: `"現在${active}件のプロジェクトが進行中です。バランスの取れたペースで稼働しています。引き続き現在の体制を維持してください。"`
      };
    }
    return {
      tag: 'タスク完了', tagColor: 'bg-emerald-600',
      title: `${user.name}のタスクは全て完了しました`,
      text: `"担当していた${finished}件のプロジェクトが全て完了しました。素晴らしいパフォーマンスです。次のアサインの準備ができています。"`
    };
  };

  // --- NEW: Handlers for cycling through the AI analysis ---
  const handlePrevAi = () => {
    setCurrentAiIndex((prev) => (prev === 0 ? members.length - 1 : prev - 1));
  };
  const handleNextAi = () => {
    setCurrentAiIndex((prev) => (prev === members.length - 1 ? 0 : prev + 1));
  };

  if (
    loading || 
    status === 'loading' || 
    (status === 'authenticated' && (session?.user as any)?.role !== 'MANAGER')
  ) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#f8fafc] overflow-hidden">
      
      <div className="flex-1 flex flex-col min-h-0 max-w-[1500px] mx-auto w-full p-6 lg:p-8">
        
        <header className="mb-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-600/20">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">管理者コンソール</h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Administrator Command Center</p>
            </div>
          </div>
        </header>

        {/* --- TOP CARDS (Clean Minimalist Design) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0 mb-6">
          
          <div onClick={() => router.push('/admin/projects')} className="h-44 bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl hover:-translate-y-1 transition-transform cursor-pointer flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="border border-slate-600 rounded-full px-4 py-1.5 text-xs font-bold tracking-widest text-slate-100">
                ポートフォリオ
              </div>
              <div className="text-indigo-400 bg-slate-800 p-3 rounded-2xl">
                <Briefcase size={20} />
              </div>
            </div>

            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs font-bold text-slate-400 mb-1 tracking-wider">総プロジェクト数</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-6xl font-black text-white italic tracking-tighter">{stats.totalProjects}</span>
                  <span className="text-sm font-bold text-slate-400">件</span>
                </div>
              </div>
              <div className="space-y-1.5 pb-2">
                <div className="flex items-center gap-3 justify-end">
                  <span className="text-[10px] font-black tracking-widest text-slate-500">ACTIVE</span>
                  <span className="text-white text-base font-bold w-4 text-right">{stats.inProgress}</span>
                  <span className="text-amber-500 text-sm">🔥</span>
                </div>
                <div className="flex items-center gap-3 justify-end">
                  <span className="text-[10px] font-black tracking-widest text-slate-500">FINISHED</span>
                  <span className="text-white text-base font-bold w-4 text-right">{stats.finished}</span>
                  <span className="text-purple-400 text-sm font-black">✓</span>
                </div>
              </div>
            </div>
          </div>

          <div onClick={() => router.push('/admin/members')} className="h-44 bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 hover:-translate-y-1 transition-transform cursor-pointer flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="bg-emerald-500 rounded-full px-4 py-1.5 text-xs font-bold tracking-widest text-white shadow-md shadow-emerald-500/20">
                ワークスペース
              </div>
              <div className="text-white bg-emerald-500 p-3 rounded-2xl shadow-sm">
                <Users size={20} />
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-800 mb-1 tracking-widest">チームメンバー</p>
              <div className="flex items-baseline gap-1">
                <span className="text-6xl font-black text-emerald-500 italic tracking-tighter">{members.length}</span>
                <span className="text-sm font-bold text-emerald-500">名</span>
              </div>
            </div>
          </div>

          <div onClick={() => setShowDeadlineModal(true)} className="h-44 bg-rose-50 rounded-[2rem] p-6 shadow-sm border border-rose-100 hover:-translate-y-1 transition-transform cursor-pointer flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-1.5 bg-rose-100 text-rose-600 rounded-full px-4 py-1.5 text-xs font-bold tracking-widest border border-rose-200 shadow-sm">
                <AlertCircle size={14} /> 締切アラート
              </div>
              {stats.nearDeadlines.length > 0 ? (
                 <div className="text-xs font-bold text-white bg-rose-500 px-3 py-1.5 rounded-full shadow-sm">
                   {stats.nearDeadlines.length}件の新規
                 </div>
              ) : (
                 <div className="text-xs font-bold text-rose-400 bg-white px-3 py-1.5 rounded-full shadow-sm border border-rose-100">
                   0件の新規
                 </div>
              )}
            </div>

            <div>
              <p className="text-xs font-bold text-slate-800 mb-1 tracking-widest">締切間近 (48時間以内)</p>
              <div className="flex items-baseline gap-1">
                <span className="text-6xl font-black text-rose-600 italic tracking-tighter">{stats.nearDeadlines.length}</span>
                <span className="text-sm font-bold text-rose-400">件</span>
              </div>
            </div>
          </div>

        </div>

        {/* --- DYNAMIC AI ANALYSIS (Single Card Mode) --- */}
        {members.length > 0 && (
          <div className="flex-1 flex flex-col min-h-0 bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm relative overflow-hidden">
            
            {/* Left Indigo Accent Line */}
            <div className="absolute left-0 top-10 bottom-10 w-2.5 bg-indigo-600 rounded-r-xl"></div>

            {/* Card Header */}
            <div className="flex items-center gap-4 mb-6 pl-4 shrink-0">
              <div className="bg-indigo-50 text-indigo-600 p-3.5 rounded-2xl">
                <Sparkles size={24} />
              </div>
              <div className="flex flex-col">
                <h3 className="font-black text-slate-800 text-sm tracking-tight">AIインテリジェンス</h3>
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-0.5">分析</p>
              </div>
            </div>

            {(() => {
              const currentMember = members[currentAiIndex];
              const analysis = getUserAnalysis(currentMember);
              
              if (!analysis) return null;

              return (
                // Adding a key forces React to replay the fade-in animation when the member changes!
                <div className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-right-4 duration-300" key={currentMember.id}>
                  
                  {/* Black Status Badge */}
                  <div className="mb-5 pl-4 shrink-0">
                    <span className="bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-sm shadow-sm">
                      {analysis.tag}
                    </span>
                  </div>

                  {/* Main Title */}
                  <h2 className="text-[22px] font-black text-slate-900 tracking-tight leading-snug mb-6 pl-4 shrink-0">
                    {analysis.title}
                  </h2>

                  {/* Grey Content Box with Arrows */}
                  <div className="bg-slate-50 p-6 rounded-[1.5rem] flex-1 flex flex-col justify-between border border-slate-100 ml-4 min-h-0">
                    <div className="overflow-y-auto custom-scrollbar pr-2">
                      <p className="text-sm font-medium text-slate-600 italic leading-relaxed">
                        {analysis.text}
                      </p>
                    </div>

                    {/* Navigation Arrows inside the box */}
                    <div className="flex justify-end gap-3 mt-4 pt-2 shrink-0">
                      <button 
                        onClick={handlePrevAi} 
                        className="w-11 h-11 flex items-center justify-center rounded-[1rem] bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 shadow-sm transition-all hover:-translate-x-0.5"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button 
                        onClick={handleNextAi} 
                        className="w-11 h-11 flex items-center justify-center rounded-[1rem] bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 shadow-sm transition-all hover:translate-x-0.5"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })()}
          </div>
        )}

      </div>

      {/* DYNAMIC CURVED MODAL */}
      {showDeadlineModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={() => setShowDeadlineModal(false)} />
          
          <div 
            style={{ borderRadius: '60px' }} 
            className="bg-white w-full max-w-xl shadow-2xl relative z-10 animate-in zoom-in-95 duration-300 flex flex-col max-h-[80vh] border border-white/20 overflow-hidden"
          >
            <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-rose-50/20">
              <div className="flex items-center gap-4">
                <div style={{ borderRadius: '18px' }} className="p-3 bg-rose-600 text-white shadow-lg shadow-rose-200">
                  <Clock size={22}/>
                </div>
                <div className="flex flex-col">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">Urgent Deadlines</h2>
                  <p className="text-[9px] font-black text-rose-600 uppercase tracking-[0.2em] mt-1.5">Action within 48h</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDeadlineModal(false)} 
                className="p-2.5 bg-white border border-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-full transition-all shadow-sm"
              >
                <X size={20}/>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-4 custom-scrollbar">
              {stats.nearDeadlines.length > 0 ? (
                stats.nearDeadlines.map((p: any) => (
                  <div 
                    key={p.id} 
                    style={{ borderRadius: '30px' }}
                    className="group p-5 bg-slate-50/50 border border-slate-100 flex items-center justify-between hover:bg-white hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex items-center gap-4">
                      <div style={{ borderRadius: '14px' }} className="w-12 h-12 bg-white flex items-center justify-center shadow-sm text-slate-400 group-hover:text-rose-600 transition-all">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-md tracking-tight">{p.name}</h4>
                        <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mt-0.5">Ends: {new Date(p.endDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => router.push(`/admin/projects/${p.id}`)}
                      className="p-3.5 bg-white text-slate-400 rounded-xl hover:text-white hover:bg-indigo-600 shadow-sm transition-all"
                    >
                      <ExternalLink size={18} />
                    </button>
                  </div>
                ))
              ) : (
                <div 
                   style={{ borderRadius: '40px' }}
                   className="text-center py-20 bg-slate-50/50 border-2 border-dashed border-slate-100"
                >
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