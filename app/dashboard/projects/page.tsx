'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react'; 
import { 
  Plus, Calendar, Users, MessageSquare, Edit, 
  Trash2, HardDrive, Loader2, X, Check, CheckSquare, ChevronDown, Send
} from 'lucide-react';

export default function ProjectsPage() {
  const { data: session } = useSession(); 
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);

  // --- Chat States ---
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newProject, setNewProject] = useState({
    id: '', 
    name: '',
    description: '',
    status: '進行中',
    startDate: '',
    endDate: '',
    driveLink: ''
  });

  // --- Scroll Indicator & Container Refs ---
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScroll, setShowScroll] = useState(false);

  // Auto-scroll chat to bottom
  const scrollToChatBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToChatBottom();
  }, [messages]);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      setShowScroll(scrollHeight > clientHeight && scrollTop + clientHeight < scrollHeight - 10);
    }
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [selectedProject]);

  // --- Data Fetching ---
  const fetchMessages = async (projectId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/messages`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
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

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!selectedProject) return;
    fetchMessages(selectedProject.id);
    const interval = setInterval(() => fetchMessages(selectedProject.id), 5000);
    return () => clearInterval(interval);
  }, [selectedProject?.id]);

  // --- Handlers ---
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
        fetchMessages(selectedProject.id);
      }
    } catch (error) {
      console.error("Send message error:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleEditClick = (project: any) => {
    setNewProject({
      id: project.id,
      name: project.name,
      description: project.description || '',
      status: project.status,
      startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
      endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
      driveLink: project.driveLink || ''
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
    
    let finalDriveLink = newProject.driveLink;
    if (!finalDriveLink.trim() && newProject.name.trim()) {
       finalDriveLink = `https://drive.google.com/drive/search?q=${encodeURIComponent(newProject.name)}`;
    }

    const projectDataToSubmit = {
      ...newProject,
      startDate: newProject.startDate ? newProject.startDate : null,
      endDate: newProject.endDate ? newProject.endDate : null,
      driveLink: finalDriveLink
    };

    try {
      const response = await fetch('/api/projects', {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectDataToSubmit),
      });

      if (response.ok) {
        setIsModalOpen(false);
        setIsEditMode(false);
        setNewProject({ id: '', name: '', description: '', status: '進行中', startDate: '', endDate: '', driveLink: '' });
        fetchProjectsAndMembers();
      } else {
        alert("保存に失敗しました"); 
      }
    } catch (error) {
      alert("通信エラーが発生しました"); 
    }
  };

  const handleAssignMember = async (userId: string) => {
    try {
      const response = await fetch(`/api/projects/${selectedProject.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        setShowAddMember(false);
        fetchProjectsAndMembers(); 
      }
    } catch (error) {
      console.error("Failed to assign member", error);
    }
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
    <div className="p-8 bg-slate-50 min-h-screen flex flex-col h-screen overflow-hidden relative">
      
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">プロジェクト管理</h1>
          <p className="text-slate-600 mt-1 text-sm font-medium">JMCのアクティブな計画とリソースを管理します。</p>
        </div>
        <button 
          onClick={() => { setIsEditMode(false); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95"
        >
          <Plus size={20} />
          新規作成
        </button>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        <div className="w-1/3 flex flex-col gap-4 overflow-y-auto pr-2 pb-20 custom-scrollbar">
          {projects.map((project) => (
            <div 
              key={project.id} 
              onClick={() => setSelectedProject(project)}
              className={`bg-white rounded-2xl border p-5 cursor-pointer transition-all ${
                selectedProject?.id === project.id ? 'border-indigo-600 shadow-md ring-1 ring-indigo-600' : 'border-slate-200 hover:border-indigo-300'
              }`}
            >
              <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-blue-50 text-blue-600 mb-2 inline-block">{project.status}</span>
              <h3 className="font-bold text-slate-900">{project.name}</h3>
              <p className="text-xs text-slate-700 font-semibold mt-2 flex items-center gap-1">
                <Calendar size={12} /> {project.endDate ? new Date(project.endDate).toLocaleDateString() : '未設定'}
              </p>
            </div>
          ))}
        </div>

        {selectedProject ? (
          <div className="w-2/3 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            
            <div className="relative flex-1 flex flex-col min-h-0 border-b border-slate-100">
              <div 
                ref={scrollContainerRef}
                onScroll={checkScroll}
                className="p-8 flex-1 overflow-y-auto custom-scrollbar"
              >
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-black text-slate-900">{selectedProject.name}</h2>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditClick(selectedProject)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit size={18} /></button>
                    <button onClick={() => handleDelete(selectedProject.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                  </div>
                </div>
                <p className="text-sm text-slate-700 font-medium mb-6 leading-relaxed">{selectedProject.description || "説明はありません。"}</p>
                
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-2">
                      <Calendar size={16} className="text-indigo-600" />スケジュール
                    </div>
                    <p className="text-[11px] text-slate-800 font-bold tracking-tight">
                      {selectedProject.startDate ? new Date(selectedProject.startDate).toLocaleDateString() : '-'} 〜 
                      {selectedProject.endDate ? new Date(selectedProject.endDate).toLocaleDateString() : '-'}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-2">
                      <HardDrive size={16} className="text-blue-500" />Drive
                    </div>
                    {selectedProject.driveLink ? (
                      <a href={selectedProject.driveLink} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-700 underline font-extrabold hover:text-blue-800 transition-colors">
                        {selectedProject.driveLink.includes('search') ? '自動検索を開く' : 'フォルダを開く'}
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-500 font-medium tracking-tight">リンクなし</span>
                    )}
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 relative">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-2">
                      <Users size={16} className="text-emerald-500" />チームメンバー
                    </div>
                    
                    <div className="flex -space-x-2 items-center">
                      {selectedProject.members?.map((member: any) => (
                         <div key={member.id} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white overflow-hidden" title={member.name}>
                           <img src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=f1f5f9&color=6366f1&bold=true`} alt={member.name} className="w-full h-full object-cover"/>
                         </div>
                      ))}
                      
                      <button 
                        onClick={() => setShowAddMember(!showAddMember)}
                        className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border-2 border-white hover:bg-indigo-100 hover:scale-110 transition-all z-10 ml-1"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {showAddMember && (
                      <div className="absolute top-full mt-2 left-0 w-48 bg-white border border-slate-100 rounded-xl shadow-xl p-2 z-50">
                        <p className="text-[10px] font-bold text-slate-400 mb-2 px-2 uppercase">メンバーを追加</p>
                        <div className="max-h-40 overflow-y-auto custom-scrollbar">
                          {allMembers.map(member => {
                            const isAssigned = selectedProject.members?.some((m: any) => m.id === member.id);
                            return (
                              <button 
                                key={member.id}
                                onClick={() => !isAssigned && handleAssignMember(member.id)}
                                disabled={isAssigned}
                                className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs font-bold transition-colors ${
                                  isAssigned ? 'opacity-50 cursor-not-allowed text-slate-400' : 'hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                <span className="truncate">{member.name}</span>
                                {isAssigned && <Check size={12} className="text-emerald-500" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                      <CheckSquare size={18} className="text-amber-500" />
                      プロジェクトタスク
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {selectedProject.tasks && selectedProject.tasks.length > 0 ? (
                      selectedProject.tasks.map((task: any) => (
                        <div key={task.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
                          <span className="text-xs font-bold text-slate-700">{task.title || task.name}</span>
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-md ${
                            task.status === 'DONE' || task.status === '完了' ? 'bg-emerald-100 text-emerald-700' :
                            task.status === 'IN_PROGRESS' || task.status === '進行中' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-200 text-slate-600'
                          }`}>
                            {task.status}
                          </span>
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

              {showScroll && (
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none flex items-end justify-center pb-4 z-20 transition-all duration-500">
                  <button 
                    onClick={scrollToBottom}
                    className="pointer-events-auto flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 transition-colors text-white px-4 py-2 rounded-full text-xs font-bold shadow-xl border border-indigo-500 cursor-pointer animate-bounce"
                  >
                    下にスクロール <ChevronDown size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* CHAT SECTION */}
            <div className="h-80 bg-slate-50 p-6 flex flex-col shrink-0 border-t border-slate-200">
               <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                 <MessageSquare size={16} className="text-indigo-600" />コメント・チャット
               </h3>
               
               {/* Messages Window */}
               <div className="flex-1 overflow-y-auto custom-scrollbar mb-4 space-y-3 bg-white/50 rounded-xl p-4 border border-slate-200">
                 {messages.length > 0 ? (
                   messages.map((msg) => (
                     <div 
                       key={msg.id} 
                       className={`flex flex-col ${msg.authorId === (session?.user as any)?.id ? 'items-end' : 'items-start'}`}
                     >
                       <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">{msg.author?.name}</span>
                          <span className="text-[8px] text-slate-400">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                       </div>
                       <div className={`px-4 py-2 rounded-2xl text-xs font-medium max-w-[80%] shadow-sm ${
                         msg.authorId === (session?.user as any)?.id 
                          ? 'bg-indigo-600 text-white rounded-tr-none' 
                          : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                       }`}>
                         {msg.text}
                       </div>
                     </div>
                   ))
                 ) : (
                   <div className="h-full flex flex-col items-center justify-center opacity-40">
                      <MessageSquare size={32} className="text-slate-300 mb-2" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">No messages yet</p>
                   </div>
                 )}
                 <div ref={chatEndRef} />
               </div>

               {/* Chat Input */}
               <form onSubmit={handleSendMessage} className="flex gap-2 shrink-0">
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="メッセージを入力..."
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                  <button 
                    type="submit" 
                    disabled={isSending || !newMessage.trim()}
                    className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:scale-100 active:scale-95 shadow-md shadow-indigo-100"
                  >
                    {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
               </form>
            </div>
          </div>
        ) : (
          <div className="w-2/3 bg-white rounded-3xl border border-slate-200 border-dashed flex items-center justify-center text-slate-500 font-bold">プロジェクトを選択してください</div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">{isEditMode ? 'プロジェクトを編集' : '新規プロジェクト作成'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">プロジェクト名</label>
                <input required type="text" className={inputClass} value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">説明</label>
                <textarea className={`${inputClass} h-20 resize-none`} value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">開始日</label>
                  <input type="date" className={inputClass} value={newProject.startDate} onChange={e => setNewProject({...newProject, startDate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">終了日</label>
                  <input type="date" className={inputClass} value={newProject.endDate} onChange={e => setNewProject({...newProject, endDate: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Google Drive リンク (空欄で自動生成)</label>
                <input type="url" placeholder="https://drive.google.com/..." className={inputClass} value={newProject.driveLink} onChange={e => setNewProject({...newProject, driveLink: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-indigo-700 transition-all active:scale-[0.98] mt-2">
                {isEditMode ? 'プロジェクトを更新' : 'プロジェクトを作成'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}