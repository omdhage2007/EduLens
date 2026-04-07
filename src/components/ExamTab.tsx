import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FileText, CheckCircle, Award, Clock } from 'lucide-react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { AnswerSheet, UserProfile } from '../types';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';

interface ExamTabProps {
  user: UserProfile;
}

export default function ExamTab({ user }: ExamTabProps) {
  const [submissions, setSubmissions] = useState<AnswerSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSheet, setSelectedSheet] = useState<AnswerSheet | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'answerSheets'),
      where('studentId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSubmissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AnswerSheet)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.uid]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8"
    >
      <div className="text-center">
        <span className="inline-block rounded-full border border-[#a78bfa]/30 bg-[#a78bfa]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#a78bfa]">
          Exam Results
        </span>
        <h2 className="mt-4 font-syne text-3xl font-extrabold text-white">Your <span className="text-[#38bdf8]">Exams</span></h2>
        <p className="mt-2 font-instrument text-[#64748b]">View your graded answer sheets and AI-powered feedback.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Submissions List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-syne text-xl font-bold text-white">Submissions</h3>
          {loading ? (
            <p className="text-sm text-[#64748b]">Loading your results...</p>
          ) : submissions.length === 0 ? (
            <p className="text-sm text-[#64748b]">No exam submissions found.</p>
          ) : (
            submissions.map(sheet => (
              <button
                key={sheet.id}
                onClick={() => setSelectedSheet(sheet)}
                className={cn(
                  "w-full text-left rounded-2xl border p-4 transition-all",
                  selectedSheet?.id === sheet.id 
                    ? "bg-[#38bdf8]/10 border-[#38bdf8]/30" 
                    : "bg-[#0f1a2e] border-white/5 hover:border-white/10"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-[#38bdf8]">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h4 className="font-syne text-sm font-bold text-white">{sheet.subject}</h4>
                      <p className="text-[10px] text-[#64748b]">
                        {new Date(sheet.createdAt?.toDate()).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-syne text-sm font-bold text-[#34d399]">{sheet.percentage}%</p>
                    <p className="text-[10px] text-[#64748b]">{sheet.score}/{sheet.maxScore}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Detailed View */}
        <div className="lg:col-span-2">
          {selectedSheet ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-3xl border border-white/10 bg-[#0f1a2e] p-8 shadow-2xl"
            >
              <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="font-syne text-2xl font-bold text-white">{selectedSheet.subject} Exam</h3>
                  <p className="text-sm text-[#64748b]">Checked by EduLens AI on {new Date(selectedSheet.checkedAt?.toDate()).toLocaleString()}</p>
                </div>
                <div className="flex gap-4">
                  <div className="text-center">
                    <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#34d399]/10 text-[#34d399]">
                      <Award size={24} />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Score</p>
                    <p className="font-syne text-sm font-bold text-white">{selectedSheet.score}/{selectedSheet.maxScore}</p>
                  </div>
                  <div className="text-center">
                    <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#38bdf8]/10 text-[#38bdf8]">
                      <CheckCircle size={24} />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Grade</p>
                    <p className="font-syne text-sm font-bold text-white">{selectedSheet.percentage}%</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl bg-white/5 p-6">
                  <h4 className="mb-4 flex items-center gap-2 font-syne text-sm font-bold text-white">
                    <Clock size={16} className="text-[#38bdf8]" />
                    AI Feedback & Analysis
                  </h4>
                  <div className="prose prose-invert max-w-none text-sm text-[#e2e8f0]">
                    <ReactMarkdown>{selectedSheet.aiFeedback}</ReactMarkdown>
                  </div>
                </div>

                <div>
                  <h4 className="mb-4 font-syne text-sm font-bold text-white">Answer Sheet Attachment</h4>
                  <a 
                    href={selectedSheet.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0b1220] p-4 transition-all hover:bg-white/5"
                  >
                    <FileText className="text-[#64748b]" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">View Original Answer Sheet</p>
                      <p className="text-[10px] text-[#64748b]">Click to open in a new tab</p>
                    </div>
                  </a>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/5 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-[#64748b]">
                <FileText size={32} />
              </div>
              <h3 className="font-syne text-lg font-bold text-white">No Exam Selected</h3>
              <p className="mt-2 max-w-xs text-sm text-[#64748b]">Select an exam from the list on the left to view your results and AI feedback.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
