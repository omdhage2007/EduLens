import { useState } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Send, Bot, User, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { SEED_STUDENTS } from '../lib/seedData';

const DEMO = SEED_STUDENTS[0];

const TEACHER_REMARKS = [
  { subject: 'Math', teacher: 'Mr. Sharma', date: 'Apr 5', remark: 'Arjun needs to focus more on algebraic methods. Missing steps in problem-solving.' },
  { subject: 'Science', teacher: 'Ms. Patel', date: 'Apr 3', remark: 'Good effort in lab work. Theory concepts need revision, especially chemical reactions.' },
  { subject: 'English', teacher: 'Mrs. Gupta', date: 'Apr 1', remark: 'Essay structure is improving. Work on grammar and vocabulary expansion.' },
];

const QUICK_PROMPTS = [
  "What should I study next?",
  "How can I improve my Math score?",
  "Give me a weekly study plan",
  "What are my weakest topics?",
  "How much time should I spend on each subject?",
];

interface Message { role: 'user' | 'ai'; content: string; }

export default function FeedbackTab() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content: `Hi! I'm your personal EduLens AI tutor. Based on your profile, here's what I see:\n\n**Current Score:** ${DEMO.score}% | **Attendance:** ${DEMO.attendance}% | **Risk Level:** ${DEMO.riskLevel}\n\n**Priority Focus:** Your weakest areas are in **${(DEMO.topicMastery || []).filter(t => t.label === 'Needs Work').slice(0, 2).map(t => t.topic).join(' and ')}**.\n\nAsk me anything about your studies, and I'll give you a personalized plan! 🎯`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const getStudentContext = () => {
    const weakTopics = (DEMO.topicMastery || []).filter(t => t.label === 'Needs Work').map(t => `${t.subject}:${t.topic}`).join(', ');
    const subScores = (DEMO.subjectScores || []).map(s => `${s.subject}:${s.score}%`).join(', ');
    return `Student Profile: Name=${DEMO.name}, Grade=${DEMO.grade}, Overall Score=${DEMO.score}%, Attendance=${DEMO.attendance}%, Risk=${DEMO.riskLevel}. Subject Scores: ${subScores}. Weak Topics: ${weakTopics}. Assignment Completion: ${DEMO.assignments}%.`;
  };

  const handleSend = async (msg?: string) => {
    const text = msg || input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      const context = getStudentContext();
      const history = messages.slice(-4).map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`).join('\n');

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `You are EduLens AI Tutor — a warm, encouraging personal tutor for a student. You have their performance data. Give SPECIFIC, ACTIONABLE advice. Always include: what to study, how long, and in what order. Be motivating but honest. Use markdown for structure. Keep responses concise (under 200 words). Student data: ${context}`,
          messages: [
            ...(history ? [{ role: 'user', content: `Previous conversation:\n${history}\n\nNew question: ${text}` }] : [{ role: 'user', content: text }])
          ],
        }),
      });

      const data = await response.json();
      const reply = data.content?.find((b: any) => b.type === 'text')?.text || "I'm having trouble connecting right now. Please try again.";
      setMessages(prev => [...prev, { role: 'ai', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: "Connection issue. Please try again in a moment." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare size={22} className="text-[#818cf8]" />
        <h2 className="font-syne text-3xl font-extrabold text-white">Feedback & <span className="text-[#38bdf8]">AI Assistant</span></h2>
      </div>

      {/* Teacher Remarks */}
      <div className="rounded-2xl border border-white/10 bg-[#0f1a2e] p-6">
        <h3 className="mb-4 font-syne text-lg font-bold text-white">Teacher Remarks</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {TEACHER_REMARKS.map((r, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="rounded-full bg-[#38bdf8]/10 px-2 py-0.5 text-[10px] font-bold text-[#38bdf8]">{r.subject}</span>
                <span className="text-[10px] text-[#64748b]">{r.date}</span>
              </div>
              <p className="font-instrument text-sm text-[#94a3b8]">{r.remark}</p>
              <p className="mt-2 text-[10px] font-bold text-[#64748b]">— {r.teacher}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI Personalized Plan */}
      <div className="rounded-2xl border border-[#818cf8]/20 bg-[#0f1a2e] p-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={18} className="text-[#818cf8]" />
          <h3 className="font-syne text-lg font-bold text-white">AI-Generated Study Plan</h3>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            `📚 Focus on **Algebra Unit 2** — do 20 mixed problems/day for 2 weeks`,
            `📐 Trigonometry: review identities daily, attempt 5 application problems`,
            `⏱ Study schedule: Math 45min → Science 30min → English 20min`,
            `🎯 You're improving in Physics — keep momentum with weekly quizzes`,
          ].map((tip, i) => (
            <div key={i} className="flex gap-2 rounded-xl border border-[#818cf8]/10 bg-[#818cf8]/5 p-3">
              <p className="font-instrument text-sm text-[#94a3b8]">{tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI Chat */}
      <div className="rounded-2xl border border-white/10 bg-[#0f1a2e] overflow-hidden">
        <div className="border-b border-white/10 px-6 py-4 flex items-center gap-2">
          <Bot size={18} className="text-[#38bdf8]" />
          <h3 className="font-syne text-lg font-bold text-white">Chat with AI Tutor</h3>
        </div>

        {/* Quick prompts */}
        <div className="flex flex-wrap gap-2 px-6 pt-4">
          {QUICK_PROMPTS.map((p, i) => (
            <button key={i} onClick={() => handleSend(p)} disabled={loading}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 font-instrument text-xs text-[#94a3b8] transition-all hover:border-[#38bdf8]/30 hover:text-white disabled:opacity-50">
              {p}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="h-[360px] overflow-y-auto p-6 space-y-4">
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
            placeholder="Ask your AI tutor anything…"
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
