'use client';

import React, { useState, useEffect } from 'react';
import { 
  Megaphone, Briefcase, Calendar, Plus, 
  ChevronRight, ExternalLink, Info, AlertTriangle, PartyPopper,
  X, Loader2 
} from 'lucide-react';
import { useSession } from "next-auth/react";

type NoticeCategory = 'COMPANY' | 'PROJECTS' | 'EVENTS';

interface Notice {
  id: string;
  category: NoticeCategory;
  type: string;
  title: string;
  createdAt: string;
}

export default function NoticePage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<NoticeCategory>('COMPANY');
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newNotice, setNewNotice] = useState({
    title: '',
    type: 'INFO',
    category: 'COMPANY' as NoticeCategory
  });

  const isManager = session?.user?.role === 'MANAGER';

  // --- FIXED: URL pointed to /api/noticeboard ---
  const fetchNotices = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/noticeboard');
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      if (Array.isArray(data)) {
        setNotices(data);
      }
    } catch (error) {
      console.error("Failed to fetch notices:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/noticeboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNotice),
      });
      if (res.ok) {
        setShowForm(false);
        setNewNotice({ title: '', type: 'INFO', category: 'COMPANY' });
        fetchNotices();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("この投稿を削除しますか？")) return;
    try {
      const res = await fetch('/api/noticeboard', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) fetchNotices();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const filteredNotices = notices.filter(n => n.category === activeTab);

  const getIcon = (type: string) => {
    switch(type) {
      case 'URGENT': return <AlertTriangle className="text-rose-500" size={18} />;
      case 'SUCCESS': return <PartyPopper className="text-emerald-500" size={18} />;
      default: return <Info className="text-indigo-500" size={18} />;
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen relative">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">社内掲示板</h1>
          <p className="text-slate-400 mt-1 text-[10px] font-black uppercase tracking-[0.3em]">Company Bulletins & Updates</p>
        </div>
        {isManager && (
          <button 
            onClick={() => setShowForm(true)} 
            className="bg-slate-900 hover:bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl active:scale-95"
          >
            <Plus size={18} /> 新規投稿
          </button>
        )}
      </div>

      <div className="flex gap-4 mb-8">
        {[
          { id: 'COMPANY', label: '企業情報', icon: <Megaphone size={16} /> },
          { id: 'PROJECTS', label: 'プロジェクト', icon: <Briefcase size={16} /> },
          { id: 'EVENTS', label: 'イベント', icon: <Calendar size={16} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as NoticeCategory)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all
              ${activeTab === tab.id 
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' 
                : 'text-slate-400 hover:text-slate-600'}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center p-20"><Loader2 className="animate-spin text-slate-300" size={32} /></div>
        ) : filteredNotices.map((notice) => (
          <div 
            key={notice.id}
            className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                {getIcon(notice.type)}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-[10px] font-black text-slate-400">
                    {new Date(notice.createdAt).toLocaleDateString('ja-JP')}
                  </span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter
                    ${notice.type === 'URGENT' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                    {notice.type}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  {notice.title}
                </h3>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {isManager && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(notice.id);
                  }}
                  className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <X size={18} />
                </button>
              )}
              <ChevronRight size={20} className="text-slate-300" />
            </div>
          </div>
        ))}

        {!isLoading && filteredNotices.length === 0 && (
          <div className="bg-white rounded-[2.5rem] p-20 border border-dashed border-slate-200 text-center">
            <p className="text-slate-400 font-bold text-sm">現在、表示できる通知はありません。</p>
          </div>
        )}
      </div>

      {showForm && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50" onClick={() => setShowForm(false)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white z-[60] shadow-2xl p-10 animate-in slide-in-from-right duration-500 flex flex-col">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter">掲示板に投稿</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['COMPANY', 'PROJECTS', 'EVENTS'] as NoticeCategory[]).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewNotice({...newNotice, category: cat})}
                      className={`py-2 rounded-xl text-[10px] font-black border transition-all ${newNotice.category === cat ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-100 text-slate-400'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Content Title</label>
                <textarea 
                  required
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold h-32 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="お知らせの内容を入力してください..."
                  value={newNotice.title}
                  onChange={(e) => setNewNotice({...newNotice, title: e.target.value})}
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Notice Type</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none appearance-none"
                  value={newNotice.type}
                  onChange={(e) => setNewNotice({...newNotice, type: e.target.value})}
                >
                  <option value="INFO">INFO (通常)</option>
                  <option value="URGENT">URGENT (至急)</option>
                  <option value="SUCCESS">SUCCESS (お祝い)</option>
                </select>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 mt-auto shadow-xl"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Publish Notice"}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}