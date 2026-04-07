import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { CLASS_SUBJECT_GAPS } from '../lib/seedData';
import { UserProfile, TopicMastery, Student } from '../types';
import { Brain, ChevronDown, ChevronUp, Loader } from 'lucide-react';
import { subscribeStudents } from '../lib/firebaseService';

interface Props { user: UserProfile; isTeacher?: boolean; }

const MASTERY_COLOR: Record<string, string> = {
  Mastered: 'text-[#34d399]', Developing: 'text-[#fbbf24]', 'Needs Work': 'text-[#f87171]',
};
const MASTERY_BG: Record<string, string> = {
  Mastered: 'bg-[#34d399]/10 border-[#34d399]/20', Developing: 'bg-[#fbbf24]/10 border-[#fbbf24]/20', 'Needs Work': 'bg-[#f87171]/10 border-[#f87171]/20',
};
const MASTERY_BAR: Record<string, string> = {
  Mastered: 'bg-[#34d399]', Developing: 'bg-[#fbbf24]', 'Needs Work': 'bg-[#f87171]',
};

function TopicCard({ t }: { t: TopicMastery }) {
  return (
    <div className={`rounded-xl border p-3 ${MASTERY_BG[t.label]}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-instrument text-sm text-white">{t.topic}</span>
        <span className={`text-xs font-bold ${MASTERY_COLOR[t.label]}`}>{t.label}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div className={`h-full transition-all duration-700 ${MASTERY_BAR[t.label]}`} style={{ width: `${t.mastery}%` }} />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-[#64748b]">{t.mastery}% mastery</span>
        {t.errorPattern && <span className="text-[10px] text-[#f87171]">⚠ {t.errorPattern.slice(0, 30)}…</span>}
      </div>
    </div>
  );
}

export default function LearningGaps({ user, isTeacher = true }: Props) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>('');
  const [expandedSubject, setExpandedSubject] = useState<string | null>('Math');
  const [view, setView] = useState<'class' | 'student'>('student');

  useEffect(() => {
    const unsub = subscribeStudents(data => {
      setStudents(data);
      if (data.length > 0 && !selectedId) setSelectedId(data[0].id || '');
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const selectedStudent = isTeacher
    ? students.find(s => s.id === selectedId) || students[0]
    : students.find(s => s.name.toLowerCase().includes(user.displayName?.split(' ')[0]?.toLowerCase() || '')) || students[0];

  const subjects = [...new Set((selectedStudent?.topicMastery || []).map(t => t.subject))];

  const aiSuggestions = (selectedStudent?.topicMastery || [])
    .filter(t => t.label === 'Needs Work')
    .slice(0, 3)
    .map(t => `Struggles in ${t.subject} → ${t.topic}: practice targeted exercises daily`);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Brain size={22} className="text-[#818cf8]" />
          <h2 className="font-syne text-3xl font-extrabold text-white">Learning <span className="text-[#38bdf8]">Gaps</span></h2>
        </div>
        <p className="font-instrument text-[#64748b]">Topic mastery map and AI-powered improvement suggestions</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader size={24} className="animate-spin text-[#38bdf8]" /></div>
      ) : (
        <>
          {isTeacher && (
            <div className="flex flex-wrap gap-3">
              <div className="flex rounded-xl bg-[#0b1220] p-1 border border-white/10">
                {['student', 'class'].map(v => (
                  <button key={v} onClick={() => setView(v as any)}
                    className={`rounded-lg px-4 py-1.5 font-syne text-xs font-bold transition-all ${view === v ? 'bg-[#38bdf8] text-[#050a12]' : 'text-[#64748b]'}`}>
                    {v === 'student' ? 'Per Student' : 'Class Overview'}
                  </button>
                ))}
              </div>
              {view === 'student' && (
                <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
                  className="rounded-xl border border-white/10 bg-[#0b1220] px-4 py-2 text-sm text-white outline-none focus:border-[#38bdf8]">
                  {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              )}
            </div>
          )}

          {/* Class Overview */}
          {isTeacher && view === 'class' && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {CLASS_SUBJECT_GAPS.map((gap, i) => (
                <div key={i} className="rounded-2xl border border-white/10 bg-[#0f1a2e] p-5">
                  <p className="font-syne text-sm font-bold text-white">{gap.subject}</p>
                  <p className={`mt-1 font-syne text-2xl font-extrabold ${gap.struggling > 4 ? 'text-[#f87171]' : gap.struggling > 2 ? 'text-[#fbbf24]' : 'text-[#34d399]'}`}>
                    {gap.struggling} students struggling
                  </p>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-white/10">
                    <div className={`h-full rounded-full ${gap.struggling > 4 ? 'bg-[#f87171]' : gap.struggling > 2 ? 'bg-[#fbbf24]' : 'bg-[#34d399]'}`}
                      style={{ width: `${(gap.struggling / students.length) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Per Student */}
          {(!isTeacher || view === 'student') && selectedStudent && (
            <>
              {/* AI Suggestions */}
              {aiSuggestions.length > 0 && (
                <div className="rounded-2xl border border-[#818cf8]/20 bg-[#0f1a2e] p-6">
                  <h3 className="mb-3 font-syne text-sm font-bold text-[#818cf8]">🤖 AI Study Suggestions for {selectedStudent.name}</h3>
                  <div className="space-y-2">
                    {aiSuggestions.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 rounded-xl bg-white/5 p-3">
                        <span className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-[#818cf8]" />
                        <p className="font-instrument text-sm text-[#94a3b8]">{s}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Topic Map */}
              {subjects.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-[#0f1a2e] p-8 text-center">
                  <p className="font-syne text-white font-bold">No topic mastery data for this student yet.</p>
                </div>
              ) : subjects.map(sub => {
                const topics = (selectedStudent.topicMastery || []).filter(t => t.subject === sub);
                const isOpen = expandedSubject === sub;
                return (
                  <div key={sub} className="rounded-2xl border border-white/10 bg-[#0f1a2e] overflow-hidden">
                    <button onClick={() => setExpandedSubject(isOpen ? null : sub)}
                      className="flex w-full items-center justify-between p-5 hover:bg-white/5 transition-all">
                      <div className="flex items-center gap-3">
                        <span className="font-syne text-base font-bold text-white">{sub}</span>
                        <span className="text-xs text-[#64748b]">{topics.filter(t => t.label === 'Needs Work').length} weak topics</span>
                      </div>
                      {isOpen ? <ChevronUp size={16} className="text-[#64748b]" /> : <ChevronDown size={16} className="text-[#64748b]" />}
                    </button>
                    {isOpen && (
                      <div className="grid gap-2 p-5 pt-0 sm:grid-cols-2">
                        {topics.map((t, i) => <TopicCard key={i} t={t} />)}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </>
      )}
    </motion.div>
  );
}
