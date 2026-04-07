import {
  collection, addDoc, setDoc, getDoc, getDocs, doc,
  onSnapshot, query, orderBy, where, deleteDoc,
  serverTimestamp, updateDoc, writeBatch, Timestamp
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { db, auth } from '../firebase';
import { Student, Assignment, AttendanceRecord, Alert, UserProfile } from '../types';
import { SEED_STUDENTS, SUBJECTS, TOPIC_MAP } from './seedData';

// ─── USERS ────────────────────────────────────────────────────────────────────

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? ({ uid, ...snap.data() } as UserProfile) : null;
}

// ─── STUDENTS ─────────────────────────────────────────────────────────────────

export function subscribeStudents(callback: (students: Student[]) => void) {
  const q = query(collection(db, 'students'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Student));
  });
}

export async function addStudent(student: Omit<Student, 'id'>) {
  return addDoc(collection(db, 'students'), { ...student, createdAt: serverTimestamp() });
}

export async function deleteStudent(id: string) {
  return deleteDoc(doc(db, 'students', id));
}

export async function updateStudent(id: string, data: Partial<Student>) {
  return updateDoc(doc(db, 'students', id), data);
}

// ─── ATTENDANCE ───────────────────────────────────────────────────────────────

export function subscribeAttendance(date: string, callback: (records: AttendanceRecord[]) => void) {
  const q = query(collection(db, 'attendance'), where('date', '==', date));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => d.data() as AttendanceRecord));
  });
}

export function subscribeStudentAttendance(studentId: string, callback: (records: AttendanceRecord[]) => void) {
  const q = query(collection(db, 'attendance'), where('studentId', '==', studentId), orderBy('date', 'desc'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => d.data() as AttendanceRecord));
  });
}

export async function markAttendance(record: AttendanceRecord) {
  const id = `${record.date}_${record.studentId}`;
  return setDoc(doc(db, 'attendance', id), record, { merge: true });
}

export async function bulkMarkAttendance(records: AttendanceRecord[]) {
  const batch = writeBatch(db);
  records.forEach(r => {
    const id = `${r.date}_${r.studentId}`;
    batch.set(doc(db, 'attendance', id), r, { merge: true });
  });
  return batch.commit();
}

// ─── ASSIGNMENTS ──────────────────────────────────────────────────────────────

export function subscribeAssignments(userId: string, role: string, callback: (assignments: Assignment[]) => void) {
  let q;
  if (role === 'teacher' || role === 'admin') {
    q = query(collection(db, 'assignments'), orderBy('dueDate', 'asc'));
  } else {
    q = query(collection(db, 'assignments'), where('studentId', '==', userId), orderBy('dueDate', 'asc'));
  }
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Assignment));
  });
}

export async function addAssignment(assignment: Omit<Assignment, 'id'> & { studentId?: string }) {
  return addDoc(collection(db, 'assignments'), { ...assignment, createdAt: serverTimestamp() });
}

export async function updateAssignmentStatus(id: string, status: Assignment['status'], grade?: number) {
  return updateDoc(doc(db, 'assignments', id), { status, ...(grade !== undefined ? { grade } : {}) });
}

// ─── ALERTS ───────────────────────────────────────────────────────────────────

export function subscribeAlerts(callback: (alerts: Alert[]) => void) {
  const q = query(collection(db, 'alerts'), orderBy('timestamp', 'desc'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Alert));
  });
}

export async function createAlert(alert: Omit<Alert, 'id'>) {
  return addDoc(collection(db, 'alerts'), alert);
}

export async function deleteAlert(id: string) {
  return deleteDoc(doc(db, 'alerts', id));
}

export async function generateAlertsFromStudents(students: Student[]) {
  const batch = writeBatch(db);
  const existing = await getDocs(collection(db, 'alerts'));
  existing.docs.forEach(d => batch.delete(d.ref));

  students.forEach(s => {
    if (s.riskLevel === 'HIGH') {
      const ref = doc(collection(db, 'alerts'));
      batch.set(ref, {
        type: 'risk',
        studentId: s.id || s.name,
        studentName: s.name,
        message: `High risk: Score ${s.score}%, Attendance ${s.attendance}% — immediate intervention needed`,
        severity: 'high',
        timestamp: new Date().toISOString(),
      });
    }
    if (s.attendance < 75) {
      const ref = doc(collection(db, 'alerts'));
      batch.set(ref, {
        type: 'attendance',
        studentId: s.id || s.name,
        studentName: s.name,
        message: `Attendance dropped to ${s.attendance}% — parent notification recommended`,
        severity: 'high',
        timestamp: new Date().toISOString(),
      });
    }
    if (s.riskLevel === 'MED') {
      const ref = doc(collection(db, 'alerts'));
      batch.set(ref, {
        type: 'performance',
        studentId: s.id || s.name,
        studentName: s.name,
        message: `Performance declining: ${s.score}% average with downward trend`,
        severity: 'medium',
        timestamp: new Date().toISOString(),
      });
    }
  });

  return batch.commit();
}

