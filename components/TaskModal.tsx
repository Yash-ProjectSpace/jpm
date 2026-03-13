'use client';
import { X, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function TaskModal({ isOpen, onClose, projectId, onCreated }: any) {
  const [task, setTask] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
    checklist: [] as { text: string, completed: boolean }[]
  });

  const addChecklistItem = () => {
    setTask({ ...task, checklist: [...task.checklist, { text: '', completed: false }] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ ...task, projectId })
    });
    if (res.ok) { onCreated(); onClose(); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl p-8 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-black text-slate-900">新しいタスク</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">タスク名</label>
            <input 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 font-bold outline-none focus:ring-2 focus:ring-indigo-600" 
              placeholder="何をする必要がありますか？"
              onChange={e => setTask({...task, title: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">優先度</label>
              <select 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 font-bold outline-none appearance-none bg-white"
                onChange={e => setTask({...task, priority: e.target.value})}
              >
                <option value="LOW">低</option>
                <option value="MEDIUM">中</option>
                <option value="HIGH">高</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">期限</label>
              <input 
                type="date" 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 font-bold outline-none"
                onChange={e => setTask({...task, dueDate: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">チェックリスト</label>
            {task.checklist.map((item, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input 
                  className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-medium" 
                  placeholder="ステップを追加..."
                  onChange={(e) => {
                    const newList = [...task.checklist];
                    newList[i].text = e.target.value;
                    setTask({...task, checklist: newList});
                  }}
                />
              </div>
            ))}
            <button 
              type="button" 
              onClick={addChecklistItem}
              className="mt-2 text-indigo-600 font-bold text-sm flex items-center gap-1 hover:underline"
            >
              <Plus size={16}/> ステップを追加
            </button>
          </div>

          <button className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-indigo-600 transition-all">
            タスクを登録
          </button>
        </form>
      </div>
    </div>
  );
}