'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Trash2, Clock, Tag, 
  Search, Loader2, AlertCircle, Megaphone 
} from 'lucide-react';
import Link from 'next/link';

export default function NoticeArchivePage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // カテゴリーの日本語マッピング (Category Translation Map)
  const categoryMap: Record<string, string> = {
    'COMPANY': '企業情報',
    'EVENT': 'イベント',
    'PROJECT': 'プロジェクト',
    'OTHER': 'その他'
  };

  const fetchNotices = async () => {
    try {
      const res = await fetch('/api/admin/notices');
      if (res.ok) {
        const data = await res.json();
        setNotices(data);
      }
    } catch (error) {
      console.error("Failed to fetch notices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("このお知らせを完全に削除しますか？ (Delete this notice?)")) return;
    
    try {
      const res = await fetch(`/api/admin/notices?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNotices(notices.filter(n => n.id !== id));
        router.refresh();
      }
    } catch (error) {
      alert("削除に失敗しました");
    }
  };

  const filteredNotices = notices.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-amber-500" size={40} />
    </div>
  );

  return (
    <div className="p-8 max-w-[1200px] mx-auto w-full min-h-screen text-slate-900">
      
      {/* Header Area */}
      <div className="flex items-center gap-6 mb-12">
        <div className="flex items-center gap-4 shrink-0">
          <Link href="/admin/notices" className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-amber-500 transition-all shadow-sm">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tight">お知らせ一覧</h1>
          </div>
        </div>

        {/* Dynamic Search */}
        <div className="relative w-80 group flex items-center">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none z-10">
            <Search className="text-slate-300 group-focus-within:text-amber-500 transition-colors" size={18} />
          </div>
          <input 
            type="text"
            placeholder="タイトルや内容で検索..."
            style={{ paddingLeft: '3.5rem' }}
            className="w-full bg-white border border-slate-200 rounded-2xl py-3 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500 shadow-sm transition-all text-slate-900"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Grid of Cute Cards */}
      {filteredNotices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-40 opacity-30 italic">
          <AlertCircle size={48} className="mb-4" />
          <p>お知らせが見つかりません</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredNotices.map((notice) => (
            <div 
              key={notice.id} 
              className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group relative overflow-hidden"
            >
              {/* Category Badge - UPDATED TO JAPANESE */}
              <div className="flex justify-between items-start mb-6">
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                  notice.category === 'COMPANY' ? 'bg-blue-50 text-blue-500' :
                  notice.category === 'EVENT' ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-500'
                }`}>
                  {categoryMap[notice.category] || notice.category}
                </span>
                <button 
                  onClick={() => handleDelete(notice.id)}
                  className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <h3 className="text-lg font-black text-slate-800 mb-3 leading-tight">{notice.title}</h3>
              <p className="text-xs text-slate-500 line-clamp-4 leading-relaxed flex-1 mb-6 whitespace-pre-wrap">
                {notice.content}
              </p>

              <div className="pt-6 border-t border-slate-50 flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                  <Clock size={12} />
                  {new Date(notice.createdAt).toLocaleDateString('ja-JP')}
                </div>
                {/* Changed text-slate-100 to text-slate-900 for visibility */}
                <Megaphone size={16} className="text-slate-900" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}