export type UserRole = 'student' | 'teacher' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: any;
}

export interface SubjectScore {
  subject: string;
  score: number;
  classAvg: number;
  trend: number[];
}

export interface TopicMastery {
  subject: string;
  topic: string;
  mastery: number;
  label: 'Mastered' | 'Developing' | 'Needs Work';
  errorPattern?: string;
}

export interface TestResult {
  testId: string;
  subject: string;
  date: string;
  score: number;
  maxScore: number;
  topics: string[];
}

export interface Student {
  id?: string;
  name: string;
  grade: string;
  score: number;
  attendance: number;
  assignments: number;
  riskLevel: 'LOW' | 'MED' | 'HIGH';
  riskScore?: number;
  addedBy: string;
  createdAt: any;
  subjectScores?: SubjectScore[];
  testHistory?: TestResult[];
  topicMastery?: TopicMastery[];
  missedClasses?: string[];
  pendingAssignments?: number;
  submittedAssignments?: number;
  lateAssignments?: number;
}

export interface AttendanceRecord {
  date: string;
  present: boolean;
  studentId: string;
  subject?: string;
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'late' | 'graded';
  grade?: number;
  feedback?: string;
}

export interface Alert {
  id: string;
  type: 'risk' | 'attendance' | 'performance';
  studentId: string;
  studentName: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
  timestamp: string;
}

export interface QuestionPaper {
  id?: string;
  title: string;
  subject: string;
  fileUrl: string;
  questions: string[];
  isSet: boolean;
  uploadedBy: string;
  createdAt: any;
}

export interface AnswerSheet {
  id?: string;
  studentId: string;
  studentName: string;
  paperId: string;
  subject: string;
  fileUrl: string;
  aiFeedback: string;
  score: number;
  maxScore: number;
  percentage: number;
  checkedAt: any;
  createdAt: any;
}
