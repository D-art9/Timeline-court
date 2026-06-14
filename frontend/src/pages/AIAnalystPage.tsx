import React, { useState } from 'react';
import { Sparkles, Send, Brain, Bot, Compass, Crosshair, Clipboard } from 'lucide-react';
import { api } from '../data/api';

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const PRESETS = [
  {
    label: 'Generate Matchup Explanation',
    prompt: 'Can you explain why the 1996 Chicago Bulls matchup well against modern perimeter-focused systems like the 2017 Warriors?',
    icon: Crosshair,
    color: 'text-cyber-cyan border-cyber-cyan/30 bg-cyber-cyan/10'
  },
  {
    label: 'Roster Improvement Ideas',
    prompt: 'How can I optimize a standard 5-man historical roster to balance defensive rating with high shooting efficiency (TS%)?',
    icon: Clipboard,
    color: 'text-brand-purple border-brand-purple/30 bg-brand-purple/10'
  },
  {
    label: 'Ask Historical Questions',
    prompt: 'How did the league pace (possessions per game) change from the defensive-heavy 1990s to the modern Pace & Space era?',
    icon: Compass,
    color: 'text-amber-gold border-amber-gold/30 bg-amber-gold/10'
  }
];

export const AIAnalystPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'assistant',
      text: 'Greetings Analyst. I am your advanced AI Coach. Send a custom query or select a preset option below to generate detailed basketball metrics insights.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await api.getAIAnalysis(textToSend);
      const assistantMsg: ChatMessage = {
        sender: 'assistant',
        text: res.analysis || 'No analysis returned from model.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e) {
      console.error(e);
      const errMsg: ChatMessage = {
        sender: 'assistant',
        text: 'Error generating AI analysis. Please check backend connection state.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pr-2">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            AI Coach & Analyst
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Ask advanced analytical questions, explore roster improvements, and compare historical metrics.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Presets Column */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[#0F1424]/90 backdrop-blur-xl border border-white/[0.03] rounded-3xl p-5 space-y-4 shadow-2xl relative overflow-hidden">
            {/* Ambient Background Radial */}
            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-32 h-32 rounded-full bg-brand-blue/5 blur-[50px]" />
            
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-cyber-cyan" />
              Presets Actions
            </h3>
            
            <div className="flex flex-col gap-3 relative z-10">
              {PRESETS.map((p, idx) => {
                const IconComponent = p.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSend(p.prompt)}
                    className="w-full text-left p-3.5 rounded-2xl border border-white/[0.04] hover:border-white/10 bg-black/40 hover:bg-black/60 hover:scale-[1.03] transition-all duration-300 hover:shadow-lg hover:shadow-black/25 flex gap-3 group"
                  >
                    <div className={`h-8 w-8 rounded-lg border flex items-center justify-center shrink-0 ${p.color}`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="space-y-1 overflow-hidden">
                      <span className="font-bold text-[10px] text-white group-hover:text-cyber-cyan transition-colors uppercase block truncate">{p.label}</span>
                      <p className="text-[11px] leading-relaxed line-clamp-2 text-zinc-400">{p.prompt}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chat Window Column */}
        <div className="lg:col-span-3 bg-[#0F1424]/90 backdrop-blur-xl border border-white/[0.03] rounded-3xl p-6 flex flex-col h-[520px] justify-between shadow-2xl relative overflow-hidden">
          
          {/* Animated Ambient Mesh Background */}
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-gradient-radial-mesh animate-mesh-slow" />

          {/* Header */}
          <div className="flex items-center gap-2 pb-4 border-b border-white/[0.05] relative z-10">
            <Bot className="h-5 w-5 text-cyber-cyan" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Active Analytical Engine</span>
          </div>

          {/* Message Area */}
          <div className="flex-grow overflow-y-auto my-4 space-y-4 pr-1 relative z-10">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed space-y-2 border ${
                    m.sender === 'user'
                      ? 'bg-[#0B0F19]/80 border-white/10 text-white'
                      : 'bg-black/65 border-white/[0.03] text-zinc-300 border-l-[3px] border-l-amber-gold'
                  }`}
                >
                  {m.text.startsWith('###') ? (
                    <div className="space-y-3">
                      {m.text.split('\n\n').map((block, bIdx) => {
                        if (block.startsWith('###')) {
                          return <h4 key={bIdx} className="font-bold text-white text-sm border-b border-white/5 pb-1">{block.replace('###', '')}</h4>;
                        }
                        if (block.startsWith('**') || block.startsWith('1.')) {
                          return <p key={bIdx} className="text-zinc-300 font-medium whitespace-pre-line">{block}</p>;
                        }
                        return <p key={bIdx} className="text-zinc-400 whitespace-pre-line">{block}</p>;
                      })}
                    </div>
                  ) : (
                    <p className="whitespace-pre-line">{m.text}</p>
                  )}
                </div>
                <span className="text-[9px] text-zinc-500 mt-1 px-1">{m.timestamp}</span>
              </div>
            ))}

            {isTyping && (
              <div className="flex flex-col items-start">
                <div className="rounded-2xl p-3 bg-black/60 border border-white/[0.03] text-zinc-400 text-xs flex items-center gap-3">
                  <div className="relative flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-cyan opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-cyber-cyan/50 items-center justify-center">
                      <Sparkles className="h-2.5 w-2.5 text-white" />
                    </span>
                  </div>
                  <span className="animate-pulse">Coach is calculating response matrix...</span>
                </div>
              </div>
            )}
          </div>

          {/* Form Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex gap-3 pt-4 border-t border-white/[0.05] relative z-10"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask coach about cross-era stats, pace adjustments..."
              className="bg-black/40 border border-white/10 text-white text-xs rounded-xl px-4 py-3.5 flex-grow focus:outline-none focus:ring-1 focus:ring-cyber-cyan focus:border-cyber-cyan transition-all"
            />
            <button
              type="submit"
              className={`p-3.5 rounded-xl transition-all duration-300 shadow-lg flex items-center justify-center shrink-0 hover:scale-105 ${
                input.trim() 
                  ? 'bg-cyber-cyan text-black shadow-cyber-cyan/25 hover:bg-cyan-400' 
                  : 'bg-white hover:bg-zinc-200 text-black'
              }`}
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
