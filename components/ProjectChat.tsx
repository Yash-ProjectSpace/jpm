'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Smile, Loader2 } from 'lucide-react';

// The emojis we will allow users to react with
const ALLOWED_EMOJIS = ['👍', '❤️', '🔥', '👀', '✅'];

// TypeScript shapes for our data
type Reaction = {
  id: string;
  emoji: string;
  user: { name: string | null };
};

type Message = {
  id: string;
  text: string;
  createdAt: string;
  author: { id: string; name: string | null; role: string }; // <-- CHANGED from 'user' to 'author'
  reactions: Reaction[];
};

export default function ProjectChat({ projectId, currentUserId }: { projectId: string, currentUserId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [activeEmojiPicker, setActiveEmojiPicker] = useState<string | null>(null); // tracks which message ID has the picker open

  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Messages on Load
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/messages`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (error) {
        console.error("Failed to fetch messages", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMessages();
  }, [projectId]);

  // 2. Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 3. Send a Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
      });

      if (res.ok) {
        const newMessage = await res.json();
        setMessages((prev) => [...prev, newMessage]);
        setInputText(''); // Clear input
      }
    } catch (error) {
      console.error("Failed to send message", error);
    } finally {
      setIsSending(false);
    }
  };

  // 4. Toggle an Emoji Reaction
  const handleReaction = async (messageId: string, emoji: string) => {
    setActiveEmojiPicker(null); // Close picker instantly
    
    try {
      const res = await fetch(`/api/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });

      if (res.ok) {
        // Refresh messages to show the new reaction
        const updatedRes = await fetch(`/api/projects/${projectId}/messages`);
        const updatedData = await updatedRes.json();
        setMessages(updatedData);
      }
    } catch (error) {
      console.error("Failed to toggle reaction", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 bg-slate-50 rounded-3xl border border-slate-200">
        <Loader2 className="animate-spin text-indigo-500" size={24} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[500px] bg-slate-50 rounded-[2rem] border border-slate-200 overflow-hidden shadow-inner">
      
      {/* Chat History Area */}
      <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-6">
        {messages.length === 0 ? (
          <div className="text-center text-slate-400 text-sm mt-10 font-medium">
            まだメッセージはありません。会話を始めましょう！ (No messages yet)
          </div>
        ) : (
            messages.map((msg) => {
            // CHANGED: 'user' is now 'author', and added '?' for safety!
            const isMe = msg.author?.id === currentUserId;

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {/* Name & Role Tag */}
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className="text-xs font-bold text-slate-500">{msg.author?.name}</span>
                  {msg.author.role === 'MANAGER' && (
                    <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-black tracking-wider">ADMIN</span>
                  )}
                </div>

                {/* Chat Bubble & Emoji Button Wrapper */}
                <div className={`relative group flex items-center gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  
                  {/* The Bubble */}
                  <div className={`px-5 py-3 rounded-2xl max-w-sm text-sm shadow-sm ${
                    isMe 
                      ? 'bg-indigo-600 text-white rounded-tr-sm' 
                      : 'bg-white text-slate-800 border border-slate-100 rounded-tl-sm'
                  }`}>
                    {msg.text}
                  </div>

                  {/* Add Reaction Button (Shows on Hover) */}
                  <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setActiveEmojiPicker(activeEmojiPicker === msg.id ? null : msg.id)}
                      className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-full transition-colors"
                    >
                      <Smile size={16} />
                    </button>

                    {/* The Pop-up Emoji Picker */}
                    {activeEmojiPicker === msg.id && (
                      <div className={`absolute top-8 ${isMe ? 'right-0' : 'left-0'} bg-white border border-slate-200 shadow-xl rounded-full p-1.5 flex gap-1 z-10`}>
                        {ALLOWED_EMOJIS.map((emoji) => (
                          <button 
                            key={emoji}
                            onClick={() => handleReaction(msg.id, emoji)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-full text-lg transition-transform hover:scale-110"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Display Active Reactions */}
                {msg.reactions.length > 0 && (
                  <div className={`flex gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {msg.reactions.map((r, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 text-xs px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                        <span>{r.emoji}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="メッセージを入力..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
          <button 
            type="submit" 
            disabled={!inputText.trim() || isSending}
            className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-indigo-200 flex items-center justify-center w-12"
          >
            {isSending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}