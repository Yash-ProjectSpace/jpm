import React from 'react';

export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-900">Workspace Overview</h1>
      <p className="text-slate-500 mt-2">Welcome to JPM. Here is what is happening today.</p>
      
      {/* Temporary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Active Projects</p>
          <p className="text-3xl font-bold text-indigo-600 mt-1">12</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Tasks Due</p>
          <p className="text-3xl font-bold text-rose-500 mt-1">5</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Team Members</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">8</p>
        </div>
      </div>
    </div>
  );
}