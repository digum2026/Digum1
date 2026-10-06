export type Grade = 'ט' | 'י' | 'יא' | 'יב' | 'יג' | 'יד';

export type ClassNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type Track =
  | 'כללי'
  | 'מדעי המחשב'
  | 'אלקטרוניקה ומחשבים'
  | 'חשמל'
  | 'מכטרוניקה'
  | 'מכונות תעופה';

export type DigumCategory =
  | 'תספורת'
  | 'גילוח'
  | 'הופעה ולבוש'
  | 'נעליים'
  | 'כומתה'
  | 'תג'
  | 'אי-דיגום כללי'
  | 'אחר';

export const SG_INFRACTIONS = [
  'איחור',
  'ללא כומתה',
  'לק לא תקני',
  'תספורת לא תקנית',
  'דירוג לא תקין',
  'תכשיטים לא תקניים',
  'שיער פזור',
  'נעליים לא מצוחצחות',
  'ללא שוחר',
  'אחר (טקסט חופשי)',
] as const;

export type SgInfraction = typeof SG_INFRACTIONS[number];

export interface DigumNote {
  id: string;
  studentId: string;
  category: DigumCategory | string;
  note: string;
  status: 'פתוח' | 'טופל' | 'בוטל';
  date: string;
  createdAt: number;
  reportedBy?: string; // שם התורן
  infractions?: string[]; // רשימת ליקויים שנבחרו
  response?: string; // תגובה להערה
  respondedAt?: number;
  respondedBy?: string;
  sourceType?: 'SG' | 'DIRECT';
}

export interface SgReportEntry {
  studentId: string;
  studentTz: string;
  studentName: string;
  classId: string;
  className: string;
  grade: Grade;
  infractions: string[];
  customNote?: string;
}

export interface SgReport {
  id: string;
  dutyOfficerName: string; // שם התורן
  grade: Grade;
  date: string;
  createdAt: number;
  entries: SgReportEntry[];
}

export interface Student {
  id: string;
  tz: string;
  firstName: string;
  lastName: string;
  fullName: string; // שם משפחה + ' ' + שם פרטי
  displayFormat: string; // "ת.ז - שם משפחה + שם פרטי"
  gender?: string;
  digumNotes: DigumNote[];
  addedAt: number;
}

export interface SchoolClass {
  id: string;
  grade: Grade;
  number: ClassNumber;
  fullName: string; // e.g. "י6", "יא5", "ט6" (strictly no apostrophes/quotes)
  teacherName?: string;
  mks?: string;
  track?: Track | string;
  students: Student[];
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface GradeConfig {
  grade: Grade;
  label: string;
  levelName: string;
  color: {
    bg: string;
    border: string;
    text: string;
    badge: string;
    accent: string;
    ring: string;
  };
}
