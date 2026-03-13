'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, Circle, Clock, AlertCircle, 
  Filter, ListTodo, Plus, Search, Loader2, X, ChevronRight, Trash2, Calendar, ArrowLeft, Edit2, Check, ListChecks, BarChart3, Target, Activity, Zap, Archive, Inbox, MousePointer2
} from 'lucide-react';

// Professional Palette for Projects
const PROJECT_COLORS: Record<string, { bg: string; text: string; border: string; bar: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', bar: 'bg-blue-600' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', bar: 'bg-emerald-600' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', bar: 'bg-rose-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', bar: 'bg-amber-600' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-100', bar: 'bg-violet-600' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100', bar: 'bg-indigo-600' },
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>(''); 
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active'); 
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(''); 
  
  const [editingTask, setEditingTask] = useState<any>(null);
  const [editingCheckIdx, setEditingCheckIdx] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCheckItem, setNewCheckItem] = useState('');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
    projectId: ''
  });

  // Load View Mode preference from LocalStorage
  useEffect(() => {
    const savedMode = localStorage.getItem('task_view_mode');
    if (savedMode === 'active' || savedMode === 'archived') {
      setViewMode(savedMode);
    }
  }, []);

  const handleViewModeChange = (mode: 'active' | 'archived') => {
    setViewMode(mode);
    localStorage.setItem('task_view_mode', mode);
  };

  // Analytics Logic
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'DONE').length;
    const pending = total - completed;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, rate };
  }, [tasks]);

  const getProjectTheme = (projectName?: string) => {
    if (!projectName) return PROJECT_COLORS.indigo;
    const colors = Object.keys(PROJECT_COLORS);
    const index = projectName.length % colors.length;
    return PROJECT_COLORS[colors[index]];
  };

  const fetchProjects = async () => {
    const res = await fetch('/api/projects');
    const data = await res.json();
    setProjects(data);
    if (data.length > 0 && !newTask.projectId) {
      setNewTask(prev => ({ ...prev, projectId: data[0].id }));
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const url = selectedProjectId 
        ? `/api/tasks/smart-list?projectId=${selectedProjectId}` 
        : '/api/tasks/smart-list';
      const res = await fetch(url);
      const data = await res.json();
      setTasks(data);
      if (editingTask) {
        const updated = data.find((t: any) => t.id === editingTask.id);
        if (updated) setEditingTask(updated);
      }
    } catch (error) {
      console.error("Fetch failed", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);
  useEffect(() => { fetchTasks(); }, [selectedProjectId]);

  const syncTaskUpdate = async (updatedFields: any) => {
    if (!editingTask) return;
    try {
      await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingTask.id, ...updatedFields }),
      });
      fetchTasks();
    } catch (error) {
      console.error("Update failed", error);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask),
    });
    if (res.ok) {
      setIsModalOpen(false);
      setNewTask({ ...newTask, title: '', description: '', dueDate: '' });
      fetchTasks();
    }
  };

  const toggleTaskStatus = async (task: any) => {
    const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    if (editingTask?.id === task.id) setEditingTask({ ...editingTask, status: newStatus });
    try {
      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, status: newStatus }),
      });
      if (!res.ok) throw new Error();
    } catch (error) {
      fetchTasks();
      alert("Error syncing status");
    }
  };

  const toggleChecklistItem = async (task: any, index: number) => {
    const newChecklist = [...(task.checklist || [])];
    newChecklist[index].completed = !newChecklist[index].completed;
    const allDone = newChecklist.length > 0 && newChecklist.every(item => item.completed);
    const newStatus = allDone ? 'DONE' : 'TODO';
    setTasks(tasks.map(t => t.id === task.id ? { ...t, checklist: newChecklist, status: newStatus } : t));
    if (editingTask?.id === task.id) setEditingTask({ ...editingTask, checklist: newChecklist, status: newStatus });
    await syncTaskUpdate({ checklist: newChecklist, status: newStatus });
  };

  const addChecklistItem = async () => {
    if (!newCheckItem.trim()) return;
    const newChecklist = [...(editingTask.checklist || []), { text: newCheckItem, completed: false }];
    const newStatus = 'TODO';
    const res = await fetch('/api/tasks', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingTask.id, checklist: newChecklist, status: newStatus }),
    });
    if (res.ok) {
      setNewCheckItem('');
      fetchTasks();
    }
  };

  const deleteChecklistItem = async (index: number) => {
    const newChecklist = [...(editingTask.checklist || [])];
    newChecklist.splice(index, 1);
    const allDone = newChecklist.length > 0 && newChecklist.every(item => item.completed);
    const newStatus = allDone ? 'DONE' : (newChecklist.length === 0 ? editingTask.status : 'TODO');
    setEditingTask({ ...editingTask, checklist: newChecklist, status: newStatus });
    await syncTaskUpdate({ checklist: newChecklist, status: newStatus });
  };

  const updateChecklistItemText = async (index: number, newText: string) => {
    const newChecklist = [...(editingTask.checklist || [])];
    newChecklist[index].text = newText;
    setEditingTask({ ...editingTask, checklist: newChecklist });
    await syncTaskUpdate({ checklist: newChecklist });
    setEditingCheckIdx(null);
  };

  const toggleAllSubtasks = async () => {
    if (!editingTask.checklist || editingTask.checklist.length === 0) return;
    const allCompleted = editingTask.checklist.every((item: any) => item.completed);
    const nextState = !allCompleted;
    const newChecklist = editingTask.checklist.map((item: any) => ({ ...item, completed: nextState }));
    const newStatus = nextState ? 'DONE' : 'TODO';
    setEditingTask({ ...editingTask, checklist: newChecklist, status: newStatus });
    await syncTaskUpdate({ checklist: newChecklist, status: newStatus });
  };

  const filteredAndSortedTasks = useMemo(() => {
    let result = tasks.filter((task) => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (task.description?.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesPriority = selectedPriority ? task.priority === selectedPriority : true;
      const matchesViewMode = viewMode === 'active' ? task.status !== 'DONE' : task.status === 'DONE';
      return matchesSearch && matchesPriority && matchesViewMode;
    });

    const priorityWeight: any = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
    return result.sort((a, b) => {
      if (priorityWeight[b.priority] !== priorityWeight[a.priority]) return priorityWeight[b.priority] - priorityWeight[a.priority];
      return new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime();
    });
  }, [tasks, searchQuery, selectedPriority, viewMode]);

  const subTaskProgress = editingTask?.checklist?.length > 0 
    ? Math.round((editingTask.checklist.filter((i: any) => i.completed).length / editingTask.checklist.length) * 100)
    : 0;

  const inputClass = "w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-bold bg-white mt-1";

  return (
    <div className="p-8 bg-slate-50 min-h-screen relative overflow-hidden">
      {/* 1. Dashboard Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600"><BarChart3 size={28} /></div>
          <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">全タスク</p><p className="text-2xl font-black text-slate-900">{stats.total}</p></div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600"><Activity size={28} /></div>
          <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">進行中</p><p className="text-2xl font-black text-slate-900">{stats.pending}</p></div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600"><Target size={28} /></div>
          <div className="flex-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">達成率</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-black text-slate-900">{stats.rate}%</p>
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${stats.rate}%` }}></div></div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-8">
        <div><h1 className="text-3xl font-black text-slate-900 tracking-tight">タスク管理</h1><p className="text-slate-600 font-bold text-sm mt-1">{viewMode === 'active' ? 'Smart List: 現在進行中のタスク' : 'Archive: 完了済みのタスク一覧'}</p></div>
        <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg hover:bg-indigo-700 transition-all active:scale-95"><Plus size={20} /> タスク作成</button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="bg-slate-200/50 p-1.5 rounded-2xl flex items-center w-fit">
          <button onClick={() => handleViewModeChange('active')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${viewMode === 'active' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}><Inbox size={18} />進行中 ({stats.pending})</button>
          <button onClick={() => handleViewModeChange('archived')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${viewMode === 'archived' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}><Archive size={18} />アーカイブ ({stats.completed})</button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm flex items-center gap-3 flex-1">
          <Filter size={18} className="text-slate-400 ml-2" />
          <select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)} className="bg-transparent border-none text-sm font-bold text-slate-800 outline-none w-full cursor-pointer"><option value="">すべてのプロジェクト</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        </div>
        <div className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm flex items-center gap-3 flex-1">
          <Zap size={18} className="text-slate-400 ml-2" />
          <select value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value)} className="bg-transparent border-none text-sm font-bold text-slate-800 outline-none w-full cursor-pointer"><option value="">すべての優先度</option><option value="HIGH">高優先（レッド）</option><option value="MEDIUM">中優先（ブルー）</option><option value="LOW">低優先（グリーン）</option></select>
        </div>
        <div className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm flex items-center gap-3 flex-[1.5] relative">
          <Search size={18} className="text-slate-400 ml-2" />
          <input type="text" placeholder="タスクを検索..." className="bg-transparent border-none text-sm font-bold text-slate-800 outline-none w-full" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          {searchQuery && <span className="absolute right-6 text-[10px] font-black text-indigo-400 bg-indigo-50 px-2 py-1 rounded-lg">{filteredAndSortedTasks.length}件ヒット</span>}
        </div>
      </div>

      {/* Task List Rendering with Empty State Logic */}
      <div className="space-y-4">
        {loading ? ( 
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={40} /></div> 
        ) : filteredAndSortedTasks.length === 0 ? (
          /* EMPTY STATE DESIGN */
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              {viewMode === 'active' ? <Inbox className="text-slate-300" size={40} /> : <Archive className="text-slate-300" size={40} />}
            </div>
            <h3 className="text-xl font-black text-slate-900">
              {viewMode === 'active' ? 'タスクがありません' : 'アーカイブは空です'}
            </h3>
            <p className="text-slate-500 text-sm font-bold mt-2 text-center max-w-xs">
              {viewMode === 'active' 
                ? '新しくタスクを作成して、プロジェクトをスタートさせましょう！' 
                : '完了したタスクがここに保存され、後で確認できます。'}
            </p>
            <button 
              onClick={() => viewMode === 'active' ? setIsModalOpen(true) : handleViewModeChange('active')}
              className="mt-8 flex items-center gap-2 bg-indigo-50 text-indigo-600 px-6 py-2.5 rounded-xl font-black text-sm hover:bg-indigo-100 transition-all active:scale-95"
            >
              {viewMode === 'active' ? <Plus size={18} /> : <Inbox size={18} />}
              {viewMode === 'active' ? '最初のタスクを作成' : '進行中のリストに戻る'}
            </button>
          </div>
        ) : (
          filteredAndSortedTasks.map((task) => {
            const theme = getProjectTheme(task.project?.name);
            return (
              <div key={task.id} className={`bg-white p-6 rounded-[2rem] border transition-all group flex items-center justify-between shadow-sm hover:shadow-md hover:-translate-y-0.5 ${task.status === 'DONE' ? 'border-emerald-100 bg-emerald-50/10 opacity-75' : 'border-slate-100'}`}>
                <div className="flex items-center gap-6 flex-1 cursor-pointer" onClick={() => setEditingTask(task)}>
                  <button onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task); }} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${task.status === 'DONE' ? 'bg-emerald-500 text-white shadow-lg' : task.priority === 'HIGH' ? 'bg-rose-50 text-rose-600' : task.priority === 'MEDIUM' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {task.status === 'DONE' ? <CheckCircle2 size={24} /> : <ListTodo size={24} />}
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`text-lg font-black transition-all ${task.status === 'DONE' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{task.title}</h3>
                      <span className={`${theme.bg} ${theme.text} text-[10px] font-black px-2 py-0.5 rounded-md border ${theme.border} uppercase tracking-tighter`}>{task.project?.name || '未割当'}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1.5 border ${task.priority === 'HIGH' ? 'bg-rose-50 text-rose-600 border-rose-100' : task.priority === 'MEDIUM' ? 'bg-blue-50 text-blue-600 border-blue-100' : task.priority === 'LOW' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400'}`}><AlertCircle size={10} /> {task.priority === 'HIGH' ? '高' : task.priority === 'MEDIUM' ? '中' : '低'}</span>
                      <span className="text-xs text-slate-700 font-bold flex items-center gap-1"><Clock size={14} className="text-indigo-500" /> {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '期限なし'}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
              </div>
            );
          })
        )}
      </div>

      {/* Editing Modal Logic */}
      {editingTask && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-12 lg:p-24 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl h-[520px] rounded-[2.5rem] shadow-2xl p-10 animate-in fade-in zoom-in duration-300 relative flex flex-col overflow-hidden border border-slate-200">
            <div className="absolute top-0 left-0 w-full bg-slate-100 h-1.5 overflow-hidden shrink-0">
               <div className={`${getProjectTheme(editingTask.project?.name).bar} h-full transition-all duration-1000 ease-out`} style={{ width: `${subTaskProgress}%` }}></div>
            </div>
            <div className="flex justify-between items-center mb-6 mt-2 shrink-0">
              <button onClick={() => setEditingTask(null)} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors group"><ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /><span className="text-sm uppercase tracking-widest font-black">一覧に戻る</span></button>
              <button onClick={() => toggleTaskStatus(editingTask)} className={`flex items-center gap-2 px-5 py-2 rounded-xl font-black text-xs transition-all ${editingTask.status === 'DONE' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-indigo-100 text-indigo-600 shadow-sm border border-indigo-200 hover:bg-indigo-200'}`}>{editingTask.status === 'DONE' ? '✓ 完了済み' : '進行中に変更'}</button>
            </div>
            <div className="flex gap-10 flex-1 min-h-0">
              <div className="flex-[1.2] flex flex-col gap-4">
                <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">タスク名</label><div className="flex items-center gap-3"><input className="flex-1 text-2xl font-black text-slate-900 bg-transparent border-b-2 border-transparent focus:border-indigo-500 outline-none py-1 transition-all" value={editingTask.title} onChange={(e) => { setEditingTask({...editingTask, title: e.target.value}); syncTaskUpdate({ title: e.target.value }); }} /><span className={`${getProjectTheme(editingTask.project?.name).bg} ${getProjectTheme(editingTask.project?.name).text} text-[10px] font-black px-3 py-1 rounded-lg border ${getProjectTheme(editingTask.project?.name).border} uppercase whitespace-nowrap`}>{editingTask.project?.name || '未割当'}</span></div></div>
                <div className="flex-1 flex flex-col"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">詳細説明</label><textarea className="w-full flex-1 text-slate-700 font-medium text-xs leading-relaxed bg-slate-50 p-5 rounded-[2rem] border border-slate-100 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none mt-2 transition-all shadow-inner" value={editingTask.description || ''} onChange={(e) => { setEditingTask({...editingTask, description: e.target.value}); syncTaskUpdate({ description: e.target.value }); }} placeholder="説明を入力してください..." /></div>
              </div>
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex justify-between items-end mb-2"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">サブタスク ( {subTaskProgress} % )</label><button onClick={toggleAllSubtasks} className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100"><ListChecks size={14} /> {editingTask.checklist?.every((i: any) => i.completed) ? 'すべて解除' : 'すべて完了'}</button></div>
                <div className="flex-1 overflow-y-auto pr-2 space-y-2 no-scrollbar">
                  {(editingTask.checklist || []).map((item: any, i: number) => (
                    <div key={i} className="group flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-indigo-100 transition-all">
                      <button onClick={() => toggleChecklistItem(editingTask, i)}>{item.completed ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Circle size={18} className="text-slate-300 hover:text-indigo-400" />}</button>
                      {editingCheckIdx === i ? <input autoFocus className="flex-1 bg-transparent text-xs font-bold text-slate-800 outline-none border-b border-indigo-500" value={item.text} onBlur={(e) => updateChecklistItemText(i, e.target.value)} onKeyDown={(e) => e.key === 'Enter' && updateChecklistItemText(i, (e.target as HTMLInputElement).value)} onChange={(e) => { const nl = [...editingTask.checklist]; nl[i].text = e.target.value; setEditingTask({...editingTask, checklist: nl}); }} /> : <span onClick={() => setEditingCheckIdx(i)} className={`flex-1 text-xs font-bold cursor-text ${item.completed ? 'text-slate-400 line-through' : 'text-slate-800 hover:text-indigo-600'}`}>{item.text}</span>}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => setEditingCheckIdx(i)} className="p-1 text-slate-400 hover:text-indigo-600"><Edit2 size={12} /></button><button onClick={() => deleteChecklistItem(i)} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 size={12} /></button></div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-4 pt-2 bg-white border-t border-slate-50"><input type="text" placeholder="ステップを追加..." className="flex-1 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px] font-bold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-indigo-600" value={newCheckItem} onChange={(e) => setNewCheckItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()} /><button onClick={addChecklistItem} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-all"><Plus size={18} /></button></div>
              </div>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100 flex justify-between items-end shrink-0">
               <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">期限日（デッドライン）</label><div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 hover:bg-white transition-all cursor-pointer group"><Calendar size={14} className="text-indigo-600" /><input type="date" className="bg-transparent text-[11px] font-black text-slate-900 outline-none cursor-pointer" value={editingTask.dueDate ? editingTask.dueDate.split('T')[0] : ''} onChange={(e) => { const newDate = e.target.value; setEditingTask({...editingTask, dueDate: newDate}); syncTaskUpdate({ dueDate: new Date(newDate) }); }} /><span className="text-[9px] font-bold text-indigo-400 bg-indigo-50/50 px-2 py-0.5 rounded-md border border-indigo-100/50">クリックして変更</span></div></div>
               <button onClick={async () => { if(confirm("このタスクを削除しますか？")) { await fetch(`/api/tasks?id=${editingTask.id}`, { method: 'DELETE' }); setEditingTask(null); fetchTasks(); } }} className="flex items-center gap-2 px-6 py-2 rounded-xl text-rose-600 font-bold text-xs hover:bg-rose-50 transition-colors"><Trash2 size={16} /><span>タスクを削除する</span></button>
            </div>
          </div>
        </div>
      )}

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl p-8 animate-in fade-in zoom-in duration-200"><div className="flex justify-between items-center mb-8"><h3 className="text-2xl font-black text-slate-900 tracking-tight">新規タスク登録</h3><button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button></div><form onSubmit={handleCreateTask} className="space-y-6"><div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">所属プロジェクト</label><select className={inputClass} value={newTask.projectId} onChange={e => setNewTask({...newTask, projectId: e.target.value})}>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div><div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">タスク名</label><input required className={inputClass} placeholder="タスクの内容を入力..." value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} /></div><div className="grid grid-cols-2 gap-4"><div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">優先度</label><select className={inputClass} value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}><option value="LOW">低</option><option value="MEDIUM">中</option><option value="HIGH">高</option></select></div><div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">期限日</label><input type="date" className={inputClass} value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} /></div></div><button type="submit" className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-indigo-600 transition-all mt-4">登録する</button></form></div>
        </div>
      )}
    </div>
  );
}