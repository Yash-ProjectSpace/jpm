'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  Loader2, 
  Calendar, 
  X, 
  ChevronRight, 
  User 
} from 'lucide-react';

export default function ReportReviewCard({ report }: { report: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleReview = async (status: 'APPROVED' | 'REVISION_REQUESTED') => {
    if (status === 'REVISION_REQUESTED' && !feedback.trim()) {
      alert("修正を依頼する場合は、フィードバックを入力してください。");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/reports/${report.id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, feedback }),
      });

      if (res.ok) {
        setIsOpen(false);
        setFeedback('');
        router.refresh(); 
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- FIX: ステータスに応じた色を返すヘルパー関数を追加 ---
  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'APPROVED': 
        return 'bg-emerald-100 text-emerald-700';
      case 'REVISION_REQUESTED': 
        return 'bg-rose-100 text-rose-700';
      default: 
        return 'bg-amber-100 text-amber-700'; // PENDINGなど
    }
  };

  return (
    <>
      {/* --- PREVIEW CARD --- */}
      <div 
        onClick={() => setIsOpen(true)}
        className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md cursor-pointer transition-all group relative overflow-hidden h-full flex flex-col"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100">
              {report.author.name?.[0]}
            </div>
            <div>
              <p className="text-sm font-black text-slate-800">{report.author.name}</p>
              <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                <Calendar size={10}/> {new Date(report.createdAt).toLocaleDateString('ja-JP')}
              </p>
            </div>
          </div>
          {/* FIX: ヘルパー関数を使って正しい色を適用 */}
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${getStatusStyle(report.status)}`}>
            {report.status}
          </span>
        </div>

        {/* Small Preview Title */}
        <h3 className="font-bold text-sm text-slate-900 mb-2 truncate">
          {report.task?.title || "一般日報 (General Report)"}
        </h3>

        {/* Message Preview */}
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed flex-1">
          {report.content}
        </p>

        <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
           <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
             <MessageSquare size={12}/> {report.comments?.length || 0} Feedback
           </span>
           <div className="text-indigo-600 flex items-center gap-1 text-[10px] font-black uppercase group-hover:translate-x-1 transition-transform">
             詳細を見る <ChevronRight size={14} />
           </div>
        </div>
      </div>

      {/* --- FULL VIEW MODAL --- */}
      {isOpen && (
        <div 
          style={{ zIndex: 9999 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-auto">
            {/* Modal Header */}
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
                  <User size={20}/>
                </div>
                <div>
                  <h3 className="font-black text-slate-800 leading-tight">{report.author.name} の報告詳細</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Daily Report Detail</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
              >
                <X size={20}/>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="mb-8">
                <div className="flex justify-between items-end mb-4">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">報告内容 (Content)</p>
                   {report.task && (
                     <p className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                       Task: {report.task.title}
                     </p>
                   )}
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl text-sm leading-loose text-slate-700 whitespace-pre-wrap border border-slate-100 shadow-inner">
                  {report.content}
                </div>
              </div>

              {/* Feedback History */}
              {report.comments?.length > 0 && (
                <div className="space-y-4 mb-4">
                   <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">フィードバック履歴 (History)</p>
                   {report.comments.map((c: any) => (
                     <div key={c.id} className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl">
                        <div className="flex justify-between mb-1">
                           <p className="text-[9px] font-bold text-emerald-600">{c.author.name}</p>
                           <p className="text-[9px] text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</p>
                        </div>
                        <p className="text-xs text-slate-700">{c.text}</p>
                     </div>
                   ))}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-6 bg-slate-50/50 border-t border-slate-100">
               <textarea 
                  value={feedback} 
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="フィードバックを入力... (修正依頼の場合は必須)" 
                  className="w-full bg-white border border-slate-200 p-4 rounded-2xl text-sm h-24 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 transition-all mb-4 resize-none" 
                />
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleReview('REVISION_REQUESTED')}
                    disabled={isSubmitting}
                    className="flex-1 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                  >
                    <span className="flex items-center justify-center">
                      {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <XCircle size={18} />}
                    </span>
                    修正依頼
                  </button>

                  <button 
                    onClick={() => handleReview('APPROVED')}
                    disabled={isSubmitting}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 active:scale-95"
                  >
                    <span className="flex items-center justify-center">
                      {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                    </span>
                    承認する
                  </button>
                </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}