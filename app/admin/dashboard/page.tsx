'use client';

import React from 'react';
import { ShieldCheck, BarChart3, Users, Briefcase, AlertTriangle } from 'lucide-react';

export default function AdminDashboard() {
  return (
    // THE FIX: Removed ml-72. It now just uses 'p-8 mx-auto w-full' to center itself beautifully INSIDE the layout's safe zone!
    <div className="p-8 max-w-[1600px] mx-auto w-full">
      
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
      {/* Admin Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <AdminStatCard icon={<Briefcase />} label="全プロジェクト" value="24" color="bg-blue-500" />
        <AdminStatCard icon={<Users />} label="全メンバー" value="12" color="bg-emerald-500" />
        <AdminStatCard icon={<AlertTriangle />} label="遅延リスク" value="3" color="bg-rose-500" />
        <AdminStatCard icon={<BarChart3 />} label="総稼働率" value="88%" color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Team Workload Section */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm min-h-[400px]">
          <h3 className="font-black text-slate-900 mb-6 uppercase tracking-widest text-xs flex items-center gap-2">
            <Users size={16} className="text-indigo-500" />
            チームの負荷状況
          </h3>
          <div className="flex h-full items-center justify-center pb-10">
            <p className="text-slate-400 text-sm font-medium italic">ワークロード・ヒートマップをここに読み込み中...</p>
          </div>
        </div>

        {/* Recent Approvals Queue (Where your new Report Feedback will go!) */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl min-h-[400px]">
          <h3 className="font-black text-indigo-300 mb-6 uppercase tracking-widest text-xs flex items-center gap-2">
            <ShieldCheck size={16} />
            承認待ち
          </h3>
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 border-dashed text-center mt-20">
             <p className="text-slate-400 text-sm font-medium">現在、承認待ちのタスクはありません。</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Small helper component for Admin Stats
function AdminStatCard({ icon, label, value, color }: any) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
      <div className={`${color} p-4 rounded-2xl text-white shadow-lg`}>
        {React.cloneElement(icon, { size: 28 })}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
      </div>
    </div>
  );
}