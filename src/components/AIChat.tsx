import { useState } from 'react';
import { motion } from 'motion/react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { SEED_STUDENTS, CLASS_SUBJECT_GAPS } from '../lib/seedData';

interface Message { role: 'user' | 'ai'; content: string; }

const QUICK_PROMPTS = [
  "Who is most at risk right now?",
  "Which subject has the most learning gaps?",
  "How to improve class attendance?",
  "Give me an intervention plan for high-risk students",
  "Tips for personalised learning?",
  "Generate a summary of class performance",
];

function buildContext() {
  const highRisk = SEED_STUDENTS.filter(s => s.riskLevel === 'HIGH').map(s => `${s.name}(score:${s.score}%,att:${s.attendance}%)`).join(', ');
  const avgScore = Math.round(SEED_STUDENTS.reduce((a, s) => a + s.score, 0) / SEED_STUDENTS.length);
  const avgAtt = Math.round(SEED_STUDENTS.reduce((a, s) => a + s.attendance, 0) / SEED_STUDENTS.length);
  const gapSummary = CLASS_SUBJECT_GAPS.map(g => `${g.subject}:${g.struggling} struggling`).join(', ');
  return `School data — Total students: ${SEED_STUDENTS.length}, Class avg score: ${avgScore}%, Avg attendance: ${avgAtt}%. High-risk students: ${highRisk}. Subject gaps: ${gapSummary}.`;
}

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: "Hi! I'm EduLens AI, your school analytics assistant. Ask me about student performance, learning gaps, attendance patterns, or teaching strategies. I have real-time access to your class data! 📊" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (msg?: string) => {
    const text = msg || input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      const context = buildContext();
      const history = messages.slice(-6).map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      }));

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `You are EduLens AI, an intelligent assistant for school administrators and teachers. You have access to real student data. Provide specific, data-driven insights. Be practical and educator-focused. Use markdown for structure. Keep responses concise. School data context: ${context}`,
          messages: [
            ...history,
            { role: 'user', content: text },
          ],
        }),
      });

      const data = await response.json();
      const reply = data.content?.find((b: any) => b.type === 'text')?.text || "I'm having trouble connecting. Please try again.";
      setMessages(prev => [...prev, { role: 'ai', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: "Connection issue. Please try again in a moment." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mx-auto max-w-4xl space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={22} className="text-[#818cf8]" />
          <h2 className="font-syne text-3xl font-extrabold text-white">AI <span className="text-[#38bdf8]">Assistant</span></h2>
        </div>
        <p className="font-instrument text-[#64748b]">Powered by Claude. Ask about performance, learning gaps, or strategies.</p>
      </div>

      {/* Quick prompts */}
      <div className="flex flex-wrap gap-2">
        {QUICK_PROMPTS.map((p, i) => (
          <button key={i} onClick={() => handleSend(p)} disabled={loading}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 font-instrument text-xs text-[#94a3b8] transition-all hover:border-[#38bdf8]/30 hover:text-white disabled:opacity-50">
            {p}
          </button>
        ))}
      </div>

      <div className="flex h-[600px] flex-col rounded-3xl border border-white/10 bg-[#0f1a2e] shadow-2xl overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${m.role === 'ai' ? 'bg-[#38bdf8]/10 text-[#38bdf8]' : 'bg-[#818cf8]/10 text-[#818cf8]'}`}>
                {m.role === 'ai' ? <Bot size={16} /> : <User size={16} />}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${m.role === 'ai' ? 'bg-white/5 text-[#94a3b8]' : 'bg-[#38bdf8] text-[#050a12]'}`}>
                {m.role === 'ai'
                  ? <div className="font-instrument text-sm prose prose-invert prose-sm max-w-none"><ReactMarkdown>{m.content}</ReactMarkdown></div>
                  : <p className="font-instrument text-sm font-bold">{m.content}</p>
                }
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#38bdf8]/10 text-[#38bdf8]"><Bot size={16} /></div>
              <div className="rounded-2xl bg-white/5 px-4 py-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map(j => <div key={j} className="h-2 w-2 rounded-full bg-[#38bdf8] animate-bounce" style={{ animationDelay: `${j * 0.15}s` }} />)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-white/10 p-4 flex gap-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask about students, performance, strategies…"
            className="flex-1 rounded-xl border border-white/10 bg-[#0b1220] px-4 py-2.5 font-instrument text-sm text-white outline-none focus:border-[#38bdf8] transition-colors"
          />
          <button onClick={() => handleSend()} disabled={loading || !input.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#38bdf8] text-[#050a12] transition-all hover:bg-[#7dd3fc] disabled:opacity-40">
            <Send size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
