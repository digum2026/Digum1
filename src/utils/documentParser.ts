import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';

// Set up pdf.js worker
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export interface ParsedStudentRow {
  tz: string;
  lastName: string;
  firstName: string;
  targetClassName: string; // e.g. "י6", "יא5", "ט6" (strictly no apostrophes)
  gender?: string;
  rawText?: string;
}

// Clean string from Hebrew quotes / apostrophes / symbols
export function cleanGradeQuotes(str: string): string {
  if (!str) return '';
  return str.replace(/['"״׳]/g, '').trim();
}

/**
 * Normalizes Hebrew grade string to standard: ט, י, יא, יב, יג, יד
 */
export function normalizeGrade(gradeStr: string): string {
  const clean = cleanGradeQuotes(gradeStr).replace(/\s+/g, '');
  if (/^ט$/i.test(clean)) return 'ט';
  if (/^י$/i.test(clean)) return 'י';
  if (/^יא$/i.test(clean)) return 'יא';
  if (/^יב$/i.test(clean)) return 'יב';
  if (/^יג$/i.test(clean)) return 'יג';
  if (/^יד$/i.test(clean)) return 'יד';
  return clean;
}

/**
 * Extracts class designation from a line or text fragment.
 * Supports:
 * - "י6", "י 6", "י' 6", "י'6", "י-6"
 * - "יא5", "יא 5", "י\"א 5", "י\"א5"
 * - "יב2", "יב 2", "י\"ב 2"
 * - "ט6", "ט 6", "ט' 6"
 * - "כיתה י6", "כיתה י' 6", "שכבה י מקבילה 6"
 */
export function extractClassFromText(text: string): { fullName: string; grade: string; number: number } | null {
  if (!text) return null;

  // Pattern 1: Separate grade and number like "שכבה י מקבילה 6" or "שכבה: י, כיתה: 6"
  const multiFieldMatch = text.match(/(?:שכבה\s*:?\s*)(ט|י|יא|יב|יג|יד|ט'|י'|י"א|י"ב|י"ג|י"ד|ט׳|י׳|י״א|י״ב|י״ג|י״ד).*?(?:מקבילה|כיתה|מספר)?\s*:?\s*([1-8])\b/i);
  if (multiFieldMatch) {
    const grade = normalizeGrade(multiFieldMatch[1]);
    const num = parseInt(multiFieldMatch[2], 10);
    return { fullName: `${grade}${num}`, grade, number: num };
  }

  // Pattern 2: Standard class patterns with or without spaces, quotes, hyphens
  // e.g. "כיתה י6", "י6", "י 6", "י' 6", "י'6", "י\"א 5", "י\"א5", "יא5", "יב2", "ט6"
  const regex = /(?:(?:כיתה|מקבילה|שכבה)\s*[:\-_]?\s*)?(?:^|[\s,;(\[-])(ט|י|יא|יב|יג|יד|ט'|י'|י"א|י"ב|י"ג|י"ד|ט׳|י׳|י״א|י״ב|י״ג|י״ד)[\s\-_'״׳]*([1-8])(?:\b|[\s,;)\]-]|$)/i;
  const match = text.match(regex);
  if (match) {
    const grade = normalizeGrade(match[1]);
    const num = parseInt(match[2], 10);
    return { fullName: `${grade}${num}`, grade, number: num };
  }

  return null;
}

/**
 * Robust parser for text extracted from PDF or pasted directly by user
 */
export function parsePdfText(rawText: string, fallbackDefaultClass = 'י6'): ParsedStudentRow[] {
  const rows: ParsedStudentRow[] = [];
  if (!rawText || !rawText.trim()) return rows;

  // Detect any global header class (e.g. "כיתה י6")
  let globalClass = fallbackDefaultClass;
  const headerMatch = extractClassFromText(rawText);
  if (headerMatch) {
    globalClass = headerMatch.fullName;
  }

  let currentBlockClass = globalClass;
  const lines = rawText.split(/[\r\n]+/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if this line is purely a section header (e.g. "כיתה י6" or "=== יא2 ===" or "י6:")
    const lineClassMatch = extractClassFromText(trimmed);
    const hasTzInLine = /\b(\d{8,9})\b/.test(trimmed);

    if (lineClassMatch && !hasTzInLine) {
      currentBlockClass = lineClassMatch.fullName;
      continue;
    }

    // Search for 8-9 digit Israeli ID (or 7-9 digit)
    const tzMatch = trimmed.match(/\b(\d{7,9})\b/);
    if (!tzMatch) continue;

    const tz = tzMatch[1].padStart(9, '0'); // Pad to standard 9 digits

    // Identify student's class
    let studentClass = lineClassMatch ? lineClassMatch.fullName : currentBlockClass;
    if (!studentClass) {
      studentClass = fallbackDefaultClass;
    }

    // Find gender if present ('ז' or 'נ')
    let gender: string | undefined = undefined;
    if (/\bז\b|\bזכר\b/.test(trimmed)) {
      gender = 'ז';
    } else if (/\bנ\b|\bנקבה\b/.test(trimmed)) {
      gender = 'נ';
    }

    // Extract student's name by stripping TZ, Class, Serial numbers, and noise
    let cleanLine = trimmed;

    // Remove TZ
    cleanLine = cleanLine.replace(tzMatch[1], ' ');

    // Remove Class match string if present in line
    if (lineClassMatch) {
      cleanLine = cleanLine.replace(/(?:כיתה|מקבילה|שכבה)?\s*[:\-_]?\s*(ט|י|יא|יב|יג|יד|ט'|י'|י"א|י"ב|י"ג|י"ד|ט׳|י׳|י״א|י״ב|י״ג|י״ד)[\s\-_'״׳]*[1-8]\b/gi, ' ');
    }

    // Remove leading index / serial numbers like "1.", "35", "1 "
    cleanLine = cleanLine.replace(/^\s*\d+[\.\)\-]?\s*/, ' ');

    // Remove noise words
    cleanLine = cleanLine.replace(/\b(זכר|נקבה|ז|נ|כיתה|מקבילה|שכבה|תז|ת\.ז|ת"ז|תעודת\s*זהות|שם\s*משפחה|שם\s*פרטי)\b/g, ' ');

    // Remove punctuation
    cleanLine = cleanLine.replace(/[,;:\(\)\[\]\-_]/g, ' ');

    // Extract remaining Hebrew words
    const words = cleanLine
      .split(/\s+/)
      .map((w) => w.trim())
      .filter((w) => /^[\u0590-\u05FF\-'"]+$/.test(w) && w.length >= 2);

    let lastName = '';
    let firstName = '';

    if (words.length >= 2) {
      lastName = words[0];
      firstName = words.slice(1).join(' ');
    } else if (words.length === 1) {
      lastName = words[0];
      firstName = '';
    } else {
      lastName = 'תלמיד';
      firstName = '';
    }

    rows.push({
      tz,
      lastName,
      firstName,
      targetClassName: studentClass,
      gender,
      rawText: trimmed,
    });
  }

  return rows;
}

// Read text from PDF File using pdf.js
export async function extractTextFromPdf(fileBuffer: ArrayBuffer): Promise<string> {
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(fileBuffer),
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  let fullText = '';

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    // Group items by line based on vertical Y position
    const items = content.items as any[];
    if (items.length === 0) continue;

    // Group items into lines
    const lineMap: Record<number, string[]> = {};
    for (const item of items) {
      const y = Math.round(item.transform[5]);
      if (!lineMap[y]) {
        lineMap[y] = [];
      }
      lineMap[y].push(item.str);
    }

    // Sort lines from top to bottom
    const sortedYs = Object.keys(lineMap)
      .map(Number)
      .sort((a, b) => b - a);

    for (const y of sortedYs) {
      const lineStr = lineMap[y].join(' ');
      fullText += lineStr + '\n';
    }
  }

  return fullText;
}

// Read Excel / CSV file buffer
export function parseExcelBuffer(fileBuffer: ArrayBuffer, fallbackDefaultClass = 'י6'): ParsedStudentRow[] {
  const workbook = XLSX.read(fileBuffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return [];

  const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });
  const rows: ParsedStudentRow[] = [];

  for (const row of rawData) {
    const keys = Object.keys(row);
    const findVal = (patterns: string[]): string => {
      const key = keys.find((k) => {
        const clean = k.replace(/['"״׳.]/g, '').trim().toLowerCase();
        return patterns.some((p) => clean.includes(p));
      });
      return key ? String(row[key]).trim() : '';
    };

    const tzRaw = findVal(['תז', 'תעודתזהות', 'זהות', 'id', 'ת.ז']);
    const lastName = findVal(['שםמשפחה', 'משפחה', 'lastname']);
    const firstName = findVal(['שםפרטי', 'פרטי', 'firstname']);
    const fullNameRaw = findVal(['שםמלא', 'שם', 'fullname', 'name']);
    const grade = findVal(['כיתה', 'שכבה', 'grade']);
    const parallel = findVal(['מקבילה', 'מספרכיתה', 'מספר', 'parallel']);
    const gender = findVal(['מין', 'gender']);

    const tzMatch = tzRaw.match(/\d{7,9}/);
    const tz = tzMatch ? tzMatch[0].padStart(9, '0') : '';

    if (!tz && !lastName && !fullNameRaw) continue;

    // Detect class
    let targetClassName = fallbackDefaultClass;
    if (grade && parallel) {
      const g = normalizeGrade(grade);
      const p = parallel.replace(/\D/g, '');
      if (g && p) targetClassName = `${g}${p}`;
    } else if (grade) {
      const detected = extractClassFromText(grade);
      if (detected) targetClassName = detected.fullName;
    }

    let finalLastName = lastName;
    let finalFirstName = firstName;

    if (!finalLastName && fullNameRaw) {
      const words = fullNameRaw.trim().split(/\s+/);
      finalLastName = words[0] || 'תלמיד';
      finalFirstName = words.slice(1).join(' ');
    }

    rows.push({
      tz: tz || '000000000',
      lastName: finalLastName || 'תלמיד',
      firstName: finalFirstName || '',
      targetClassName: cleanGradeQuotes(targetClassName) || fallbackDefaultClass,
      gender: gender || undefined,
    });
  }

  return rows;
}
