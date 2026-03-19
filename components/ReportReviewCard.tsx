'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, MessageSquare, Loader2 } from 'lucide-react';

export default function ReportReviewCard({ report }: { report: any }) {
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleReview = async (status: 'APPROVED' | 'REVISION_REQUESTED') => {
    if (status === 'REVISION_REQUESTED' && !feedback.trim()) {
      alert("修正を依頼する場合は、フィードバック（理由）を入力してください。(Please provide feedback for revisions)");
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
        router.refresh(); // Instantly removes the card from the pending list!
      } else {
        alert("エラーが発生しました。(Error occurred)");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
      {/* Header Info */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-black text-lg text-slate-900">{report.task.title}</h3>
          <p className="text-xs font-bold text-slate-400 mt-1">
            プロジェクト: <span className="text-indigo-600">{report.task.project.name}</span>
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black px-2 py-1 rounded-md bg-amber-100 text-amber-700 tracking-wider">
            {report.status}
          </span>
          <p className="text-xs text-slate-400 font-bold mt-2">By: {report.author.name}</p>
        </div>
      </div>

      {/* The Report Content */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 flex-1">
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
          <MessageSquare size={14} /> 作業報告 (Report)
        </p>
        <p className="text-sm text-slate-700 whitespace-pre-wrap">{report.content}</p>
      </div>

      {/* Feedback & Actions */}
      <div className="mt-auto space-y-3">
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="フィードバックを入力... (Optional for Approval, Required for Revision)"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none h-20"
        />
        
        <div className="flex gap-3">
          <button 
            onClick={() => handleReview('REVISION_REQUESTED')}
            disabled={isSubmitting}
            className="flex-1 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <XCircle size={18} />}
            修正依頼 (Revise)
          </button>
          
          <button 
            onClick={() => handleReview('APPROVED')}
            disabled={isSubmitting}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
            承認 (Approve)
          </button>
        </div>
      </div>
    </div>
  );
}