'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react"; // Re-added for security bouncer
import { 
  ShieldCheck, Users, Briefcase, Clock, Loader2, 
  AlertCircle, X, ExternalLink, Calendar
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession(); // Get session state
  const [loading, setLoading] = useState(true);
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  
  const [members, setMembers] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    inProgress: 0,
    finished: 0,
    nearDeadlines: [] as any[]
  });

  // 1. THE BOUNCER: Kicks out regular employees
  useEffect(() => {
    if (status === 'authenticated' && (session?.user as any)?.role !== 'MANAGER') {
      router.push('/dashboard');
    }
  }, [session, status, router]);

  // 2. REAL-TIME DATA FETCHING
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        // ADDED: { cache: 'no-store' } forces Next.js to get fresh data
// 🚀 THE TIMESTAMP TRICK: Forces a fresh pull by making the URL unique every time
const timestamp = new Date().getTime();
const [memberRes, projectRes] = await Promise.all([
  fetch(`/api/members?t=${timestamp}`, { cache: 'no-store' }),
  fetch(`/api/projects?t=${timestamp}`, { cache: 'no-store' })
]);
        
        if (memberRes.ok && projectRes.ok) {
          const mData = await memberRes.json();
          const pData = await projectRes.json();

          setMembers(mData);

          const twoDaysFromNow = new Date();
          twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

          const near = pData.filter((p: any) => {
            if (!p.endDate) return false;
            const dueDate = new Date(p.endDate);
            return dueDate <= twoDaysFromNow && p.status !== 'COMPLETED';
          });

          setStats({
            totalProjects: pData.length,
            // Added Japanese statuses just in case they are saving that way
            inProgress: pData.filter((p: any) => p.status === 'IN_PROGRESS' || p.status === 'STARTED' || p.status === '進行中').length,
            finished: pData.filter((p: any) => p.status === 'COMPLETED' || p.status === '完了').length,
            nearDeadlines: near
          });
        }
      } catch (error) {
        console.error("Dashboard Load Error:", error);
      } finally {
        setLoading(false); // Only triggers on the first load, won't flash during polling
      }
    };

    // Run immediately on mount
    fetchAdminData();

    // ADDED: Polling - Silently run fetchAdminData every 10 seconds
    const intervalId = setInterval(fetchAdminData, 10000);

    // Clean up the interval when leaving the page
    return () => clearInterval(intervalId);
  }, []);

  // Prevent UI flashing before security redirect
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
    <div className="p-8 max-w-[1400px] mx-auto w-full relative">
      
      {/* Header */}
      <header className="mb-10 mt-4">
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div onClick={() => router.push('/admin/projects')} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group">
          <div className="bg-blue-50 text-blue-600 p-4 rounded-3xl group-hover:bg-blue-600 group-hover:text-white transition-colors"><Briefcase size={28} /></div>
          <div className="flex-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">すべてのプロジェクト</p>
            <div className="flex items-end gap-4">
              <p className="text-3xl font-black text-slate-900 leading-none">{stats.totalProjects}</p>
              <div className="border-l border-slate-100 pl-4 space-y-0.5">
                <p className="text-[9px] font-bold text-slate-500 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> 進行中: {stats.inProgress}</p>
                <p className="text-[9px] font-bold text-slate-500 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> 完了: {stats.finished}</p>
              </div>
            </div>
          </div>
        </div>

        <div onClick={() => router.push('/admin/members')} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group">
          <div className="bg-indigo-50 text-indigo-600 p-4 rounded-3xl group-hover:bg-indigo-600 group-hover:text-white transition-colors"><Users size={28} /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">メンバー</p>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{members.length}</p>
          </div>
        </div>

        <div onClick={() => setShowDeadlineModal(true)} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group">
          <div className="bg-rose-50 text-rose-600 p-4 rounded-3xl group-hover:bg-rose-600 group-hover:text-white transition-colors"><Clock size={28} /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">締切間近</p>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{stats.nearDeadlines.length}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl">
        <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm min-h-[300px]">
          <h3 className="font-black text-slate-900 mb-8 uppercase tracking-widest text-xs flex items-center gap-2">
            <ShieldCheck size={16} className="text-amber-500" /> 承認保留中
          </h3>
          <div className="flex flex-col items-center justify-center py-10 opacity-60">
            <AlertCircle size={40} className="text-slate-300 mb-3" />
            <p className="text-slate-400 text-sm font-medium italic">現在、承認待ちのタスクはありません。</p>
          </div>
        </div>
      </div>

      {/* DYNAMIC CURVED MODAL - ALIGNMENT FIXED */}
      {showDeadlineModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={() => setShowDeadlineModal(false)} />
          
          <div 
            style={{ borderRadius: '60px' }} 
            className="bg-white w-full max-w-xl shadow-2xl relative z-10 animate-in zoom-in-95 duration-300 flex flex-col max-h-[80vh] border border-white/20 overflow-hidden"
          >
            {/* Header: More compact for alignment */}
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
            
            {/* List Body */}
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