// ─── SEED DATABASE ────────────────────────────────────────────────────────────

export async function seedDatabase(teacherUid: string): Promise<string> {
  const batch = writeBatch(db);

  // 1. Seed students
  const studentRefs: string[] = [];
  for (const s of SEED_STUDENTS) {
    const ref = doc(collection(db, 'students'));
    studentRefs.push(ref.id);
    batch.set(ref, {
      ...s,
      addedBy: teacherUid,
      createdAt: serverTimestamp(),
    });
  }
  await batch.commit();

  // 2. Seed attendance for last 7 days
  const attBatch = writeBatch(db);
  const today = new Date();
  const students = await getDocs(collection(db, 'students'));
  students.docs.forEach(studentDoc => {
    const s = studentDoc.data() as Student;
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const isPresent = Math.random() < (s.attendance / 100);
      const id = `${dateStr}_${studentDoc.id}`;
      attBatch.set(doc(db, 'attendance', id), {
        date: dateStr,
        studentId: studentDoc.id,
        studentName: s.name,
        present: isPresent,
      });
    }
  });
  await attBatch.commit();

  // 3. Seed assignments for all students
  const assignBatch = writeBatch(db);
  const assignmentTemplates = [
    { title: 'Algebra Practice Set 3', subject: 'Math', daysFromNow: 3, status: 'pending' },
    { title: 'Essay: Industrial Revolution', subject: 'History', daysFromNow: 1, status: 'submitted' },
    { title: "Newton's Laws Problem Set", subject: 'Physics', daysFromNow: -2, status: 'late' },
    { title: 'Cell Biology Worksheet', subject: 'Science', daysFromNow: -4, status: 'graded', grade: 78 },
    { title: 'OOP Concepts Assignment', subject: 'Computer Science', daysFromNow: -7, status: 'graded', grade: 85 },
    { title: 'Trigonometry Review', subject: 'Math', daysFromNow: 5, status: 'pending' },
    { title: 'English Grammar Exercises', subject: 'English', daysFromNow: 2, status: 'pending' },
    { title: 'Chemical Equations Lab Report', subject: 'Science', daysFromNow: -1, status: 'submitted' },
  ] as any[];

  students.docs.forEach(studentDoc => {
    assignmentTemplates.forEach(tmpl => {
      const ref = doc(collection(db, 'assignments'));
      const due = new Date(today);
      due.setDate(today.getDate() + tmpl.daysFromNow);
      assignBatch.set(ref, {
        title: tmpl.title,
        subject: tmpl.subject,
        dueDate: due.toISOString().split('T')[0],
        status: tmpl.status,
        grade: tmpl.grade || null,
        studentId: studentDoc.id,
        studentName: studentDoc.data().name,
        createdAt: serverTimestamp(),
      });
    });
  });
  await assignBatch.commit();

  // 4. Generate alerts
  const allStudents = students.docs.map(d => ({ id: d.id, ...d.data() }) as Student);
  await generateAlertsFromStudents(allStudents);

  // 5. Create demo accounts in Firestore (users collection)
  const demoUsers = [
    { email: 'teacher@edulens.com', password: 'teach123', displayName: 'Ms. Priya Sharma', role: 'teacher' },
    { email: 'student@edulens.com', password: 'student123', displayName: 'Arjun Mehta', role: 'student' },
    { email: 'admin@edulens.com', password: 'admin123', displayName: 'Admin User', role: 'admin' },
  ];

  for (const u of demoUsers) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, u.email, u.password);
      await updateProfile(cred.user, { displayName: u.displayName });
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        email: u.email,
        displayName: u.displayName,
        role: u.role,
        createdAt: serverTimestamp(),
      });
    } catch (e: any) {
      if (e.code !== 'auth/email-already-in-use') console.warn('User creation skipped:', u.email, e.message);
    }
  }

  return 'Database seeded successfully!';
}
