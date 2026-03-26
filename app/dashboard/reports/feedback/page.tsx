'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import Link from "next/link";
import { 
  ArrowLeft, MessageSquare, Calendar, ChevronRight, 
  ChevronDown, Send, User, X, Loader2
} from 'lucide-react';

export default function ReportFeedbackPage() {
  const { data: session } = useSession();
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [isReplying, setIsReplying] = useState(false);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      if (Array.isArray(data)) {
        setReports(data);
      }
    } catch (error) {
      console.error("レポートの取得に失敗しました", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) fetchReports();
  }, [session]);

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedReport) return;
    setIsReplying(true);

    try {
      const res = await fetch(`/api/reports/${selectedReport.id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: newComment, status: selectedReport.status }),
      });

      if (res.ok) {
        setNewComment("");
        fetchReports();
        // 選択中のレポートデータも更新するために再フェッチしたデータから探す
        const updatedRes = await fetch('/api/reports');
        const updatedData = await updatedRes.json();
        const updatedReport = updatedData.find((r: any) => r.id === selectedReport.id);
        if (updatedReport) setSelectedReport(updatedReport);
      }
    } catch (error) {
      console.error("返信に失敗しました", error);
    } finally {
      setIsReplying(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'APPROVED': return '承認済み';
      case 'REVISION_REQUESTED': return '修正依頼';
      default: return '確認中';
    }
  };

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'APPROVED': return 'bg-emerald-100 text-emerald-700';
      case 'REVISION_REQUESTED': return 'bg-rose-100 text-rose-600';
      default: return 'bg-amber-100 text-amber-600';
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  };

  const userName = session?.user?.name || 'ユーザー';
  const userInitial = userName.charAt(0).toUpperCase();

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;
  }

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col text-slate-900 p-8">
      
      {/* HEADER */}
      <header className="mb-8 flex items-center gap-4">
        <Link href="/dashboard/reports" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 hover:bg-slate-100 transition-colors">
          <ArrowLeft size={18} className="text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight">フィードバック一覧</h1>
        </div>
      </header>

      {/* CARDS GRID (画像1枚目のデザイン) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {reports.length === 0 ? (
          <p className="text-sm font-bold text-slate-400 col-span-full">提出されたレポートはありません。</p>
        ) : (
          reports.map((report) => (
            <div 
              key={report.id}
              onClick={() => setSelectedReport(report)}
              className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg flex flex-col h-56"
            >
              {/* Card Top: Avatar, Name, Date & Status */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 font-black flex items-center justify-center text-lg shadow-inner">
                    {userInitial}
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 font-bold mt-0.5">
                      <Calendar size={10} /> {formatDate(report.createdAt)}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest ${getStatusStyle(report.status)}`}>
                  {getStatusLabel(report.status)}
                </span>
              </div>

              {/* Card Body: Title & Content */}
              <div className="flex-1 min-h-0">
                <h4 className="font-black text-sm text-slate-900 mb-2">一般日報
                </h4>
                <p className="text-xs font-bold text-slate-500 leading-relaxed line-clamp-2">
                  {report.content}
                </p>
              </div>

              {/* Card Footer: Feedback count & View Details */}
              <div className="pt-4 flex items-center justify-between mt-auto">
                <div className="text-[8px] font-bold text-slate-400 flex items-center gap-1.5">
                  <MessageSquare size={14} className="text-slate-300" /> 
                  {report.comments?.length || 0} フィードバック
                </div>
                <div className="text-[11px] font-black text-indigo-600 flex items-center gap-0.5 group">
                  詳細を見る <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FULL DETAIL MODAL (画像2枚目のデザイン + 下矢印) */}
      {selectedReport && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-md">
                  <User size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">{userName} の報告詳細</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daily Report Detail</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedReport(null)}
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10">
              
              {/* 報告内容 (CONTENT) */}
              <div>
                <h3 className="text-xs font-black text-slate-400 tracking-widest mb-3 flex items-center gap-2">
                  報告内容 <span className="text-[10px]">(CONTENT)</span>
                </h3>
                <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 text-[15px] text-slate-700 font-medium whitespace-pre-wrap leading-relaxed shadow-inner">
                  {selectedReport.content}
                </div>
              </div>

              {/* Bouncing Down Arrow */}
              <div className="flex justify-center">
                <div className="bg-indigo-50 text-indigo-500 w-10 h-10 rounded-full flex items-center justify-center animate-bounce shadow-sm">
                  <ChevronDown size={20} />
                </div>
              </div>

              {/* フィードバック履歴 (HISTORY) */}
              <div>
                <h3 className="text-xs font-black text-emerald-600 tracking-widest mb-3 flex items-center gap-2">
                  フィードバック履歴 <span className="text-[10px]">(HISTORY)</span>
                </h3>
                
                <div className="space-y-4">
                  {selectedReport.comments && selectedReport.comments.length > 0 ? (
                    selectedReport.comments.map((comment: any) => {
                      const isMe = comment.authorId === (session?.user as any)?.id;
                      return (
                        <div key={comment.id} className={`rounded-[1.5rem] p-5 ${
                          isMe 
                            ? 'bg-slate-50 border border-slate-100' 
                            : 'bg-emerald-50/40 border border-emerald-100' // 画像の緑色がかった背景
                        }`}>
                          <div className="flex justify-between items-center mb-2">
                            <span className={`text-[11px] font-black ${isMe ? 'text-slate-500' : 'text-emerald-600'}`}>
                              {comment.author?.name || 'マネージャー'}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-slate-700 leading-relaxed">
                            {comment.text}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-[11px] font-black text-slate-400 tracking-widest">フィードバックはまだありません</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer (Reply Input) */}
            <div className="p-6 border-t border-slate-100 bg-white shrink-0">
              <form onSubmit={handlePostReply} className="flex flex-col gap-4">
                <textarea 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="フィードバックや返信を入力..."
                  className="w-full bg-white border border-slate-200 rounded-[1.5rem] p-5 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none h-28"
                />
                <button 
                  type="submit" 
                  disabled={!newComment.trim() || isReplying}
                  className="w-full bg-indigo-600 text-white font-black text-sm py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
                >
                  {isReplying ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  返信を送信する
                </button>
              </form>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}