'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react'; 
import { 
  Plus, Calendar, Users, Edit, Trash2, HardDrive, 
  Loader2, X, Check, CheckSquare, ChevronDown, Send, MessageCircle, Smile, Edit2, ArrowLeft
} from 'lucide-react';

const DonutChart = ({ percentage }: { percentage: number }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} stroke="#f1f5f9" strokeWidth="10" fill="transparent" />
        <circle cx="50" cy="50" r={radius} stroke="#4f46e5" strokeWidth="10" fill="transparent"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
          className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-xl font-black text-slate-800 leading-none">{percentage}%</span>
      </div>
    </div>
  );
};

const COMMON_EMOJIS = ['👍', '❤️', '😂', '🔥', '✨', '🙏', '🎉', '✅'];

export default function ProjectsPage() {
  const { data: session } = useSession(); 
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastReadCount, setLastReadCount] = useState(0);
  const isFirstFetch = useRef(true);

  const isActionInProgress = useRef(false);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editMessageText, setEditMessageText] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [newProject, setNewProject] = useState({
    id: '', name: '', description: '', status: '進行中', startDate: '', endDate: '', driveLink: '', memberIds: [] as string[] 
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScroll, setShowScroll] = useState(false);

  const getProgress = (tasks: any[]) => {
    if (!tasks || tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === 'DONE' || t.status === '完了').length;
    return Math.round((completed / tasks.length) * 100);
  };

  const scrollToChatBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isChatOpen && !editingMessageId) {
      scrollToChatBottom();
    }
  }, [messages, isChatOpen, editingMessageId]);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      setShowScroll(scrollHeight > clientHeight && scrollTop + clientHeight < scrollHeight - 10);
    }
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: scrollContainerRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [selectedProject]);

  useEffect(() => {
    setIsChatOpen(false);
    setUnreadCount(0);
    setLastReadCount(0);
    setMessages([]);
    setEditingMessageId(null);
    setShowEmojiPicker(false);
    isFirstFetch.current = true; 
  }, [selectedProject?.id]);

  useEffect(() => {
    if (isChatOpen) {
      setUnreadCount(0); 
      setLastReadCount(messages.length);
    } else {
      if (!isFirstFetch.current && messages.length > lastReadCount) {
        setUnreadCount(messages.length - lastReadCount); 
      }
    }
  }, [messages.length, isChatOpen, lastReadCount]);

  const fetchMessages = async (projectId: string) => {
    if (isActionInProgress.current) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/messages`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        if (isFirstFetch.current) {
          setLastReadCount(data.length);
          isFirstFetch.current = false;
        }
      }
    } catch (error) {
      console.error("Fetch messages error:", error);
    }
  };

  const fetchProjectsAndMembers = async () => {
    try {
      const [projRes, memRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/members')
      ]);

      if (memRes.ok) {
        const memData = await memRes.json();
        setAllMembers(Array.isArray(memData) ? memData : (memData.members || []));
      }

      if (projRes.ok) {
        const projData = await projRes.json();
        setProjects(projData);
        if (selectedProject) {
          const updated = projData.find((p: any) => p.id === selectedProject.id);
          setSelectedProject(updated || (projData.length > 0 ? projData[0] : null));
        } else if (projData.length > 0) {
          setSelectedProject(projData[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectsAndMembers();
  }, []);

  useEffect(() => {
    if (!selectedProject) return;
    fetchMessages(selectedProject.id);
    const interval = setInterval(() => {
       fetchMessages(selectedProject.id);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedProject?.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending || !selectedProject) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/projects/${selectedProject.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newMessage })
      });
      if (res.ok) {
        setNewMessage("");
        setShowEmojiPicker(false);
        fetchMessages(selectedProject.id);
      }
    } catch (error) {
      console.error("Send message error:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm("このメッセージを削除しますか？")) return;
    
    isActionInProgress.current = true;
    setMessages(prev => prev.filter(m => m.id !== msgId));
    
    try {
      await fetch(`/api/projects/${selectedProject.id}/messages/${msgId}`, { method: 'DELETE' });
      setTimeout(() => { isActionInProgress.current = false; }, 4000);
    } catch (error) {
      isActionInProgress.current = false;
      fetchMessages(selectedProject.id);
    }
  };

  const handleUpdateMessage = async () => {
    if (!editMessageText.trim() || !editingMessageId) {
      setEditingMessageId(null);
      return;
    }
    
    isActionInProgress.current = true;
    setMessages(prev => prev.map(m => m.id === editingMessageId ? { ...m, text: editMessageText } : m));
    const msgId = editingMessageId;
    setEditingMessageId(null);

    try {
      await fetch(`/api/projects/${selectedProject.id}/messages/${msgId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editMessageText })
      });
      setTimeout(() => { isActionInProgress.current = false; }, 3000);
    } catch (error) {
      isActionInProgress.current = false;
      fetchMessages(selectedProject.id);
    }
  };

  const handleAddReaction = async (msgId: string, emoji: string) => {
    const currentUserId = (session?.user as any)?.id;
    if (!currentUserId) return;

    setMessages(prev => prev.map(msg => {
      if (msg.id !== msgId) return msg;
      const existing = (msg.reactions || []).find((r: any) => r.emoji === emoji && r.userId === currentUserId);
      if (existing) {
        return { ...msg, reactions: msg.reactions.filter((r: any) => r.id !== existing.id) };
      }
      return { ...msg, reactions: [...(msg.reactions || []), { id: 'temp-' + Date.now(), emoji, userId: currentUserId }] };
    }));

    isActionInProgress.current = true; 
    try {
      const res = await fetch(`/api/projects/${selectedProject.id}/messages/${msgId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji })
      });
      if (res.ok) {
        setTimeout(() => {
          isActionInProgress.current = false;
          fetchMessages(selectedProject.id);
        }, 1500);
      }
    } catch (error) {
      isActionInProgress.current = false;
      fetchMessages(selectedProject.id);
    }
  };

  // --- UPDATED: Populate all fields for editing ---
  const handleEditClick = (project: any) => {
    setNewProject({
      id: project.id, 
      name: project.name, 
      description: project.description || '', 
      status: project.status,
      // Convert ISO strings to YYYY-MM-DD for date inputs
      startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
      endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
      driveLink: project.driveLink || '', 
      memberIds: project.members?.map((m: any) => m.id) || []
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("このプロジェクトを削除してもよろしいですか？")) return;
    try {
      const response = await fetch(`/api/projects?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        setSelectedProject(null);
        fetchProjectsAndMembers();
      }
    } catch (error) {
      alert("削除に失敗しました");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = isEditMode ? 'PUT' : 'POST';
    const projectDataToSubmit = {
      ...newProject, 
      startDate: newProject.startDate || null,
      endDate: newProject.endDate || null
    };

    try {
      const response = await fetch('/api/projects', {
        method: method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectDataToSubmit),
      });

      if (response.ok) {
        setIsModalOpen(false); setIsEditMode(false);
        fetchProjectsAndMembers();
      } else { alert("保存に失敗しました"); }
    } catch (error) { alert("通信エラーが発生しました"); }
  };

  const toggleMemberSelection = (id: string) => {
    setNewProject(prev => {
      const isSelected = prev.memberIds.includes(id);
      return { ...prev, memberIds: isSelected ? prev.memberIds.filter(mId => mId !== id) : [...prev.memberIds, id] };
    });
  };

  const handleAssignMember = async (userId: string) => {
    try {
      const response = await fetch(`/api/projects/${selectedProject.id}/members`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }),
      });
      if (response.ok) {
        setShowAddMember(false); fetchProjectsAndMembers(); 
      }
    } catch (error) { console.error("Failed to assign member", error); }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  const inputClass = "w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 font-medium placeholder:text-slate-400 bg-white";

  return (
    <div className="p-8 bg-slate-50 min-h-screen flex flex-col h-screen overflow-hidden relative text-slate-900">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">プロジェクト管理</h1>
          <p className="text-slate-600 mt-1 text-sm font-medium">JMCのアクティブな計画とリソースを管理します。</p>
        </div>
        <button 
          onClick={() => { setIsEditMode(false); setNewProject({ id: '', name: '', description: '', status: '進行中', startDate: '', endDate: '', driveLink: '', memberIds: [] }); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg transition-all active:scale-95"
        >
          <Plus size={20} />
          新規作成
        </button>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        <div className="w-1/3 flex flex-col gap-4 overflow-y-auto pr-2 pb-20 custom-scrollbar text-slate-900">
          {projects.map((project) => {
            const progress = getProgress(project.tasks);
            return (
              <div 
                key={project.id} onClick={() => setSelectedProject(project)}
                className={`bg-white rounded-2xl border p-5 cursor-pointer transition-all ${selectedProject?.id === project.id ? 'border-indigo-600 shadow-md ring-1 ring-indigo-600' : 'border-slate-200 hover:border-indigo-300'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-blue-50 text-blue-600 inline-block">{project.status}</span>
                  <p className="text-[10px] text-slate-400 font-black flex items-center gap-1"><Calendar size={12} /> {project.endDate ? new Date(project.endDate).toLocaleDateString() : '未設定'}</p>
                </div>
                <h3 className="font-bold text-slate-900 mb-4">{project.name}</h3>
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Progress</span>
                    <span className="text-[10px] font-black text-indigo-600">{progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {selectedProject ? (
          <div className="w-2/3 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden relative">
            <div ref={scrollContainerRef} onScroll={checkScroll} className="p-8 flex-1 overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-black text-slate-900">{selectedProject.name}</h2>
                <div className="flex gap-2">
                  <button onClick={() => handleEditClick(selectedProject)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit size={18} /></button>
                  <button onClick={() => handleDelete(selectedProject.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                </div>
              </div>
              <p className="text-sm text-slate-700 font-medium mb-8 leading-relaxed">{selectedProject.description || "説明はありません。"}</p>
              
              <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="col-span-1 bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center justify-center relative">
                   <DonutChart percentage={getProgress(selectedProject.tasks)} />
                </div>
                <div className="col-span-3 grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-2"><Calendar size={16} className="text-indigo-600" />スケジュール</div>
                    <p className="text-[11px] text-slate-800 font-bold tracking-tight">{selectedProject.startDate ? new Date(selectedProject.startDate).toLocaleDateString() : '-'} 〜 {selectedProject.endDate ? new Date(selectedProject.endDate).toLocaleDateString() : '-'}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 relative col-span-2">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-2"><Users size={16} className="text-emerald-500" />チームメンバー</div>
                    <div className="flex -space-x-2 items-center">
                      {selectedProject.members?.map((member: any) => (
                        <div key={member.id} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white overflow-hidden" title={member.name}>
                          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=f1f5f9&color=6366f1&bold=true`} alt={member.name} className="w-full h-full object-cover"/>
                        </div>
                      ))}
                      <button onClick={() => setShowAddMember(!showAddMember)} className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border-2 border-white hover:bg-indigo-100 hover:scale-110 transition-all z-10 ml-1"><Plus size={14} /></button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mb-12">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm"><CheckSquare size={18} className="text-amber-500" />プロジェクトタスク</div>
                </div>
                <div className="space-y-2">
                  {selectedProject.tasks && selectedProject.tasks.length > 0 ? (
                    selectedProject.tasks.map((task: any) => (
                      <div key={task.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors text-slate-900">
                        <span className="text-xs font-bold">{task.title || task.name}</span>
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-md ${task.status === 'DONE' || task.status === '完了' ? 'bg-emerald-100 text-emerald-700' : task.status === 'IN_PROGRESS' || task.status === '進行中' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>{task.status}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                      <p className="text-xs text-slate-400 font-bold">このプロジェクトにはまだタスクがありません。</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button onClick={() => setIsChatOpen(!isChatOpen)} className="absolute bottom-8 right-8 w-16 h-16 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-slate-800 hover:scale-105 transition-all z-30 ring-4 ring-white">
              {isChatOpen ? <X size={28} /> : <MessageCircle size={28} />}
              {!isChatOpen && unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[11px] font-black min-w-[24px] h-[24px] px-2.5 flex items-center justify-center rounded-full border-2 border-white shadow-md z-40">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {isChatOpen && (
              <div 
                className="absolute inset-0 bg-white z-[100] flex flex-col animate-in slide-in-from-right duration-300"
              >
                <div className="bg-slate-900 p-4 flex justify-between items-center shrink-0 cursor-move">
                   <button onClick={() => setIsChatOpen(false)} className="flex items-center gap-1.5 bg-slate-800 text-white hover:bg-slate-700 px-3 py-1.5 rounded-xl transition-all text-xs font-bold shadow-sm">
                     <ArrowLeft size={16}/> 戻る
                   </button>
                   <div className="flex items-center gap-2 text-white">
                     <MessageCircle size={18} />
                     <h3 className="text-sm font-bold tracking-wide">プロジェクトチャット</h3>
                   </div>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 bg-slate-50 space-y-5 text-slate-900">
                  {messages.length > 0 ? (
                    messages.map((msg) => {
                      const isMe = msg.author?.id === (session?.user as any)?.id;
                      const isEditingThis = editingMessageId === msg.id;

                      return (
                        <div key={msg.id} className={`flex w-full group ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`flex flex-col max-w-[85%] ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className={`flex items-baseline gap-2 mb-1 px-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                               <span className="text-[10px] font-bold text-slate-500 uppercase">{msg.author?.name}</span>
                               <span className="text-[9px] text-slate-400 font-medium">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            
                            <div className={`flex items-center gap-2 w-full ${isMe ? 'flex-row' : 'flex-row-reverse'}`}>
                              {isMe && !isEditingThis && (
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 pb-1">
                                  <button onClick={() => { setEditingMessageId(msg.id); setEditMessageText(msg.text); }} className="p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 rounded-lg shadow-sm"><Edit2 size={12} /></button>
                                  <button onClick={() => handleDeleteMessage(msg.id)} className="p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 rounded-lg shadow-sm"><Trash2 size={12} /></button>
                                </div>
                              )}

                              <div className={`px-4 py-2.5 text-xs font-medium shadow-sm leading-relaxed rounded-2xl ${
                                isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                              }`}>
                                {isEditingThis ? (
                                  <div className="min-w-[200px]">
                                    <input autoFocus value={editMessageText} onChange={(e) => setEditMessageText(e.target.value)} className="w-full text-xs font-medium outline-none bg-slate-100/20 p-1 border-b border-white/50" onKeyDown={(e) => e.key === 'Enter' && handleUpdateMessage()} />
                                    <div className="flex justify-end gap-2 mt-2">
                                      <button onClick={() => setEditingMessageId(null)} className="text-[10px] font-bold opacity-60">Cancel</button>
                                      <button onClick={handleUpdateMessage} className="text-[10px] font-bold text-white bg-indigo-50 px-2 py-0.5 rounded">Save</button>
                                    </div>
                                  </div>
                                ) : msg.text}
                              </div>

                              {!isMe && (
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 items-center bg-white border border-slate-200 px-2 py-1 rounded-full shadow-sm">
                                  {COMMON_EMOJIS.slice(0, 3).map(e => (
                                    <button key={e} onClick={() => handleAddReaction(msg.id, e)} className="hover:scale-125 transition-transform text-xs">{e}</button>
                                  ))}
                                </div>
                              )}
                            </div>

                            {msg.reactions?.length > 0 && (
                              <div className={`flex gap-1 mt-1 flex-wrap ${isMe ? 'justify-end' : 'justify-start'}`}>
                                {Array.from(new Set(msg.reactions.map((r: any) => r.emoji))).map((emoji: any) => {
                                  const reactionsForEmoji = msg.reactions.filter((r: any) => r.emoji === emoji);
                                  const count = reactionsForEmoji.length;
                                  const hasMeReacted = reactionsForEmoji.some((r: any) => r.userId === (session?.user as any)?.id);

                                  return (
                                    <button 
                                      key={emoji} 
                                      onClick={() => handleAddReaction(msg.id, emoji)}
                                      className={`text-[10px] border px-2 py-0.5 rounded-full flex items-center gap-1 transition-all ${
                                        hasMeReacted ? 'bg-indigo-50 border-indigo-200 text-indigo-600 font-bold' : 'bg-white border-slate-100 text-slate-500'
                                      } hover:scale-110 active:scale-95 shadow-sm`}
                                    >
                                      <span>{emoji}</span>
                                      {count > 1 && <span>{count}</span>}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-40"><MessageCircle size={36} className="text-slate-300 mb-3" /><p className="text-xs font-bold uppercase tracking-widest text-slate-500">まだメッセージはありません</p></div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="relative">
                  {showEmojiPicker && (
                    <div className="absolute bottom-[100%] left-4 mb-2 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 grid grid-cols-6 gap-2 z-50 animate-in fade-in slide-in-from-bottom-2">
                      {COMMON_EMOJIS.map(emoji => (
                        <button key={emoji} type="button" onClick={() => { setNewMessage(prev => prev + emoji); setShowEmojiPicker(false); }} className="hover:bg-slate-100 p-1.5 rounded-lg text-lg transition-transform hover:scale-110">{emoji}</button>
                      ))}
                    </div>
                  )}
                  <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center shrink-0">
                     <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 text-slate-400 hover:text-indigo-500 rounded-xl transition-colors"><Smile size={20} /></button>
                     <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="メッセージを入力..." className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900" />
                     <button type="submit" disabled={isSending || !newMessage.trim()} className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 transition-all active:scale-95 shadow-md flex items-center justify-center w-11 h-11 shrink-0"><Send size={18} /></button>
                  </form>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-2/3 bg-white rounded-3xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 font-bold tracking-widest uppercase">プロジェクトを選択してください</div>
        )}
      </div>

      {/* --- UPDATED: Modal UI for Creating and Editing Projects --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-900">{isEditMode ? 'プロジェクトを編集' : '新規プロジェクト作成'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar text-slate-900">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase tracking-widest">プロジェクト名</label>
                <input required type="text" className={inputClass} value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase tracking-widest">説明</label>
                <textarea className={`${inputClass} h-20 resize-none`} value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} />
              </div>

              {/* NEW: Dates Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase tracking-widest">開始予定日</label>
                  <input type="date" className={inputClass} value={newProject.startDate} onChange={e => setNewProject({...newProject, startDate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase tracking-widest">終了予定日</label>
                  <input type="date" className={inputClass} value={newProject.endDate} onChange={e => setNewProject({...newProject, endDate: e.target.value})} />
                </div>
              </div>

              {/* NEW: Member Selection (Shared for Create/Edit) */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 ml-1 uppercase tracking-widest">チームメンバーの割り当て</label>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-40 overflow-y-auto custom-scrollbar flex flex-wrap gap-2">
                  {allMembers.map(member => (
                    <button 
                      type="button" 
                      key={member.id} 
                      onClick={() => toggleMemberSelection(member.id)} 
                      className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${
                        newProject.memberIds.includes(member.id) 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                          : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      {member.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Drive Link */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase tracking-widest">Google Drive リンク</label>
                <input type="url" placeholder="https://drive.google.com/..." className={inputClass} value={newProject.driveLink} onChange={e => setNewProject({...newProject, driveLink: e.target.value})} />
              </div>

              <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-indigo-700 transition-all active:scale-[0.98] mt-4 uppercase tracking-widest text-sm">
                {isEditMode ? '更新を保存' : 'プロジェクトを作成'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}