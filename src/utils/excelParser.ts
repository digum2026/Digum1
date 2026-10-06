import * as XLSX from 'xlsx';
import { Grade, Student, SchoolClass } from '../types';

export interface ParsedStudentRow {
  tz: string;
  lastName: string;
  firstName: string;
  rawGrade: string;
  rawParallel: string;
  targetClassName: string; // e.g. "י6", "יא5", "ט6"
  gender?: string;
}

export interface ParseExcelResult {
  rows: ParsedStudentRow[];
  totalRows: number;
  matchedByClass: Record<string, Student[]>;
  unmatchedRows: {
    row: ParsedStudentRow;
    reason: string;
  }[];
}

// Normalize Hebrew grade by removing apostrophes / quotes / spaces
export function normalizeGradeStr(raw: string): string {
  if (!raw) return '';
  return raw
    .toString()
    .trim()
    .replace(/['"״׳]/g, '')
    .replace(/\s+/g, '');
}

// Normalize class target: "כיתה" + "מקבילה" -> "י6"
export function buildTargetClassName(gradeStr: string, parallelStr: string): string {
  const cleanGrade = normalizeGradeStr(gradeStr);
  const cleanParallel = parallelStr ? parallelStr.toString().trim() : '';

  // If gradeStr already includes number, e.g. "י6"
  if (cleanGrade && /[0-9]/.test(cleanGrade)) {
    return cleanGrade;
  }

  return `${cleanGrade}${cleanParallel}`;
}

export function parseExcelOrCsv(
  fileBuffer: ArrayBuffer
): {
  success: boolean;
  rows: ParsedStudentRow[];
  error?: string;
} {
  try {
    const workbook = XLSX.read(fileBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return { success: false, rows: [], error: 'הקובץ ריק מגיליונות' };
    }

    const worksheet = workbook.Sheets[firstSheetName];
    // Convert to JSON with header detection
    const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
      defval: '',
    });

    if (!rawData || rawData.length === 0) {
      return { success: false, rows: [], error: 'לא נמצאו נתונים בגיליון' };
    }

    // Identify column keys
    const sample = rawData[0];
    const keys = Object.keys(sample);

    // Helpers to find column matching patterns
    const findKey = (patterns: string[]): string | undefined => {
      return keys.find((k) => {
        const cleanK = k.toString().trim().replace(/['"״׳.]/g, '').toLowerCase();
        return patterns.some((p) => cleanK.includes(p) || cleanK === p);
      });
    };

    const tzKey = findKey(['תז', 'תעודתזהות', 'זהות', 'מספרזהות', 'id']);
    const lastNameKey = findKey(['שםמשפחה', 'משפחה', 'lastname', 'family']);
    const firstNameKey = findKey(['שםפרטי', 'פרטי', 'firstname', 'first']);
    const gradeKey = findKey(['כיתה', 'שכבה', 'grade']);
    const parallelKey = findKey(['מקבילה', 'מספרכיתה', 'parallel', 'num']);
    const genderKey = findKey(['מין', 'gender', 'sex']);

    const parsedRows: ParsedStudentRow[] = [];

    for (const row of rawData) {
      const tz = tzKey && row[tzKey] ? String(row[tzKey]).trim() : '';
      const lastName = lastNameKey && row[lastNameKey] ? String(row[lastNameKey]).trim() : '';
      const firstName = firstNameKey && row[firstNameKey] ? String(row[firstNameKey]).trim() : '';
      const rawGrade = gradeKey && row[gradeKey] ? String(row[gradeKey]).trim() : '';
      const rawParallel = parallelKey && row[parallelKey] ? String(row[parallelKey]).trim() : '';
      const gender = genderKey && row[genderKey] ? String(row[genderKey]).trim() : undefined;

      // Skip row if it has no TZ and no name
      if (!tz && !lastName && !firstName) {
        continue;
      }

      const targetClassName = buildTargetClassName(rawGrade, rawParallel);

      parsedRows.push({
        tz,
        lastName,
        firstName,
        rawGrade,
        rawParallel,
        targetClassName,
        gender,
      });
    }

    return { success: true, rows: parsedRows };
  } catch (err: any) {
    return {
      success: false,
      rows: [],
      error: err?.message || 'שגיאה בפענוח קובץ האקסל',
    };
  }
}

// Generate an exact Excel template matching the PDF columns
export function generateSampleExcelWorkbook(sampleStudents: any[]): ArrayBuffer {
  const wsData = [
    ['מספר', 'ת.ז', 'שם משפחה', 'שם פרטי', 'כיתה', 'מקבילה', 'שם כיתה', 'מין'],
  ];

  sampleStudents.forEach((student, index) => {
    wsData.push([
      index + 1,
      student.tz,
      student.lastName,
      student.firstName,
      'י',
      '6',
      'י6',
      student.gender || 'ז',
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'תלמידים');

  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
}
