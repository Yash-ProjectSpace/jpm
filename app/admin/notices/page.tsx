'use client';

import React, { useState } from 'react';
import { Bell, Send, Megaphone, Loader2, LayoutGrid } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminNoticesPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'COMPANY', 
    content: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/admin/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("お知らせを配信しました！ (Notice published successfully!)");
        setFormData({ title: '', category: 'COMPANY', content: '' }); 
        router.refresh();
      } else {
        alert("エラーが発生しました。 (Error publishing notice)");
      }
    } catch (error) {
      console.error(error);
      alert("Network error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col p-8 overflow-hidden text-slate-900">
      
      {/* Header Area */}
      <header className="mb-10 mt-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500 rounded-xl text-white shadow-lg shadow-amber-500/20">
            <Megaphone size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">お知らせ配信</h1>
          </div>
        </div>

        {/* View All Button */}
        <Link 
          href="/admin/notices/archive" 
          className="flex items-center gap-2 bg-white border border-slate-200 px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
        >
          <LayoutGrid size={16} className="text-amber-500" />
          すべて見る 
        </Link>
      </header>

      {/* Main Form Container */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 max-w-[1000px] mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Title Input */}
              <div className="md:col-span-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">
                  タイトル 
                </label>
                <input 
                  required
                  type="text"
                  placeholder="例: 全社キックオフミーティングのお知らせ"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                />
              </div>

              {/* Category Dropdown */}
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">
                  カテゴリー 
                </label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all cursor-pointer font-bold text-slate-700"
                >
                  <option value="COMPANY">🏢 全社 (Company Updates)</option>
                  <option value="PROJECT">🚀 プロジェクト (Project Updates)</option>
                  <option value="EVENT">🎉 イベント (Events)</option>
                </select>
              </div>
            </div>

            {/* Content Textarea */}
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">
                本文 
              </label>
              <textarea 
                required
                placeholder="お知らせの内容を入力してください..."
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                className="w-full h-64 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all resize-none leading-relaxed"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button 
                type="submit"
                disabled={isSubmitting || !formData.title.trim() || !formData.content.trim()}
                className="bg-amber-500 hover:bg-amber-600 text-white font-black py-4 px-10 rounded-2xl shadow-lg shadow-amber-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                掲示板に配信する 
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}