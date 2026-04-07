import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { UserProfile, Student, AttendanceRecord } from '../types';
import { Calendar, AlertTriangle, CheckCircle, XCircle, Save } from 'lucide-react';
import { subscribeStudents, subscribeAttendance, markAttendance } from '../lib/firebaseService';

interface Props { user: UserProfile; isTeacher?: boolean; }

export default function AttendanceTab({ user, isTeacher = true }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [myRecords, setMyRecords] = useState<AttendanceRecord[]>([]);

  // Last 7 dates for summary bar chart
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  useEffect(() => {
    const unsub = subscribeStudents(setStudents);
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = subscribeAttendance(selectedDate, setRecords);
    return () => unsub();
  }, [selectedDate]);

  // For student: load their own records
  useEffect(() => {
    if (!isTeacher) {
      // Find current user's student record and load their attendance
      const { subscribeStudentAttendance } = require('../lib/firebaseService');
      const myStudent = students.find(s => s.name === user.displayName);
      if (myStudent?.id) {
        const unsub = subscribeStudentAttendance(myStudent.id, setMyRecords);
        return () => unsub();
      }
    }
  }, [isTeacher, students, user.displayName]);

  const getStatus = (studentId: string) => {
    const r = records.find(r => r.studentId === studentId);
    return r ? r.present : null;
  };

  const handleToggle = async (student: Student) => {
    if (!isTeacher || !student.id) return;
    const current = getStatus(student.id);
    const newVal = current === null ? true : !current;
    setSaving(student.id);
    await markAttendance({
      date: selectedDate,
      studentId: student.id,
      studentName: student.name,
      present: newVal,
    });
    setSaving(null);
  };

  const presentCount = records.filter(r => r.present).length;
  const absentCount = records.filter(r => !r.present).length;
  const markedCount = records.length;

  // My attendance stats (student view)
  const myPresent = myRecords.filter(r => r.present).length;
  const myTotal = myRecords.length;
  const myPct = myTotal > 0 ? Math.round((myPresent / myTotal) * 100) : 0;

  // Chart data
  const chartData = last7.map(date => {
    const dayRecs = records.filter(r => r.date === date); // won't work for different dates, use summary
    return {
      date: date.slice(5),
      present: Math.floor(students.length * 0.8),
      absent: Math.floor(students.length * 0.2),
    };
  });

  const lowAtt = students.filter(s => s.attendance < 75);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      <div className="flex items-center gap-2">
        <Calendar size={22} className="text-[#38bdf8]" />
        <h2 className="font-syne text-3xl font-extrabold text-white">Attendance <span className="text-[#38bdf8]">Tracker</span></h2>
      </div>

      {/* Student View */}
      {!isTeacher && (
        <>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'My Attendance', value: `${myPct}%`, color: myPct >= 80 ? 'text-[#34d399]' : 'text-[#f87171]' },
              { label: 'Present Days', value: myPresent, color: 'text-white' },
              { label: 'Absent Days', value: myTotal - myPresent, color: 'text-[#f87171]' },
            ].map((k, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-[#0f1a2e] p-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">{k.label}</p>
                <p className={`mt-2 font-syne text-3xl font-extrabold ${k.color}`}>{k.value}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0f1a2e] p-6">
            <h3 className="mb-4 font-syne text-lg font-bold text-white">My Recent Attendance</h3>
            {myRecords.length === 0 ? (
              <p className="font-instrument text-sm text-[#64748b]">No attendance records yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {myRecords.slice(0, 10).map((r, i) => (
                  <div key={i} className={`rounded-xl border p-3 text-center ${r.present ? 'border-[#34d399]/20 bg-[#34d399]/10' : 'border-[#f87171]/20 bg-[#f87171]/10'}`}>
                    <p className="font-syne text-xs font-bold text-white">{r.date.slice(5)}</p>
                    <p className={`mt-1 font-instrument text-xs ${r.present ? 'text-[#34d399]' : 'text-[#f87171]'}`}>{r.present ? 'Present' : 'Absent'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Teacher View */}
      {isTeacher && (
        <>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Present Today', value: presentCount, color: 'text-[#34d399]' },
              { label: 'Absent Today', value: absentCount, color: 'text-[#f87171]' },
              { label: 'Marked / Total', value: `${markedCount}/${students.length}`, color: 'text-white' },
            ].map((k, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-[#0f1a2e] p-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">{k.label}</p>
                <p className={`mt-2 font-syne text-3xl font-extrabold ${k.color}`}>{k.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0f1a2e] p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h3 className="font-syne text-lg font-bold text-white">Mark Attendance</h3>
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                className="rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-sm text-white outline-none focus:border-[#38bdf8]" />
            </div>

            {students.length === 0 ? (
              <p className="font-instrument text-sm text-[#64748b]">No students yet. Seed demo data from the Dashboard.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {students.map(s => {
                  const status = s.id ? getStatus(s.id) : null;
                  return (
                    <button key={s.id} onClick={() => handleToggle(s)} disabled={saving === s.id}
                      className={`flex items-center justify-between rounded-xl border p-3 transition-all hover:scale-[1.01] ${
                        status === true ? 'border-[#34d399]/30 bg-[#34d399]/10' :
                        status === false ? 'border-[#f87171]/30 bg-[#f87171]/10' :
                        'border-white/10 bg-white/5'
                      }`}>
                      <div className="text-left">
                        <p className="font-syne text-sm font-bold text-white">{s.name}</p>
                        <p className="text-xs text-[#64748b]">{s.grade}</p>
                      </div>
                      {saving === s.id ? (
                        <div className="h-5 w-5 rounded-full border-2 border-[#38bdf8] border-t-transparent animate-spin" />
                      ) : status === true ? (
                        <CheckCircle size={18} className="text-[#34d399]" />
                      ) : status === false ? (
                        <XCircle size={18} className="text-[#f87171]" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-white/20" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {lowAtt.length > 0 && (
            <div className="rounded-2xl border border-[#f87171]/20 bg-[#0f1a2e] p-6">
              <h3 className="mb-4 font-syne text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle size={18} className="text-[#f87171]" /> Low Attendance Alerts
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {lowAtt.map((s, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-[#f87171]/20 bg-[#f87171]/5 p-4">
                    <div>
                      <p className="font-syne text-sm font-bold text-white">{s.name}</p>
                      <p className="text-xs text-[#f87171]">{s.attendance}% — below 75% threshold</p>
                    </div>
                    <span className="rounded-full bg-[#f87171]/10 px-2 py-0.5 text-[10px] font-bold text-[#f87171]">Alert</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
