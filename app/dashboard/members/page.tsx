'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Mail, ShieldCheck, MessageSquare, Loader2, Send, ArrowLeft
} from 'lucide-react';
import { useSession } from "next-auth/react"; 

export default function MembersPage() {
  const { data: session } = useSession(); 
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [dbMembers, setDbMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Chat States
  const [isChatting, setIsChatting] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchDatabaseMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/members');
      if (res.ok) {
        const data = await res.json();
        setDbMembers(Array.isArray(data) ? data : (data.members || []));
      }
    } catch (e) {
      console.error("Failed to fetch DB members", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabaseMembers();
  }, []);

  // REAL-TIME: Fetch chat history when entering chat mode
  useEffect(() => {
    if (isChatting && selectedMember && session?.user) {
      const loadHistory = async () => {
        try {
          const res = await fetch(`/api/messages/direct?receiverId=${selectedMember.id}`);
          if (res.ok) {
            const data = await res.json();
            // Map DB messages to UI format
            setChatHistory(data.map((m: any) => ({
              id: m.id,
              sender: m.senderId === (session.user as any).id ? 'me' : 'them',
              text: m.text,
              time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            })));
          }
        } catch (error) {
          console.error("History load failed", error);
        }
      };
      loadHistory();
    }
  }, [isChatting, selectedMember, session]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // REAL-TIME: Save message to Database
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedMember) return;

    const currentText = messageText;
    setMessageText(""); // Clear input immediately for UX

    try {
      const res = await fetch('/api/messages/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: selectedMember.id,
          text: currentText
        }),
      });

      if (res.ok) {
        const savedMsg = await res.json();
        setChatHistory(prev => [...prev, {
          id: savedMsg.id,
          sender: 'me',
          text: savedMsg.text,
          time: new Date(savedMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      } else {
        alert("Failed to send message");
      }
    } catch (error) {
      console.error("Send failed", error);
    }
  };

  const closeModal = () => {
    setSelectedMember(null);
    setIsChatting(false);
    setChatHistory([]);
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen relative">
      <header className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            チームメンバー <span className="text-indigo-600">({dbMembers.length})</span>
          </h1>
          <p className="text-slate-500 mt-1 text-[10px] font-black uppercase tracking-[0.3em]">JMC Team Directory</p>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {dbMembers.map((member) => (
            <div 
              key={member.id} 
              onClick={() => setSelectedMember(member)}
              className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col items-center text-center"
            >
              <div className="w-24 h-24 rounded-full bg-slate-50 mb-4 overflow-hidden border-4 border-slate-50 shadow-inner group-hover:scale-105 transition-transform relative">
                <img src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=f1f5f9&color=6366f1&bold=true`} alt={member.name} className="w-full h-full object-cover" />
                {member.role === 'MANAGER' && (
                  <div className="absolute bottom-0 right-0 bg-indigo-600 text-white p-1.5 rounded-full border-2 border-white shadow-sm"><ShieldCheck size={14} /></div>
                )}
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-1">{member.name}</h3>
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-3 ${member.role === 'MANAGER' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-500'}`}>{member.role}</span>
              <p className="text-xs font-bold text-slate-500 flex items-center justify-center gap-1.5"><Mail size={12} /> {member.email}</p>
            </div>
          ))}
        </div>
      )}

      {/* MODAL WINDOW */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={closeModal}></div>

          <div className="bg-white rounded-[2.5rem] w-full max-w-md h-[600px] shadow-2xl relative z-10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-white shrink-0">
              {isChatting && (
                <button onClick={() => setIsChatting(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><ArrowLeft size={20} /></button>
              )}
              <div className="flex-1 flex items-center gap-3">
                <img src={selectedMember.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedMember.name)}&background=f1f5f9&color=6366f1&bold=true`} className="w-10 h-10 rounded-full border border-slate-100" />
                <div>
                  <h2 className="text-sm font-black text-slate-900 leading-tight">{selectedMember.name}</h2>
                  <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Active</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 bg-slate-50 rounded-full hover:bg-rose-50 hover:text-rose-600 text-slate-400 transition-colors"><X size={20} /></button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-hidden flex flex-col relative bg-slate-50/30">
              {!isChatting ? (
                /* PROFILE VIEW */
                <div className="p-10 flex flex-col items-center justify-center h-full text-center animate-in fade-in duration-300">
                   <div className="w-24 h-24 rounded-full bg-slate-50 overflow-hidden mb-4 border-4 border-white shadow-lg">
                    <img src={selectedMember.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedMember.name)}&background=f1f5f9&color=6366f1&bold=true`} alt={selectedMember.name} className="w-full h-full object-cover" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mb-2">{selectedMember.name}</h2>
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-8 ${selectedMember.role === 'MANAGER' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>{selectedMember.role}</span>
                  
                  <button 
                    onClick={() => setIsChatting(true)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95"
                  >
                    <MessageSquare size={18} /> Send Message
                  </button>
                </div>
              ) : (
                /* CHAT VIEW */
                <>
                  <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {chatHistory.length === 0 && (
                      <div className="text-center py-10">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">No Message History</p>
                      </div>
                    )}
                    {chatHistory.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                        <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-bold shadow-sm ${msg.sender === 'me' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'}`}>
                          {msg.text}
                          <p className={`text-[9px] mt-1 opacity-60 ${msg.sender === 'me' ? 'text-white' : 'text-slate-400'}`}>{msg.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input Bar */}
                  <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Type a message..." 
                      className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                    />
                    <button type="submit" className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"><Send size={18} /></button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}