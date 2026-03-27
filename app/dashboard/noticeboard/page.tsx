'use client';

import React, { useState, useEffect } from 'react';
import { 
  Megaphone, Briefcase, Calendar, Plus, 
  ChevronRight, PartyPopper, 
  X, Loader2, Building2, Rocket, Trash2, User, Sparkles
} from 'lucide-react';
import { useSession } from "next-auth/react";

type NoticeCategory = 'COMPANY' | 'PROJECT' | 'EVENT';

interface Notice {
  id: string;
  category: NoticeCategory;
  title: string;
  content: string;
  createdAt: string;
  author?: { name: string; department: string };
}

export default function NoticePage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<NoticeCategory>('COMPANY');
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // States for Modals
  const [showForm, setShowForm] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null); 
  
  // Unread Tracking State
  const [readNoticeIds, setReadNoticeIds] = useState<Set<string>>(new Set());

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newNotice, setNewNotice] = useState({
    title: '',
    content: '',
    category: 'COMPANY' as NoticeCategory
  });

  const isManager = session?.user?.role === 'MANAGER';

  // Load Read History from LocalStorage on mount
  useEffect(() => {
    const storedReads = localStorage.getItem('read_notices');
    if (storedReads) {
      setReadNoticeIds(new Set(JSON.parse(storedReads)));
    }
  }, []);

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

  // Handle clicking a notice to read it
  const handleReadNotice = (notice: Notice) => {
    setSelectedNotice(notice);
    
    // If it's not already read, mark it as read
    if (!readNoticeIds.has(notice.id)) {
      const updatedReads = new Set(readNoticeIds).add(notice.id);
      setReadNoticeIds(updatedReads);
      localStorage.setItem('read_notices', JSON.stringify(Array.from(updatedReads)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNotice),
      });
      if (res.ok) {
        setShowForm(false);
        setNewNotice({ title: '', content: '', category: 'COMPANY' });
        fetchNotices();
      } else {
        alert("投稿に失敗しました");
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
      const res = await fetch(`/api/admin/notices?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSelectedNotice(null); 
        fetchNotices();
      }
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const filteredNotices = notices.filter(n => n.category === activeTab);

  const getCategoryStyle = (category: string) => {
    switch(category) {
      case 'PROJECT': return { icon: <Rocket className="text-fuchsia-500" size={18} />, bg: 'bg-fuchsia-100 text-fuchsia-700', border: 'group-hover:border-fuchsia-200', label: 'プロジェクト' };
      case 'EVENT': return { icon: <PartyPopper className="text-amber-500" size={18} />, bg: 'bg-amber-100 text-amber-700', border: 'group-hover:border-amber-200', label: 'イベント' };
      default: return { icon: <Building2 className="text-indigo-500" size={18} />, bg: 'bg-indigo-100 text-indigo-700', border: 'group-hover:border-indigo-200', label: '企業情報' };
    }
  };

  // Helper to get unread count for a specific category
  const getUnreadCount = (category: NoticeCategory) => {
    return notices.filter(n => n.category === category && !readNoticeIds.has(n.id)).length;
  };

  return (
    <div className="p-6 md:p-10 bg-[#f8fafc] min-h-screen relative text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* HEADER: Softened and modernized */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100 text-indigo-600">
              <Megaphone size={24} />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">社内掲示板</h1>
          </div>
          <p className="text-slate-500 text-sm font-bold tracking-wide">社内の最新情報やプロジェクトの更新を確認します。</p>
        </div>

        {isManager && (
          <button 
            onClick={() => setShowForm(true)} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            <Plus size={18} /> 新規投稿
          </button>
        )}
      </div>

      {/* TABS: Upgraded to iOS-style segmented control */}
      <div className="flex mb-10 overflow-x-auto pb-2 custom-scrollbar">
        <div className="inline-flex bg-slate-200/60 p-1.5 rounded-2xl gap-1">
          {[
            { id: 'COMPANY', label: '企業情報', icon: <Building2 size={16} /> },
            { id: 'PROJECT', label: 'プロジェクト', icon: <Briefcase size={16} /> },
            { id: 'EVENT', label: 'イベント', icon: <Calendar size={16} /> },
          ].map((tab) => {
            const unreadCount = getUnreadCount(tab.id as NoticeCategory);
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as NoticeCategory)}
                className={`relative flex items-center gap-2.5 px-6 py-2.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-300
                  ${isActive 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                
                {/* Beautiful pill badge for unread count */}
                {unreadCount > 0 && (
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-rose-500 text-white shadow-sm'}`}>
                    {unreadCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* NOTICES GRID */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 opacity-50">
          <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
          <p className="text-xs font-black tracking-widest uppercase text-slate-500">読み込み中...</p>
        </div>
      ) : filteredNotices.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] py-24 px-6 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-300">
            <Sparkles size={32} />
          </div>
          <h3 className="text-xl font-black text-slate-700 mb-2">現在、表示できる通知はありません</h3>
          <p className="text-slate-400 font-medium text-sm">新しい情報が投稿されるまでお待ちください。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotices.map((notice) => {
            const style = getCategoryStyle(notice.category);
            const isUnread = !readNoticeIds.has(notice.id);

            return (
              <div 
                key={notice.id}
                onClick={() => handleReadNotice(notice)}
                className={`bg-white rounded-[2rem] p-7 border transition-all duration-300 cursor-pointer flex flex-col min-h-[280px] group
                  hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1.5 ${style.border}
                  ${isUnread ? 'border-indigo-100 shadow-sm bg-indigo-50/10' : 'border-slate-100'}
                `}
              >
                {/* UNREAD DOT INDICATOR */}
                {isUnread && (
                  <div className="absolute top-6 right-6 w-3 h-3 bg-rose-500 rounded-full animate-pulse shadow-sm shadow-rose-200" title="新着通知"></div>
                )}

                {/* Card Header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${style.bg} bg-opacity-50`}>
                      {style.icon}
                    </div>
                    <div className="flex flex-col items-start gap-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${style.bg}`}>
                          {style.label}
                        </span>
                        {isUnread && (
                          <span className="flex items-center gap-1 text-[9px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md uppercase tracking-widest animate-pulse">
                            新着
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex-1 flex flex-col min-h-0 mb-4">
                  <h3 className={`text-lg font-black line-clamp-2 mb-3 leading-snug group-hover:text-indigo-600 transition-colors pr-2 ${isUnread ? 'text-slate-900' : 'text-slate-700'}`}>
                    {notice.title}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed font-medium">
                    {notice.content}
                  </p>
                </div>

                {/* Card Footer */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                      <User size={12} className="text-slate-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 leading-none mb-0.5">
                        {notice.author?.name || '管理者'}
                      </span>
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-wider">
                        {new Date(notice.createdAt).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    <ChevronRight size={16} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* READING MODAL: Elegant article reader style */}
      {selectedNotice && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setSelectedNotice(null)} />
          
          <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-[2.5rem] shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden relative z-10">
            
            {/* Modal Top Decoration Line */}
            <div className={`h-2.5 w-full ${getCategoryStyle(selectedNotice.category).bg.split(' ')[0]} bg-opacity-100`} />

            {/* Modal Header */}
            <div className="px-8 sm:px-12 pt-10 pb-6 flex justify-between items-start shrink-0 bg-white">
              <div className="flex-1 pr-6">
                <div className="flex items-center gap-3 mb-5">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-md uppercase tracking-widest ${getCategoryStyle(selectedNotice.category).bg}`}>
                    {getCategoryStyle(selectedNotice.category).label}
                  </span>
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                    <Calendar size={14} /> {new Date(selectedNotice.createdAt).toLocaleDateString('ja-JP')}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                  {selectedNotice.title}
                </h2>
              </div>

              <button 
                onClick={() => setSelectedNotice(null)} 
                className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all shrink-0 active:scale-95 border border-slate-100 shadow-sm"
              >
                <X size={20} />
              </button>
            </div>

            {/* Author Badge */}
            <div className="px-8 sm:px-12 mb-6 bg-white">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shadow-inner text-slate-500">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900">
                      {selectedNotice.author?.name || '管理者'}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      投稿者
                    </p>
                  </div>
               </div>
            </div>

            {/* Modal Content Body */}
            <div className="px-8 sm:px-12 pb-10 overflow-y-auto flex-1 custom-scrollbar bg-white">
              <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="text-[15px] text-slate-700 whitespace-pre-wrap leading-[1.9] font-medium">
                  {selectedNotice.content}
                </div>
              </div>
            </div>

            {/* Modal Footer - Only show if manager, otherwise no footer to match requested clean UI */}
            {isManager && (
              <div className="px-8 sm:px-12 py-6 border-t border-slate-100 bg-white flex justify-end items-center shrink-0">
                <button 
                  onClick={() => handleDelete(selectedNotice.id)}
                  className="flex items-center gap-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 px-4 py-2 rounded-xl transition-colors text-xs font-black uppercase tracking-widest"
                >
                  <Trash2 size={16} /> 削除する
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE NEW NOTICE MODAL (Manager slide-out) */}
      {showForm && (
        <>
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[9998] transition-opacity" onClick={() => setShowForm(false)} />
          <div className="fixed inset-y-4 right-4 w-full max-w-lg bg-white z-[9999] shadow-2xl p-8 animate-in slide-in-from-right duration-300 flex flex-col rounded-[2.5rem] overflow-hidden border border-slate-100">
            <div className="flex justify-between items-center mb-8 shrink-0">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">掲示板に投稿</h2>
                <p className="text-xs font-bold text-slate-400 mt-1">チーム全体に新しい情報を共有します。</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all border border-slate-100">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col min-h-0">
              <div className="shrink-0">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">カテゴリ</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['COMPANY', 'PROJECT', 'EVENT'] as NoticeCategory[]).map((cat) => {
                    const label = cat === 'COMPANY' ? '企業情報' : cat === 'PROJECT' ? 'プロジェクト' : 'イベント';
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setNewNotice({...newNotice, category: cat})}
                        className={`py-3 rounded-xl text-xs font-black border transition-all active:scale-95 ${newNotice.category === cat ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-indigo-300'}`}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="shrink-0">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">タイトル</label>
                <input 
                  required
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  placeholder="わかりやすいタイトルを入力..."
                  value={newNotice.title}
                  onChange={(e) => setNewNotice({...newNotice, title: e.target.value})}
                />
              </div>

              <div className="flex-1 min-h-0 flex flex-col">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">内容</label>
                <textarea 
                  required
                  className="w-full flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none custom-scrollbar"
                  placeholder="お知らせの詳細を入力してください..."
                  value={newNotice.content}
                  onChange={(e) => setNewNotice({...newNotice, content: e.target.value})}
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-indigo-200 disabled:opacity-50 mt-4 active:scale-[0.98]"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "投稿する"}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}