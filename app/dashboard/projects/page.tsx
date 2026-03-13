'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, Calendar, Users, MessageSquare, Edit, 
  Trash2, HardDrive, Loader2, X 
} from 'lucide-react';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Modal State
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

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      setProjects(data);
      
      if (selectedProject) {
        const updated = data.find((p: any) => p.id === selectedProject.id);
        setSelectedProject(updated || (data.length > 0 ? data[0] : null));
      } else if (data.length > 0) {
        setSelectedProject(data[0]);
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

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
        fetchProjects();
      }
    } catch (error) {
      alert("削除に失敗しました");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = isEditMode ? 'PUT' : 'POST';
    
    try {
      const response = await fetch('/api/projects', {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      });

      if (response.ok) {
        setIsModalOpen(false);
        setIsEditMode(false);
        setNewProject({ id: '', name: '', description: '', status: '進行中', startDate: '', endDate: '', driveLink: '' });
        fetchProjects();
      }
    } catch (error) {
      alert("保存に失敗しました");
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
      
      {/* Header Section */}
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
        {/* Left Column: Project List */}
        <div className="w-1/3 flex flex-col gap-4 overflow-y-auto pr-2 pb-20">
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
              {/* Sidebar Date Visibility Fix */}
              <p className="text-xs text-slate-700 font-semibold mt-2 flex items-center gap-1">
                <Calendar size={12} /> {project.endDate ? new Date(project.endDate).toLocaleDateString() : '未設定'}
              </p>
            </div>
          ))}
        </div>

        {/* Right Column: Project Details */}
        {selectedProject ? (
          <div className="w-2/3 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            <div className="p-8 border-b border-slate-100 shrink-0">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-black text-slate-900">{selectedProject.name}</h2>
                <div className="flex gap-2">
                  <button onClick={() => handleEditClick(selectedProject)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit size={18} /></button>
                  <button onClick={() => handleDelete(selectedProject.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                </div>
              </div>
              <p className="text-sm text-slate-700 font-medium mb-6 leading-relaxed">{selectedProject.description || "説明はありません。"}</p>
              
              <div className="grid grid-cols-3 gap-4">
                {/* Schedule Visibility Fix */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-2">
                    <Calendar size={16} className="text-indigo-600" />スケジュール
                  </div>
                  <p className="text-[11px] text-slate-800 font-bold tracking-tight">
                    {new Date(selectedProject.startDate).toLocaleDateString()} 〜 {new Date(selectedProject.endDate).toLocaleDateString()}
                  </p>
                </div>

                {/* Drive Link Visibility Fix */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-2">
                    <HardDrive size={16} className="text-blue-500" />Drive
                  </div>
                  {selectedProject.driveLink ? (
                    <a href={selectedProject.driveLink} target="_blank" className="text-[11px] text-blue-700 underline font-extrabold">フォルダを開く</a>
                  ) : (
                    <span className="text-[11px] text-slate-500 font-medium tracking-tight">リンクなし</span>
                  )}
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-2"><Users size={16} className="text-emerald-500" />チーム</div>
                  <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border-2 border-white"><Plus size={12} /></div>
                </div>
              </div>
            </div>

            {/* Chat Section Visibility Fix */}
            <div className="flex-1 bg-slate-50/50 p-8 flex flex-col min-h-0">
               <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                 <MessageSquare size={16} className="text-indigo-600" />チャット
               </h3>
               <div className="flex-1 flex flex-col items-center justify-center text-slate-700 font-semibold text-sm">
                 <p className="opacity-60 italic tracking-wide">メッセージはまだありません。</p>
               </div>
            </div>
          </div>
        ) : (
          <div className="w-2/3 bg-white rounded-3xl border border-slate-200 border-dashed flex items-center justify-center text-slate-500 font-bold">プロジェクトを選択してください</div>
        )}
      </div>

      {/* Modal */}
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
                <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Google Drive リンク</label>
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