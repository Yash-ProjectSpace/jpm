'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, Sparkles, Mail, TrendingUp, ShieldCheck, Plus, Loader2 
} from 'lucide-react';
import { useSession } from "next-auth/react"; // Added for Role Check

const teamMembers = [
  // MALES (White skin, No beard, Blazer/Shirt)
  { id: '1', name: '内木敦', role: 'MANAGER', email: 'atsuki@jmc.com', perf: '+15%', 
    avatar: 'https://api.dicebear.com/9.x/avataaars/png?seed=Felix&skinColor=ffdbb4&clothing=blazerAndShirt&facialHairProbability=0' },
  { id: '3', name: 'オム', role: 'EMPLOYEE', email: 'om@jmc.com', perf: '+5%', 
    avatar: 'https://api.dicebear.com/9.x/avataaars/png?seed=Peter&skinColor=ffdbb4&clothing=blazerAndShirt&facialHairProbability=0' },
  { id: '4', name: 'シャラット', role: 'EMPLOYEE', email: 'sharat@jmc.com', perf: '+22%', 
    avatar: 'https://api.dicebear.com/9.x/avataaars/png?seed=Liam&skinColor=ffdbb4&clothing=blazerAndShirt&facialHairProbability=0' },
  { id: '6', name: 'リダイ', role: 'EMPLOYEE', email: 'ridai@jmc.com', perf: '+9%', 
    avatar: 'https://api.dicebear.com/9.x/avataaars/png?seed=Jack&skinColor=ffdbb4&clothing=blazerAndShirt&facialHairProbability=0' },
  { id: '7', name: 'ヤシュワン', role: 'EMPLOYEE', email: 'yashwan@jmc.com', perf: '+18%', 
    avatar: 'https://api.dicebear.com/9.x/avataaars/png?seed=Mason&skinColor=ffdbb4&clothing=blazerAndShirt&facialHairProbability=0' },
  
  // FEMALES (White skin, Blazer)
  { id: '2', name: '藤原志帆', role: 'EMPLOYEE', email: 'shiho@jmc.com', perf: '+8%', 
    avatar: 'https://api.dicebear.com/9.x/avataaars/png?seed=Ava&skinColor=ffdbb4&clothing=blazerAndSweater' },
  { id: '5', name: 'シユラブアニ', role: 'EMPLOYEE', email: 'shravani@jmc.com', perf: '+12%', 
    avatar: 'https://api.dicebear.com/9.x/avataaars/png?seed=Emma&skinColor=ffdbb4&clothing=blazerAndSweater' },
];

