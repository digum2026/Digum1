import { ClassNumber, Grade, GradeConfig, SchoolClass, Student, Track, DigumCategory } from '../types';

export const GRADES: Grade[] = ['ט', 'י', 'יא', 'יב', 'יג', 'יד'];

export const CLASS_NUMBERS: ClassNumber[] = [1, 2, 3, 4, 5, 6, 7, 8];

export const TRACKS: Track[] = [
  'כללי',
  'מדעי המחשב',
  'אלקטרוניקה ומחשבים',
  'חשמל',
  'מכטרוניקה',
  'מכונות תעופה',
];

export const DIGUM_CATEGORIES: DigumCategory[] = [
  'תספורת',
  'גילוח',
  'הופעה ולבוש',
  'נעליים',
  'כומתה',
  'תג',
  'אי-דיגום כללי',
  'אחר',
];

export const GRADE_CONFIGS: Record<Grade, GradeConfig> = {
  ט: {
    grade: 'ט',
    label: 'שכבת ט',
    levelName: 'שכבה ט (טתיקים)',
    color: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      badge: 'bg-blue-100 text-blue-800',
      accent: '#2563eb',
      ring: 'ring-blue-500',
    },
  },
  י: {
    grade: 'י',
    label: 'שכבת י',
    levelName: 'שכבה י (יודניקים)',
    color: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      badge: 'bg-emerald-100 text-emerald-800',
      accent: '#059669',
      ring: 'ring-emerald-500',
    },
  },
  יא: {
    grade: 'יא',
    label: 'שכבת יא',
    levelName: 'שכבה יא (יוד-אלפים)',
    color: {
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
      text: 'text-indigo-700',
      badge: 'bg-indigo-100 text-indigo-800',
      accent: '#4f46e5',
      ring: 'ring-indigo-500',
    },
  },
  יב: {
    grade: 'יב',
    label: 'שכבת יב',
    levelName: 'שכבה יב (יוד-בתים)',
    color: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      badge: 'bg-amber-100 text-amber-800',
      accent: '#d97706',
      ring: 'ring-amber-500',
    },
  },
  יג: {
    grade: 'יג',
    label: 'שכבת יג',
    levelName: 'שכבה יג (מכללה טכנולוגית)',
    color: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-700',
      badge: 'bg-purple-100 text-purple-800',
      accent: '#9333ea',
      ring: 'ring-purple-500',
    },
  },
  יד: {
    grade: 'יד',
    label: 'שכבת יד',
    levelName: 'שכבה יד (עתודה טכנולוגית)',
    color: {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-700',
      badge: 'bg-rose-100 text-rose-800',
      accent: '#e11d48',
      ring: 'ring-rose-500',
    },
  },
};

