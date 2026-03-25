'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import Link from "next/link";
import { 
  Sparkles, Send, MessageSquare, Calendar, Loader2 
} from 'lucide-react';

export default function ReportsPage() {
  const { data: session } = useSession();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportText, setReportText] = useState("");
  const [latestReport, setLatestReport] = useState<any>(null);

  const fetchMyLatestReport = async () => {
    try {
      const res = await fetch('/api/reports'); 
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setLatestReport(data[0]); 
      }
    } catch (error) {
      console.error("レポートの取得に失敗しました", error);
    }
  };

  useEffect(() => {
    if (session) fetchMyLatestReport();
  }, [session]);

  const generateAiReport = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/reports/generate');
      const data = await res.json();
      if (data.draft) {
        setReportText(data.draft);
      } else if (data.error) {
        alert("AI Error: " + data.details);
      }
    } catch (error) {
      alert("AIレポートの生成に失敗しました。");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!reportText.trim()) return;
    setIsSubmitting(true);
    try {
      // FIX: Changed URL from '/api/reports/generate' to '/api/reports'
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: reportText, taskId: null }),
      });

      if (res.ok) {
        alert("レポートを提出しました！");
        setReportText("");
        fetchMyLatestReport(); 
      } else {
        alert("提出に失敗しました。");
      }
    } catch (error) {
      alert("通信エラーが発生しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen text-slate-900 flex flex-col items-center">
      
      <div className="w-full max-w-5xl flex flex-col flex-1">
        
        {/* HEADER */}
        <div className="flex justify-between items-end mb-10 shrink-0">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">業務報告レポート</h1>
            <p className="text-slate-400 mt-1 text-[10px] font-black uppercase tracking-[0.3em]">Daily Report Submission</p>
          </div>
          
          <Link 
            href="/dashboard/reports/feedback"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl active:scale-95"
          >
            <MessageSquare size={16} /> 
            フィードバックを見る
          </Link>
        </div>

        {/* MAIN WRITER SECTION */}
        <div className="space-y-6 flex-1 flex flex-col">
          <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-8 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 rounded-2xl">
                  <Calendar className="text-indigo-600" size={24} />
                </div>
                <h3 className="font-black text-lg text-slate-900 tracking-widest uppercase">新規レポート作成</h3>
              </div>

              {/* AI BUTTON */}
              <button 
                type="button"
                onClick={generateAiReport}
                disabled={isGenerating}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                <span className="flex items-center justify-center">
                  {isGenerating ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Sparkles size={16} />
                  )}
                </span>
                <span>{isGenerating ? "生成中..." : "AIで下書きを作成"}</span>
              </button>
            </div>

            <textarea 
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="今日何をしたか、ここに記入するかAIボタンを押してください..."
              className="w-full flex-1 min-h-[300px] bg-slate-50/50 border border-slate-100 rounded-[2.5rem] p-8 text-base font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none leading-loose"
            />

            <div className="mt-8 flex justify-end shrink-0">
              <button 
                onClick={handleSubmitReport}
                disabled={isSubmitting || !reportText}
                className="bg-slate-900 text-white px-10 py-4 rounded-full font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-xl disabled:opacity-50 active:scale-95 flex items-center gap-2"
              >
                <span className="flex items-center justify-center">
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </span>
                <span>レポートを提出</span>
              </button>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}