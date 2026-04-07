import { motion } from 'motion/react';
import { SEED_STUDENTS } from '../lib/seedData';
import { FileText, Download, BarChart2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { UserProfile } from '../types';

interface Props { user: UserProfile; }

export default function ReportsTab({ user }: Props) {
  const exportClassPDF = () => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();
    doc.setFontSize(20); doc.text('EduLens — Class Performance Report', 20, 20);
    doc.setFontSize(11); doc.text(`Generated: ${date} | By: ${user.displayName}`, 20, 30);
    doc.line(20, 35, 190, 35);
    let y = 45;
    doc.setFontSize(9);
    doc.text('NAME', 20, y); doc.text('GRADE', 65, y); doc.text('SCORE', 90, y); doc.text('ATTEND', 115, y); doc.text('RISK', 145, y); doc.text('RISK SCORE', 165, y);
    y += 8;
    SEED_STUDENTS.forEach(s => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(s.name, 20, y); doc.text(s.grade, 65, y); doc.text(`${s.score}%`, 90, y);
      doc.text(`${s.attendance}%`, 115, y); doc.text(s.riskLevel, 145, y); doc.text(`${s.riskScore}`, 165, y);
      y += 7;
    });
    doc.save(`EduLens_Class_Report_${date}.pdf`);
  };

  const exportStudentPDF = (name: string) => {
    const s = SEED_STUDENTS.find(st => st.name === name);
    if (!s) return;
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();
    doc.setFontSize(20); doc.text('EduLens — Student Report Card', 20, 20);
    doc.setFontSize(13); doc.text(s.name, 20, 32);
    doc.setFontSize(10); doc.text(`Grade: ${s.grade} | Date: ${date}`, 20, 40);
    doc.line(20, 45, 190, 45);
    doc.setFontSize(11);
    doc.text(`Overall Score: ${s.score}%`, 20, 55);
    doc.text(`Attendance: ${s.attendance}%`, 20, 63);
    doc.text(`Assignment Completion: ${s.assignments}%`, 20, 71);
    doc.text(`Risk Level: ${s.riskLevel}`, 20, 79);
    doc.line(20, 85, 190, 85);
    doc.setFontSize(10); doc.text('Subject Scores:', 20, 93);
    let y = 101;
    (s.subjectScores || []).forEach(sub => {
      doc.text(`${sub.subject}: ${sub.score}% (Class avg: ${sub.classAvg}%)`, 25, y);
      y += 7;
    });
    y += 5;
    doc.text('Topics Needing Work:', 20, y); y += 8;
    (s.topicMastery || []).filter(t => t.label === 'Needs Work').slice(0, 5).forEach(t => {
      doc.text(`- ${t.subject}: ${t.topic} (${t.mastery}% mastery)`, 25, y);
      y += 7;
    });
    doc.save(`${s.name.replace(' ', '_')}_Report_${date}.pdf`);
  };

  const highRisk = SEED_STUDENTS.filter(s => s.riskLevel === 'HIGH');
  const avgScore = Math.round(SEED_STUDENTS.reduce((a, s) => a + s.score, 0) / SEED_STUDENTS.length);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      <div className="flex items-center gap-2">
        <FileText size={22} className="text-[#34d399]" />
        <h2 className="font-syne text-3xl font-extrabold text-white">Reports & <span className="text-[#38bdf8]">Export</span></h2>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/10 bg-[#0f1a2e] p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Total Students</p>
          <p className="mt-2 font-syne text-3xl font-extrabold text-white">{SEED_STUDENTS.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#0f1a2e] p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Class Average</p>
          <p className="mt-2 font-syne text-3xl font-extrabold text-white">{avgScore}%</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#0f1a2e] p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">High Risk Count</p>
          <p className="mt-2 font-syne text-3xl font-extrabold text-[#f87171]">{highRisk.length}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0f1a2e] p-6">
        <h3 className="mb-4 font-syne text-lg font-bold text-white">Class Reports</h3>
        <div className="flex flex-wrap gap-3">
          <button onClick={exportClassPDF}
            className="flex items-center gap-2 rounded-xl bg-[#38bdf8]/10 border border-[#38bdf8]/20 px-4 py-2.5 text-sm font-bold text-[#38bdf8] hover:bg-[#38bdf8]/20 transition-all">
            <Download size={16} /> Export Full Class PDF
          </button>
          <button onClick={() => { const high = SEED_STUDENTS.filter(s => s.riskLevel === 'HIGH'); alert(`High Risk Students: ${high.map(s => s.name).join(', ')}`); }}
            className="flex items-center gap-2 rounded-xl bg-[#f87171]/10 border border-[#f87171]/20 px-4 py-2.5 text-sm font-bold text-[#f87171] hover:bg-[#f87171]/20 transition-all">
            <BarChart2 size={16} /> Export Risk Report
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0f1a2e] p-6">
        <h3 className="mb-4 font-syne text-lg font-bold text-white">Individual Student Reports</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SEED_STUDENTS.map((s, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-white/10 p-3">
              <div>
                <p className="font-syne text-sm font-bold text-white">{s.name}</p>
                <p className="text-xs text-[#64748b]">{s.grade} · {s.score}%</p>
              </div>
              <button onClick={() => exportStudentPDF(s.name)}
                className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold text-[#38bdf8] hover:bg-[#38bdf8]/10 transition-all">
                <Download size={14} /> PDF
              </button>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
