'use client';

import React, { useState } from 'react';
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
  const [comments, setComments] = useState([
    { id: 1, user: "内木敦", text: "素晴らしい進捗ですね！引き続きお願いします。", time: "1時間前" }
  ]);
  const [newComment, setNewComment] = useState("");

  // --- 1. REAL AI Report Generation ---
  const generateAiReport = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/reports/generate');
      const data = await res.json();
      
      if (data.draft) {
        setReportText(data.draft);
      } else if (data.error) {
        alert(data.error);
      }
    } catch (error) {
      console.error("AI generation failed:", error);
      alert("AIレポートの生成に失敗しました。");
    } finally {
      setIsGenerating(false);
    }
  };

  // --- 2. Save Report to Database ---
  const handleSubmitReport = async () => {
    if (!reportText.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: reportText }),
      });

      if (res.ok) {
        alert("レポートを提出しました！");
      } else {
        alert("提出に失敗しました。");
      }
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setComments([...comments, { 
      id: Date.now(), 
      user: session?.user?.name || "自分", 
      text: newComment, 
      time: "今" 
    }]);
    setNewComment("");
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">業務報告レポート</h1>
        <p className="text-slate-400 mt-1 text-[10px] font-black uppercase tracking-[0.3em]">Daily Report & Feedback</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: Report Editor Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="text-indigo-600" size={20} />
                <h3 className="font-black text-slate-900 uppercase text-sm tracking-widest">本日のレポート</h3>
              </div>
              <button 
                onClick={generateAiReport}
                disabled={isGenerating}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-50"
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
                className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : "レポートを提出"}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Feedback/Comment Section */}
        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-8">
              <MessageSquare className="text-rose-500" size={20} />
              <h3 className="font-black text-slate-900 uppercase text-sm tracking-widest">フィードバック</h3>
            </div>

            {/* Comment Thread */}
            <div className="flex-1 space-y-6 overflow-y-auto pr-2 no-scrollbar mb-6">
              {comments.map((comment) => (
                <div key={comment.id} className="animate-in fade-in slide-in-from-right duration-500">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                      <UserCircle size={24} className="text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-black text-slate-900">{comment.user}</span>
                        <span className="text-[9px] text-slate-400">{comment.time}</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl rounded-tl-none border border-slate-100">
                        <p className="text-xs font-bold text-slate-600 leading-relaxed">{comment.text}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* New Comment Input */}
            <form onSubmit={handlePostComment} className="relative">
              <input 
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="フィードバックを入力..."
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all pr-12"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-indigo-600 hover:scale-110 transition-transform">
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}