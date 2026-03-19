'use client';

import React, { useState } from 'react';
import { Send, ClipboardCheck, Loader2 } from 'lucide-react';

export default function DailyReportForm() {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/daily-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        setStatus('success');
        setContent('');
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
          <ClipboardCheck size={24} />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900">日報作成 (Daily Report)</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Submit your daily work summary</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="今日は何を達成しましたか？ 明日の予定は？ (What did you achieve today? Plans for tomorrow?)"
          className="w-full h-40 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none"
        />

        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <>
              <Send size={18} />
              報告を送信する (Submit Report)
            </>
          )}
        </button>

        {status === 'success' && (
          <p className="text-center text-emerald-600 text-xs font-bold animate-bounce mt-2">
            ✅ 報告が送信されました！ (Report sent!)
          </p>
        )}
      </form>
    </div>
  );
}