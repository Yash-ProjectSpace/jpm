'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { 
  Sparkles, Send, MessageSquare, Calendar, 
  Loader2, UserCircle 
} from 'lucide-react';

export default function ReportsPage() {
  const { data: session } = useSession();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportText, setReportText] = useState("");
  const [latestReport, setLatestReport] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");

  // --- 1. Fetch Latest Report & Feedback ---
  const fetchMyLatestReport = async () => {
    try {
      const res = await fetch('/api/reports'); // Uses our unified route
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const latest = data[0]; // Newest is first due to 'desc' order
        setLatestReport(latest);
        setComments(latest.comments || []);
      }
    } catch (error) {
      console.error("Failed to fetch report history:", error);
    }
  };

  useEffect(() => {
    if (session) fetchMyLatestReport();
  }, [session]);

  // --- 2. AI Draft Generation ---
  const generateAiReport = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/reports/generate');
      const data = await res.json();
      if (data.draft) setReportText(data.draft);
    } catch (error) {
      alert("AIレポートの生成に失敗しました。");
    } finally {
      setIsGenerating(false);
    }
  };

  // --- 3. Submit New Report ---
  const handleSubmitReport = async () => {
    if (!reportText.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: reportText,
          taskId: null // General daily report
        }),
      });

      if (res.ok) {
        alert("レポートを提出しました！");
        setReportText("");
        fetchMyLatestReport(); // Refresh feedback section
      } else {
        alert("提出に失敗しました。");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 4. Reply to Manager (Optional) ---
  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !latestReport) return;

    try {
      const res = await fetch(`/api/reports/${latestReport.id}/review`, {
        method: 'PATCH', // Reuse the review route to add a comment
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: newComment, status: latestReport.status }),
      });

      if (res.ok) {
        setNewComment("");
        fetchMyLatestReport();
      }
    } catch (error) {
      console.error("Reply failed");
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen text-slate-900">
      <div className="mb-10">
        <h1 className="text-3xl font-black tracking-tight">業務報告レポート</h1>
        <p className="text-slate-400 mt-1 text-[10px] font-black uppercase tracking-[0.3em]">Daily Report & Feedback</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: Editor */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="text-indigo-600" size={20} />
                <h3 className="font-black text-sm tracking-widest uppercase">新規レポート作成</h3>
              </div>
              <button 
                onClick={generateAiReport}
                disabled={isGenerating}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"
              >
                {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                AIで下書きを作成
              </button>
            </div>

            <textarea 
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="今日何をしたか、ここに記入するかAIボタンを押してください..."
              className="w-full h-80 bg-slate-50/50 border border-slate-100 rounded-[2rem] p-6 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none leading-relaxed"
            />

            <div className="mt-6 flex justify-end">
              <button 
                onClick={handleSubmitReport}
                disabled={isSubmitting || !reportText}
                className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-xl disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : "レポートを提出"}
              </button>
            </div>
          </div>

          {/* User's Current Status Section */}
          {latestReport && (
            <div className="bg-white rounded-[2rem] p-6 border border-slate-100">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">提出済みの最新レポート状態</p>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${latestReport.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                  {latestReport.status}
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-500 line-clamp-2 italic">"{latestReport.content}"</p>
            </div>
          )}
        </div>

        {/* RIGHT: Feedback/Comment Section */}
        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 min-h-[500px] flex flex-col">
            <div className="flex items-center gap-2 mb-8">
              <MessageSquare className="text-rose-500" size={20} />
              <h3 className="font-black text-slate-900 uppercase text-sm tracking-widest">管理者からのフィードバック</h3>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar mb-6">
              {comments.length > 0 ? comments.map((comment) => (
                <div key={comment.id} className="animate-in fade-in slide-in-from-right duration-500">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                      <UserCircle size={24} className="text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-black text-slate-900">{comment.author?.name}</span>
                        <span className="text-[9px] text-slate-400">{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className={`p-4 rounded-2xl rounded-tl-none border ${comment.authorId === (session?.user as any).id ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
                        <p className="text-xs font-bold text-slate-600 leading-relaxed">{comment.text}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="h-full flex flex-col items-center justify-center opacity-30">
                  <MessageSquare size={40} className="mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-widest">フィードバックはまだありません</p>
                </div>
              )}
            </div>

            {/* New Comment Input (Reply to Manager) */}
            <form onSubmit={handlePostReply} className="relative">
              <input 
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="返信・質問を入力..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all pr-12"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-indigo-600">
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}