export default function MembersPage() {
  const { data: session } = useSession(); // Get Session for role check
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState("");

  // --- New States for Add Member ---
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'EMPLOYEE' });

  const isManager = session?.user?.role === 'MANAGER';

  useEffect(() => {
    if (selectedMember) {
      setIsAiLoading(true);
      setAiAnalysis("");
      
      setTimeout(() => {
        const insights = [
          `${selectedMember.name}さんは現在、担当するプロジェクトにおいて非常に高い品質を維持しています。`,
          `特に今週のパフォーマンスは${selectedMember.perf}向上しており、チーム全体のモチベーション向上に貢献しています。`,
          `今後の成長提案: リーダーシップを発揮できる新しいタスクや、クライアントとの直接的なコミュニケーションを任せる時期に来ています。`
        ];
        setAiAnalysis(insights.join(" "));
        setIsAiLoading(false);
      }, 1500);
    }
  }, [selectedMember]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowAddForm(false);
        setFormData({ name: '', email: '', password: '', role: 'EMPLOYEE' });
        alert("Member added successfully!");
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sortedMembers = [...teamMembers].sort((a, b) => Number(a.id) - Number(b.id));

  return (
    <div className="p-8 bg-slate-50 min-h-screen relative">
      {/* Header */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            チームメンバー <span className="text-indigo-600">({teamMembers.length})</span>
          </h1>
          <p className="text-slate-400 mt-1 text-[10px] font-black uppercase tracking-[0.3em]">JMC Team Directory</p>
        </div>

        {/* Manager-only Add Button */}
        {isManager && (
          <button 
            onClick={() => setShowAddForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-indigo-200 active:scale-95"
          >
            <Plus size={18} /> Add Member
          </button>
        )}
      </div>

      {/* Grid of Members */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedMembers.map((member) => (
          <div 
            key={member.id} 
            onClick={() => setSelectedMember(member)}
            className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col items-center text-center"
          >
            <div className="w-24 h-24 rounded-full bg-slate-50 mb-4 overflow-hidden border-4 border-slate-50 shadow-inner group-hover:scale-105 transition-transform relative">
              <img 
                src={member.avatar} 
                alt={member.name} 
                className="w-full h-full object-cover"
                onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=f1f5f9&color=6366f1&bold=true`;
                }}
              />
              {member.role === 'MANAGER' && (
                <div className="absolute bottom-0 right-0 bg-indigo-600 text-white p-1.5 rounded-full border-2 border-white shadow-sm">
                  <ShieldCheck size={14} />
                </div>
              )}
            </div>
            
            <h3 className="text-lg font-black text-slate-900 mb-1">{member.name}</h3>
            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-3
              ${member.role === 'MANAGER' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-500'}`}>
              {member.role}
            </span>
            <p className="text-xs font-bold text-slate-400 flex items-center justify-center gap-1.5">
              <Mail size={12} /> {member.email}
            </p>
          </div>
        ))}
      </div>

      {/* --- ADD MEMBER SLIDE-OVER --- */}
      {showAddForm && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity" onClick={() => setShowAddForm(false)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white z-[60] shadow-2xl p-10 animate-in slide-in-from-right duration-500 flex flex-col">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter">新規メンバー登録</h2>
              <button onClick={() => setShowAddForm(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Name</label>
                <input 
                  type="text" required
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="例: 山田 太郎"
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Email Address</label>
                <input 
                  type="email" required
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="name@jmc.com"
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Temporary Password</label>
                <input 
                  type="password" required
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="••••••••"
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Access Role</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="EMPLOYEE">Employee (Standard)</option>
                  <option value="MANAGER">Manager (Admin Access)</option>
                </select>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 mt-10 shadow-xl"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Create Account"}
              </button>
            </form>
          </div>
        </>
      )}

      {/* --- CENTRIC MODAL CARD --- */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
            onClick={() => setSelectedMember(null)}
          ></div>

          <div 
            className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 fade-in duration-300"
            onClick={(e) => e.stopPropagation()} 
          >
            <button 
              onClick={() => setSelectedMember(null)}
              className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-rose-50 hover:text-rose-600 text-slate-400 transition-colors z-20"
            >
              <X size={20} />
            </button>

            <div className="p-10 flex flex-col items-center">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-28 h-28 rounded-full bg-slate-50 overflow-hidden mb-4 border-4 border-white shadow-lg relative">
                  <img 
                    src={selectedMember.avatar} 
                    alt={selectedMember.name} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">{selectedMember.name}</h2>
                <div className="flex items-center gap-3">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest
                    ${selectedMember.role === 'MANAGER' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                    {selectedMember.role}
                  </span>
                  <span className="text-slate-400 text-sm font-medium flex items-center gap-1.5">
                    <Mail size={14} /> {selectedMember.email}
                  </span>
                </div>
              </div>

              <div className="w-full bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2rem] p-8 shadow-inner text-white relative overflow-hidden">
                <div className="absolute -right-6 -top-6 text-white/5 transform rotate-12">
                  <Sparkles size={140} />
                </div>
                
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <div className="flex items-center gap-2 font-black text-[10px] tracking-[0.2em] text-indigo-300">
                    <Sparkles size={16} className={isAiLoading ? "animate-spin" : ""} />
                    <span>GEMINI AI PERFORMANCE REVIEW</span>
                  </div>
                  <div className="bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 rounded-xl flex items-center gap-1.5 text-indigo-200 text-[10px] font-black uppercase tracking-widest">
                    <TrendingUp size={12} />
                    Growth {selectedMember.perf}
                  </div>
                </div>

                <div className="relative z-10 min-h-[120px] flex items-center">
                  {isAiLoading ? (
                    <div className="w-full flex flex-col gap-3 py-2">
                      <div className="w-full h-3 bg-white/10 rounded-full animate-pulse"></div>
                      <div className="w-5/6 h-3 bg-white/10 rounded-full animate-pulse"></div>
                      <div className="w-4/6 h-3 bg-white/10 rounded-full animate-pulse"></div>
                    </div>
                  ) : (
                    <p className="text-[15px] font-bold leading-loose text-indigo-50 animate-in fade-in slide-in-from-bottom-2 duration-700">
                      {aiAnalysis}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}