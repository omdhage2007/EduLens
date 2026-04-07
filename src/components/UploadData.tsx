import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Upload, FileText, CheckCircle, User, Loader2 } from 'lucide-react';
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, serverTimestamp, getDocs, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { QuestionPaper, UserProfile } from '../types';
import { extractQuestionsFromImage, gradeAnswerSheet } from '../lib/gemini';
import { cn } from '../lib/utils';

interface UploadDataProps {
  user: UserProfile;
}

export default function UploadData({ user }: UploadDataProps) {
  const [papers, setPapers] = useState<QuestionPaper[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'paper' | 'answer'>('paper');

  // Paper Form
  const [paperTitle, setPaperTitle] = useState('');
  const [paperSubject, setPaperSubject] = useState('');
  const [paperFile, setPaperFile] = useState<File | null>(null);

  // Answer Form
  const [selectedPaperId, setSelectedPaperId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [answerFile, setAnswerFile] = useState<File | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'questionPapers'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPapers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuestionPaper)));
    });

    const fetchStudents = async () => {
      const q = query(collection(db, 'users'), where('role', '==', 'student'));
      const snapshot = await getDocs(q);
      setStudents(snapshot.docs.map(doc => doc.data() as UserProfile));
    };
    fetchStudents();

    return () => unsubscribe();
  }, []);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleUploadPaper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paperFile || !paperTitle || !paperSubject) return;
    setLoading(true);

    try {
      // 1. Upload to Storage
      const storageRef = ref(storage, `papers/${Date.now()}_${paperFile.name}`);
      await uploadBytes(storageRef, paperFile);
      const fileUrl = await getDownloadURL(storageRef);

      // 2. Extract Questions with AI
      const base64 = await fileToBase64(paperFile);
      const questions = await extractQuestionsFromImage(base64, paperFile.type);

      // 3. Save to Firestore
      await addDoc(collection(db, 'questionPapers'), {
        title: paperTitle,
        subject: paperSubject,
        fileUrl,
        questions,
        isSet: false,
        uploadedBy: user.uid,
        createdAt: serverTimestamp()
      });

      setPaperTitle('');
      setPaperSubject('');
      setPaperFile(null);
      showToast('Question paper uploaded and processed! ✅');
    } catch (err) {
      console.error(err);
      showToast('Error uploading paper.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPaper = async (id: string) => {
    try {
      await updateDoc(doc(db, 'questionPapers', id), { isSet: true });
      showToast('Paper set for checking! 🎯');
    } catch (err) {
      showToast('Error setting paper.', 'error');
    }
  };

  const handleUploadAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerFile || !selectedPaperId || !selectedStudentId) return;
    setLoading(true);

    try {
      const paper = papers.find(p => p.id === selectedPaperId);
      const student = students.find(s => s.uid === selectedStudentId);
      if (!paper || !student) return;

      // 1. Upload to Storage
      const storageRef = ref(storage, `answers/${Date.now()}_${answerFile.name}`);
      await uploadBytes(storageRef, answerFile);
      const fileUrl = await getDownloadURL(storageRef);

      // 2. AI Grading
      const base64 = await fileToBase64(answerFile);
      const grading = await gradeAnswerSheet(base64, answerFile.type, paper.questions);

      // 3. Save to Firestore
      await addDoc(collection(db, 'answerSheets'), {
        studentId: student.uid,
        studentName: student.displayName,
        paperId: paper.id,
        subject: paper.subject,
        fileUrl,
        aiFeedback: grading.feedback,
        score: grading.score,
        maxScore: grading.maxScore,
        percentage: grading.percentage,
        checkedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      setAnswerFile(null);
      showToast('Answer sheet uploaded and graded by AI! 🤖');
    } catch (err) {
      console.error(err);
      showToast('Error grading answer sheet.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = cn(
      "flex items-center gap-2 rounded-xl border px-4 py-3 text-sm shadow-2xl animate-in slide-in-from-right-full",
      type === 'success' ? "bg-[#0f1a2e] border-[#34d399]/30 text-white" : "bg-[#0f1a2e] border-[#f87171]/30 text-white"
    );
    toast.innerHTML = `${type === 'success' ? '✅' : '⚠'} ${msg}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8"
    >
      <div className="text-center">
        <span className="inline-block rounded-full border border-[#38bdf8]/30 bg-[#38bdf8]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#38bdf8]">
          Data Management
        </span>
        <h2 className="mt-4 font-syne text-3xl font-extrabold text-white">Upload <span className="text-[#38bdf8]">Data</span></h2>
        <p className="mt-2 font-instrument text-[#64748b]">Upload question papers and student answer sheets for AI processing.</p>
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={() => setActiveTab('paper')}
          className={cn(
            "rounded-xl px-6 py-2 font-syne text-sm font-bold transition-all",
            activeTab === 'paper' ? "bg-[#38bdf8] text-[#050a12]" : "bg-white/5 text-[#64748b] hover:text-white"
          )}
        >
          Question Papers
        </button>
        <button
          onClick={() => setActiveTab('answer')}
          className={cn(
            "rounded-xl px-6 py-2 font-syne text-sm font-bold transition-all",
            activeTab === 'answer' ? "bg-[#38bdf8] text-[#050a12]" : "bg-white/5 text-[#64748b] hover:text-white"
          )}
        >
          Answer Sheets
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Form Section */}
        <div className="rounded-3xl border border-white/10 bg-[#0f1a2e] p-8 shadow-2xl">
          {activeTab === 'paper' ? (
            <form onSubmit={handleUploadPaper} className="space-y-6">
              <h3 className="font-syne text-xl font-bold text-white">Upload Question Paper</h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Title</label>
                  <input
                    type="text"
                    value={paperTitle}
                    onChange={(e) => setPaperTitle(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white outline-none focus:border-[#38bdf8]"
                    placeholder="e.g. Mid-Term Exam"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Subject</label>
                  <input
                    type="text"
                    value={paperSubject}
                    onChange={(e) => setPaperSubject(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white outline-none focus:border-[#38bdf8]"
                    placeholder="e.g. Mathematics"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">File (PDF/JPG/PNG)</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setPaperFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="paper-file"
                      required
                    />
                    <label
                      htmlFor="paper-file"
                      className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/5 py-8 transition-all hover:border-[#38bdf8] hover:bg-white/10"
                    >
                      <Upload className="text-[#64748b]" />
                      <span className="text-sm text-[#64748b]">
                        {paperFile ? paperFile.name : "Click to upload file"}
                      </span>
                    </label>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#38bdf8] py-3 font-syne text-sm font-bold text-[#050a12] transition-all hover:bg-[#7dd3fc] disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <Upload size={18} />}
                  Upload & Extract Questions
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleUploadAnswer} className="space-y-6">
              <h3 className="font-syne text-xl font-bold text-white">Upload Answer Sheet</h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Select Paper</label>
                  <select
                    value={selectedPaperId}
                    onChange={(e) => setSelectedPaperId(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white outline-none focus:border-[#38bdf8]"
                    required
                  >
                    <option value="">Choose a paper...</option>
                    {papers.map(p => (
                      <option key={p.id} value={p.id}>{p.title} ({p.subject})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Select Student</label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white outline-none focus:border-[#38bdf8]"
                    required
                  >
                    <option value="">Choose a student...</option>
                    {students.map(s => (
                      <option key={s.uid} value={s.uid}>{s.displayName} ({s.email})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Answer Sheet File</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setAnswerFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="answer-file"
                      required
                    />
                    <label
                      htmlFor="answer-file"
                      className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/5 py-8 transition-all hover:border-[#38bdf8] hover:bg-white/10"
                    >
                      <Upload className="text-[#64748b]" />
                      <span className="text-sm text-[#64748b]">
                        {answerFile ? answerFile.name : "Click to upload file"}
                      </span>
                    </label>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#34d399] py-3 font-syne text-sm font-bold text-[#050a12] transition-all hover:bg-[#6ee7b7] disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <CheckCircle size={18} />}
                  Upload & Grade with AI
                </button>
              </div>
            </form>
          )}
        </div>

        {/* List Section */}
        <div className="rounded-3xl border border-white/10 bg-[#0f1a2e] p-8 shadow-2xl">
          <h3 className="mb-6 font-syne text-xl font-bold text-white">Uploaded Papers</h3>
          <div className="space-y-4">
            {papers.length === 0 ? (
              <p className="text-center text-sm text-[#64748b]">No papers uploaded yet.</p>
            ) : (
              papers.map(p => (
                <div key={p.id} className="rounded-2xl border border-white/5 bg-[#0b1220] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-syne text-sm font-bold text-white">{p.title}</h4>
                      <p className="text-xs text-[#64748b]">{p.subject}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSetPaper(p.id!)}
                        disabled={p.isSet}
                        className={cn(
                          "rounded-lg px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all",
                          p.isSet ? "bg-[#34d399]/10 text-[#34d399]" : "bg-[#38bdf8]/10 text-[#38bdf8] hover:bg-[#38bdf8]/20"
                        )}
                      >
                        {p.isSet ? "SET" : "SET FOR CHECKING"}
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Extracted Questions:</p>
                    <div className="max-h-24 overflow-y-auto rounded-lg bg-black/20 p-2 text-[10px] text-[#e2e8f0]">
                      {p.questions.map((q, i) => (
                        <p key={i} className="mb-1">{q}</p>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