// 35 students from the user's uploaded PDF (Class י6)
export const PDF_SAMPLE_STUDENTS = [
  { tz: '220007579', lastName: 'אלגריססי', firstName: 'נדב', fullName: 'אלגריססי נדב', displayFormat: '220007579 - אלגריססי נדב', gender: 'ז' },
  { tz: '220007017', lastName: 'אלייב', firstName: 'סלין', fullName: 'אלייב סלין', displayFormat: '220007017 - אלייב סלין', gender: 'נ' },
  { tz: '219430378', lastName: 'ביטון', firstName: 'הודיה', fullName: 'ביטון הודיה', displayFormat: '219430378 - ביטון הודיה', gender: 'נ' },
  { tz: '220091052', lastName: 'ביידגלן', firstName: 'תאיר', fullName: 'ביידגלן תאיר', displayFormat: '220091052 - ביידגלן תאיר', gender: 'נ' },
  { tz: '220046536', lastName: 'בסטקר', firstName: 'אלינור', fullName: 'בסטקר אלינור', displayFormat: '220046536 - בסטקר אלינור', gender: 'נ' },
  { tz: '335669776', lastName: 'ברסקי', firstName: 'אריאל', fullName: 'ברסקי אריאל', displayFormat: '335669776 - ברסקי אריאל', gender: 'ז' },
  { tz: '335672135', lastName: 'גלמן', firstName: 'מאי', fullName: 'גלמן מאי', displayFormat: '335672135 - גלמן מאי', gender: 'ז' },
  { tz: '335692000', lastName: 'דמרי', firstName: 'אוראל', fullName: 'דמרי אוראל', displayFormat: '335692000 - דמרי אוראל', gender: 'ז' },
  { tz: '220043905', lastName: 'וויינברגר', firstName: 'ישי יהודה', fullName: 'וויינברגר ישי יהודה', displayFormat: '220043905 - וויינברגר ישי יהודה', gender: 'ז' },
  { tz: '335715108', lastName: 'וולפסון', firstName: 'מיה', fullName: 'וולפסון מיה', displayFormat: '335715108 - וולפסון מיה', gender: 'נ' },
  { tz: '218947737', lastName: 'זאודו-טסמה', firstName: 'אלידע', fullName: 'זאודו-טסמה אלידע', displayFormat: '218947737 - זאודו-טסמה אלידע', gender: 'ז' },
  { tz: '340945799', lastName: 'זולוטריוב', firstName: 'דריה', fullName: 'זולוטריוב דריה', displayFormat: '340945799 - זולוטריוב דריה', gender: 'נ' },
  { tz: '335718789', lastName: 'זילברמן', firstName: 'רון', fullName: 'זילברמן רון', displayFormat: '335718789 - זילברמן רון', gender: 'ז' },
  { tz: '335811436', lastName: 'חוקין', firstName: 'נועה שריי', fullName: 'חוקין נועה שריי', displayFormat: '335811436 - חוקין נועה שריי', gender: 'נ' },
  { tz: '335745741', lastName: 'חזן', firstName: 'רז', fullName: 'חזן רז', displayFormat: '335745741 - חזן רז', gender: 'ז' },
  { tz: '219666252', lastName: 'חיאייב קוגן', firstName: 'ליה', fullName: 'חיאייב קוגן ליה', displayFormat: '219666252 - חיאייב קוגן ליה', gender: 'נ' },
  { tz: '219879962', lastName: 'טרסקוב', firstName: 'איירין', fullName: 'טרסקוב איירין', displayFormat: '219879962 - טרסקוב איירין', gender: 'נ' },
  { tz: '339747123', lastName: 'לויטין', firstName: 'מרק', fullName: 'לויטין מרק', displayFormat: '339747123 - לויטין מרק', gender: 'ז' },
  { tz: '218927820', lastName: 'לנצנר', firstName: 'יאיר', fullName: 'לנצנר יאיר', displayFormat: '218927820 - לנצנר יאיר', gender: 'ז' },
  { tz: '335666913', lastName: 'מאטייב', firstName: 'תומר נתנאל', fullName: 'מאטייב תומר נתנאל', displayFormat: '335666913 - מאטייב תומר נתנאל', gender: 'ז' },
  { tz: '219665627', lastName: 'מיכלין', firstName: 'ליאן', fullName: 'מיכלין ליאן', displayFormat: '219665627 - מיכלין ליאן', gender: 'נ' },
  { tz: '335684841', lastName: 'מרדכייב', firstName: 'אמיר', fullName: 'מרדכייב אמיר', displayFormat: '335684841 - מרדכייב אמיר', gender: 'ז' },
  { tz: '219535739', lastName: 'ניסנוב', firstName: 'אמילי', fullName: 'ניסנוב אמילי', displayFormat: '219535739 - ניסנוב אמילי', gender: 'נ' },
  { tz: '335746236', lastName: 'סובולב', firstName: 'שון', fullName: 'סובולב שון', displayFormat: '335746236 - סובולב שון', gender: 'ז' },
  { tz: '335709788', lastName: 'פודגייצקי', firstName: 'בן', fullName: 'פודגייצקי בן', displayFormat: '335709788 - פודגייצקי בן', gender: 'ז' },
  { tz: '334502044', lastName: 'פישמן', firstName: 'אלי', fullName: 'פישמן אלי', displayFormat: '334502044 - פישמן אלי', gender: 'ז' },
  { tz: '335682126', lastName: 'פרנקל', firstName: 'שגיא', fullName: 'פרנקל שגיא', displayFormat: '335682126 - פרנקל שגיא', gender: 'ז' },
  { tz: '335745782', lastName: 'צרפתי', firstName: 'נריה', fullName: 'צרפתי נריה', displayFormat: '335745782 - צרפתי נריה', gender: 'ז' },
  { tz: '220009906', lastName: 'קדוש', firstName: 'שוהם', fullName: 'קדוש שוהם', displayFormat: '220009906 - קדוש שוהם', gender: 'נ' },
  { tz: '335823126', lastName: 'קראסינסקי', firstName: 'מייקל', fullName: 'קראסינסקי מייקל', displayFormat: '335823126 - קראסינסקי מייקל', gender: 'ז' },
  { tz: '335744298', lastName: 'קרבצ\'נקו', firstName: 'ללי', fullName: 'קרבצ\'נקו ללי', displayFormat: '335744298 - קרבצ\'נקו ללי', gender: 'נ' },
  { tz: '335713558', lastName: 'רבייב', firstName: 'יהונתן שמעון', fullName: 'רבייב יהונתן שמעון', displayFormat: '335713558 - רבייב יהונתן שמעון', gender: 'ז' },
  { tz: '335741401', lastName: 'רוזנברג', firstName: 'רון', fullName: 'רוזנברג רון', displayFormat: '335741401 - רוזנברג רון', gender: 'ז' },
  { tz: '335742433', lastName: 'שמאילוב', firstName: 'אלעד', fullName: 'שמאילוב אלעד', displayFormat: '335742433 - שמאילוב אלעד', gender: 'ז' },
  { tz: '335819728', lastName: 'שמעיה', firstName: 'יובל שלמה', fullName: 'שמעיה יובל שלמה', displayFormat: '335819728 - שמעיה יובל שלמה', gender: 'ז' },
];

// Start completely empty as requested ("תעשה שאין כיתות אלא אם הוספתי")
export const INITIAL_CLASSES: SchoolClass[] = [];
