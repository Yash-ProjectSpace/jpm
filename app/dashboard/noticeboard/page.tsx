'use client';

import React, { useState, useEffect } from 'react';
import { 
  Megaphone, Briefcase, Calendar, Plus, 
  ChevronRight, PartyPopper, 
  X, Loader2, Building2, Rocket, Trash2, User
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
        alert("投稿に失敗しました (Failed to post)");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("この投稿を削除しますか？ (Delete this post?)")) return;
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
      case 'PROJECT': return { icon: <Rocket className="text-fuchsia-500" size={18} />, bg: 'bg-fuchsia-100 text-fuchsia-700', label: 'PROJECT' };
      case 'EVENT': return { icon: <PartyPopper className="text-amber-500" size={18} />, bg: 'bg-amber-100 text-amber-700', label: 'EVENT' };
      default: return { icon: <Building2 className="text-indigo-500" size={18} />, bg: 'bg-indigo-100 text-indigo-700', label: 'COMPANY' };
    }
  };

  // Helper to get unread count for a specific category
  const getUnreadCount = (category: NoticeCategory) => {
    return notices.filter(n => n.category === category && !readNoticeIds.has(n.id)).length;
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen relative text-slate-900">
      {/* HEADER */}
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

      {/* TABS WITH BLACK TEXT AND SIMPLE NOTIFICATION COUNT */}
      <div className="flex gap-4 mb-8">
        {[
          { id: 'COMPANY', label: '企業情報', icon: <Megaphone size={16} /> },
          { id: 'PROJECT', label: 'プロジェクト', icon: <Briefcase size={16} /> },
          { id: 'EVENT', label: 'イベント', icon: <Calendar size={16} /> },
        ].map((tab) => {
          const unreadCount = getUnreadCount(tab.id as NoticeCategory);
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as NoticeCategory)}
              className={`relative flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all
                ${activeTab === tab.id 
                  ? 'bg-white text-black shadow-md border-2 border-black' 
                  : 'bg-white text-black border border-slate-200 hover:bg-slate-100 shadow-sm'}`}
            >
              {tab.icon}
              <span>
                {tab.label} {unreadCount > 0 ? `(${unreadCount})` : ''}
              </span>
            </button>
          )
        })}
      </div>

      {/* NEW GRID LAYOUT */}
      {isLoading ? (
        <div className="flex justify-center p-20"><Loader2 className="animate-spin text-slate-300" size={32} /></div>
      ) : filteredNotices.length === 0 ? (
        <div className="bg-white rounded-3xl p-20 border border-dashed border-slate-200 text-center">
          <p className="text-slate-400 font-bold text-sm">現在、表示できる通知はありません。</p>
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
                className={`bg-white rounded-3xl p-6 border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col h-64 cursor-pointer relative ${
                  isUnread ? 'border-indigo-200 shadow-indigo-100/50' : 'border-slate-100'
                }`}
              >
                {/* UNREAD DOT INDICATOR */}
                {isUnread && (
                  <div className="absolute top-6 right-6 w-3 h-3 bg-rose-500 rounded-full animate-pulse shadow-sm shadow-rose-200" title="New Notice"></div>
                )}

                {/* Card Header */}
                <div className="flex items-center justify-between mb-4 pr-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors shrink-0">
                      {style.icon}
                    </div>
                    <div>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter ${style.bg}`}>
                        {style.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Title & Content Preview */}
                <div className="flex-1 flex flex-col min-h-0">
                  <h3 className={`text-lg font-black line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors pr-2 ${isUnread ? 'text-slate-900' : 'text-slate-700'}`}>
                    {notice.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                    {notice.content}
                  </p>
                </div>

                {/* Card Footer */}
                <div className="pt-4 mt-auto border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400">
                      {new Date(notice.createdAt).toLocaleDateString('ja-JP')}
                    </span>
                    <span className="text-[10px] font-bold text-slate-300">|</span>
                    <span className="text-[10px] font-bold text-slate-400">
                      by {notice.author?.name || 'Admin'}
                    </span>
                  </div>
                  
                  <span className="text-[10px] font-black text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                    詳細を見る <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* READING MODAL (Centered, Beautiful Curved UI, Z-Index 9999 to cover sidebar) */}
      {selectedNotice && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 sm:p-6">
          {/* rounded-3xl and overflow-hidden ensures edges are always beautifully curved */}
          <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden relative">
            
            {/* Modal Top Decoration Line */}
            <div className={`h-2 w-full ${getCategoryStyle(selectedNotice.category).bg.split(' ')[0]}`} />

            {/* Modal Header */}
            <div className="p-8 sm:p-10 pb-6 flex justify-between items-start shrink-0 bg-white">
              <div className="flex-1 pr-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${getCategoryStyle(selectedNotice.category).bg}`}>
                    {selectedNotice.category}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">
                    {new Date(selectedNotice.createdAt).toLocaleDateString('ja-JP')}
                  </span>
                </div>
                <h2 className="text-3xl font-black text-slate-900 leading-tight">
                  {selectedNotice.title}
                </h2>
              </div>

              <button 
                onClick={() => setSelectedNotice(null)} 
                className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all shrink-0 active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            {/* Author Badge */}
            <div className="px-8 sm:px-10 mb-6 bg-white">
               <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-100 rounded-2xl w-fit">
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <User size={12} className="text-slate-400" />
                  </div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest pr-2">
                    BY {selectedNotice.author?.name || 'ADMIN'}
                  </p>
               </div>
            </div>

            {/* Modal Content Body (Scrollable) */}
            <div className="px-8 sm:px-10 pb-10 overflow-y-auto flex-1 custom-scrollbar bg-white">
              <div className="text-[15px] text-slate-600 whitespace-pre-wrap leading-[1.8] font-medium">
                {selectedNotice.content}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-8 border-t border-slate-50 bg-slate-50/50 flex justify-between items-center shrink-0">
              {isManager ? (
                <button 
                  onClick={() => handleDelete(selectedNotice.id)}
                  className="flex items-center gap-2 text-slate-400 hover:text-rose-600 transition-colors text-[11px] font-black uppercase tracking-widest"
                >
                  <Trash2 size={16} /> 削除する
                </button>
              ) : <div />}
              
              <button 
                onClick={() => setSelectedNotice(null)}
                className="px-8 py-3.5 bg-slate-900 text-white text-xs font-black rounded-2xl hover:bg-slate-800 transition-colors shadow-lg active:scale-95"
              >
                確認しました (Confirmed)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW NOTICE MODAL (Manager only - Floating Right Side) */}
      {showForm && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9998]" onClick={() => setShowForm(false)} />
          <div className="fixed inset-y-4 right-4 w-full max-w-md bg-white z-[9999] shadow-2xl p-8 animate-in slide-in-from-right duration-500 flex flex-col rounded-3xl overflow-hidden">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter">掲示板に投稿</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col min-h-0">
              <div className="shrink-0">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['COMPANY', 'PROJECT', 'EVENT'] as NoticeCategory[]).map((cat) => (
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

              <div className="shrink-0">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Title</label>
                <input 
                  required
                  type="text"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="タイトル (Title)..."
                  value={newNotice.title}
                  onChange={(e) => setNewNotice({...newNotice, title: e.target.value})}
                />
              </div>

              <div className="flex-1 min-h-0 flex flex-col">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Content</label>
                <textarea 
                  required
                  className="w-full flex-1 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                  placeholder="お知らせの内容を入力してください..."
                  value={newNotice.content}
                  onChange={(e) => setNewNotice({...newNotice, content: e.target.value})}
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 shrink-0 shadow-xl disabled:opacity-50 mt-4"
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