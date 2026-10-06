/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, cleanForFirestore } from './firebase';
import { SchoolClass, Student, DigumNote, Grade, ClassNumber, SgReport, SgReportEntry } from './types';
import { INITIAL_CLASSES } from './constants/grades';
import { Header } from './components/Header';
import { AddClassForm } from './components/AddClassForm';
import { ClassGrid } from './components/ClassGrid';
import { StatsBar } from './components/StatsBar';
import { ClassProfileView } from './components/ClassProfileView';
import { ClassDetailsModal } from './components/ClassDetailsModal';
import { DocumentUploadModal } from './components/DocumentUploadModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { PublicHomeScreen } from './components/PublicHomeScreen';

const STORAGE_KEY = 'digum_classes_db_v3';

export default function App() {
  const [classes, setClasses] = useState<SchoolClass[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((c: any) => ({
            ...c,
            teacherName: c.teacherName || '',
            mks: c.mks || '',
            notes: c.notes || '',
            track: c.track || 'כללי',
            students: Array.isArray(c.students) ? c.students : [],
          }));
        }
      }
    } catch (e) {
      console.error('Failed to load classes from localStorage', e);
    }
    return INITIAL_CLASSES;
  });

  const [isCloudSynced, setIsCloudSynced] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Authentication guard: default to public landing screen unless authenticated
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('digum_admin_auth') === 'true';
    } catch (e) {
      return false;
    }
  });

  const handleAdminLogin = () => {
    setIsAdminAuthenticated(true);
    try {
      sessionStorage.setItem('digum_admin_auth', 'true');
    } catch (e) {}
    addToast('success', 'שלום מנהל המערכת', 'כניסה למסך הניהול בוצעה בהצלחה');
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    try {
      sessionStorage.removeItem('digum_admin_auth');
    } catch (e) {}
    setSelectedClassId(null);
    setEditingClass(null);
    addToast('info', 'יצאת ממסך הניהול', 'המערכת ננעלה בהצלחה');
  };

  // Navigation: if a class is selected, show its full dedicated profile
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [sgReports, setSgReports] = useState<SgReport[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time Cloud Synchronization with Firestore
  useEffect(() => {
    let isInitialLoad = true;

    const unsubscribe = onSnapshot(
      collection(db, 'classes'),
      async (snapshot) => {
        setIsCloudSynced(true);

        // If the cloud database is completely empty on first launch, seed from local/initial
        if (snapshot.empty && isInitialLoad) {
          isInitialLoad = false;
          const toSeed = classes.length > 0 ? classes : INITIAL_CLASSES;
          if (toSeed.length > 0) {
            setIsSyncing(true);
            try {
              const batch = writeBatch(db);
              for (const cls of toSeed) {
                batch.set(doc(db, 'classes', cls.id), cleanForFirestore(cls));
              }
              await batch.commit();
            } catch (err) {
              console.error('Error seeding initial classes to Firestore:', err);
            } finally {
              setIsSyncing(false);
            }
          }
          return;
        }

        isInitialLoad = false;
        const cloudClasses: SchoolClass[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as SchoolClass;
          cloudClasses.push({
            ...data,
            teacherName: data.teacherName || '',
            mks: data.mks || '',
            notes: data.notes || '',
            track: data.track || 'כללי',
            students: Array.isArray(data.students) ? data.students : [],
          });
        });

        // Sort classes (newest first)
        cloudClasses.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        setClasses(cloudClasses);
        // Save local backup cache
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudClasses));
        } catch (e) {
          // ignore cache error
        }
      },
      (error) => {
        console.error('Firestore listener error:', error);
        handleFirestoreError(error, OperationType.GET, 'classes');
      }
    );

    return () => unsubscribe();
  }, []);

  // Listen to SG reports from Firestore for history
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'sg_reports'),
      (snapshot) => {
        const reports: SgReport[] = [];
        snapshot.forEach((d) => {
          reports.push(d.data() as SgReport);
        });
        reports.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setSgReports(reports);
      },
      (err) => {
        console.error('Failed to listen to sg_reports:', err);
      }
    );
    return () => unsub();
  }, []);

  // Offline / local cache backup
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(classes));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [classes]);

  // Toast helper
  const addToast = (type: 'success' | 'error' | 'info', title: string, description?: string) => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Add Class (Saves directly to Firestore Cloud)
  const handleAddClass = (
    newClassData: Omit<SchoolClass, 'id' | 'createdAt' | 'updatedAt' | 'students'>
  ): { success: boolean; message?: string } => {
    const exists = classes.some((c) => c.fullName === newClassData.fullName);
    if (exists) {
      return {
        success: false,
        message: `הכיתה ${newClassData.fullName} כבר קיימת במאגר! לא ניתן להוסיף את אותה כיתה יותר מפעם אחת.`,
      };
    }

    const newClass: SchoolClass = {
      ...newClassData,
      teacherName: newClassData.teacherName ? newClassData.teacherName.trim() : '',
      mks: newClassData.mks ? newClassData.mks.trim() : '',
      notes: newClassData.notes ? newClassData.notes.trim() : '',
      track: newClassData.track || 'כללי',
      id: 'class-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      students: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Optimistic local update
    setClasses((prev) => [newClass, ...prev]);

    // Persist to Cloud Firestore
    setIsSyncing(true);
    setDoc(doc(db, 'classes', newClass.id), cleanForFirestore(newClass))
      .then(() => {
        setIsSyncing(false);
      })
      .catch((err) => {
        setIsSyncing(false);
        handleFirestoreError(err, OperationType.CREATE, `classes/${newClass.id}`);
      });

    addToast(
      'success',
      `כיתה ${newClass.fullName} נשמרה בענן בהצלחה!`,
      newClass.teacherName ? `מחנך: ${newClass.teacherName}` : undefined
    );

    return { success: true };
  };

  // Delete Class (Completely removes from cloud and returns to opening screen)
  const handleDeleteClass = (id: string) => {
    const target = classes.find((c) => c.id === id);

    // Remove locally
    setClasses((prev) => prev.filter((c) => c.id !== id));
    setSelectedClassId(null);
    setEditingClass(null);

    // Remove from Firestore Cloud
    setIsSyncing(true);
    deleteDoc(doc(db, 'classes', id))
      .then(() => {
        setIsSyncing(false);
      })
      .catch((err) => {
        setIsSyncing(false);
        handleFirestoreError(err, OperationType.DELETE, `classes/${id}`);
      });

    if (target) {
      addToast('info', `כיתה ${target.fullName} נמחקה לחלוטין מהענן ומהמאגר`);
    }
  };

  // Save edited class (Updates in Firestore Cloud)
  const handleSaveClass = (updated: SchoolClass) => {
    const sanitizedUpdated: SchoolClass = {
      ...updated,
      teacherName: updated.teacherName || '',
      mks: updated.mks || '',
      notes: updated.notes || '',
      track: updated.track || 'כללי',
    };

    setClasses((prev) => prev.map((c) => (c.id === updated.id ? sanitizedUpdated : c)));

    setIsSyncing(true);
    setDoc(doc(db, 'classes', updated.id), cleanForFirestore(sanitizedUpdated), { merge: true })
      .then(() => {
        setIsSyncing(false);
      })
      .catch((err) => {
        setIsSyncing(false);
        handleFirestoreError(err, OperationType.UPDATE, `classes/${updated.id}`);
      });

    addToast('success', `כיתה ${updated.fullName} עודכנה בענן בהצלחה`);
  };

  // Add student to a specific class (Updates in Firestore Cloud)
  const handleAddStudentToClass = (
    classId: string,
    studentData: Omit<Student, 'id' | 'addedAt' | 'digumNotes'>
  ) => {
    const targetClass = classes.find((c) => c.id === classId);
    if (!targetClass) return;

    const newStudent: Student = {
      ...studentData,
      id: `s-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      digumNotes: [],
      addedAt: Date.now(),
    };

    const updatedClass: SchoolClass = {
      ...targetClass,
      students: [...targetClass.students, newStudent],
      updatedAt: Date.now(),
    };

    setClasses((prev) => prev.map((c) => (c.id === classId ? updatedClass : c)));

    setIsSyncing(true);
    setDoc(doc(db, 'classes', classId), cleanForFirestore(updatedClass), { merge: true })
      .then(() => setIsSyncing(false))
      .catch((err) => {
        setIsSyncing(false);
        handleFirestoreError(err, OperationType.UPDATE, `classes/${classId}`);
      });

    addToast('success', 'התלמיד נוסף ונשמר בענן');
  };

  // Remove student from class
  const handleRemoveStudentFromClass = (classId: string, studentId: string) => {
    const targetClass = classes.find((c) => c.id === classId);
    if (!targetClass) return;

    const updatedClass: SchoolClass = {
      ...targetClass,
      students: targetClass.students.filter((s) => s.id !== studentId),
      updatedAt: Date.now(),
    };

    setClasses((prev) => prev.map((c) => (c.id === classId ? updatedClass : c)));

    setIsSyncing(true);
    setDoc(doc(db, 'classes', classId), cleanForFirestore(updatedClass), { merge: true })
      .then(() => setIsSyncing(false))
      .catch((err) => {
        setIsSyncing(false);
        handleFirestoreError(err, OperationType.UPDATE, `classes/${classId}`);
      });

    addToast('info', 'התלמיד הוסר מהכיתה בענן');
  };

  // Add Digum note to a student
  const handleAddDigumNote = (
    classId: string,
    studentId: string,
    noteData: Omit<DigumNote, 'id' | 'createdAt'>
  ) => {
    const targetClass = classes.find((c) => c.id === classId);
    if (!targetClass) return;

    const newNote: DigumNote = {
      ...noteData,
      id: `dn-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: Date.now(),
    };

    const updatedClass: SchoolClass = {
      ...targetClass,
      students: targetClass.students.map((s) => {
        if (s.id !== studentId) return s;
        return {
          ...s,
          digumNotes: [newNote, ...(s.digumNotes || [])],
        };
      }),
      updatedAt: Date.now(),
    };

    setClasses((prev) => prev.map((c) => (c.id === classId ? updatedClass : c)));

    setIsSyncing(true);
    setDoc(doc(db, 'classes', classId), cleanForFirestore(updatedClass), { merge: true })
      .then(() => setIsSyncing(false))
      .catch((err) => {
        setIsSyncing(false);
        handleFirestoreError(err, OperationType.UPDATE, `classes/${classId}`);
      });

    addToast('success', 'הערת דיגום נרשמה ונשמרה בענן', `${noteData.category}: ${noteData.note}`);
  };

  // Toggle Digum status (פתוח <-> טופל)
  const handleToggleDigumStatus = (classId: string, studentId: string, noteId: string) => {
    const targetClass = classes.find((c) => c.id === classId);
    if (!targetClass) return;

    const updatedClass: SchoolClass = {
      ...targetClass,
      students: targetClass.students.map((s) => {
        if (s.id !== studentId) return s;
        return {
          ...s,
          digumNotes: (s.digumNotes || []).map((n) => {
            if (n.id !== noteId) return n;
            const nextStatus: 'פתוח' | 'טופל' = n.status === 'פתוח' ? 'טופל' : 'פתוח';
            return { ...n, status: nextStatus };
          }),
        };
      }),
      updatedAt: Date.now(),
    };

    setClasses((prev) => prev.map((c) => (c.id === classId ? updatedClass : c)));

    setIsSyncing(true);
    setDoc(doc(db, 'classes', classId), cleanForFirestore(updatedClass), { merge: true })
      .then(() => setIsSyncing(false))
      .catch((err) => {
        setIsSyncing(false);
        handleFirestoreError(err, OperationType.UPDATE, `classes/${classId}`);
      });
  };

  // Delete Digum note
  const handleDeleteDigumNote = (classId: string, studentId: string, noteId: string) => {
    const targetClass = classes.find((c) => c.id === classId);
    if (!targetClass) return;

    const updatedClass: SchoolClass = {
      ...targetClass,
      students: targetClass.students.map((s) => {
        if (s.id !== studentId) return s;
        return {
          ...s,
          digumNotes: (s.digumNotes || []).filter((n) => n.id !== noteId),
        };
      }),
      updatedAt: Date.now(),
    };

    setClasses((prev) => prev.map((c) => (c.id === classId ? updatedClass : c)));

    setIsSyncing(true);
    setDoc(doc(db, 'classes', classId), cleanForFirestore(updatedClass), { merge: true })
      .then(() => setIsSyncing(false))
      .catch((err) => {
        setIsSyncing(false);
        handleFirestoreError(err, OperationType.UPDATE, `classes/${classId}`);
      });
  };

  // Save response to a Digum note
  const handleSaveDigumResponse = async (
    classId: string,
    studentId: string,
    noteId: string,
    responseText: string,
    responderName?: string
  ) => {
    const targetClass = classes.find((c) => c.id === classId);
    if (!targetClass) return;

    const updatedClass: SchoolClass = {
      ...targetClass,
      students: targetClass.students.map((s) => {
        if (s.id !== studentId) return s;
        return {
          ...s,
          digumNotes: (s.digumNotes || []).map((n) => {
            if (n.id !== noteId) return n;
            return {
              ...n,
              response: responseText.trim(),
              respondedAt: Date.now(),
              respondedBy: responderName || 'מחנך/מפקד',
              status: 'טופל',
            };
          }),
        };
      }),
      updatedAt: Date.now(),
    };

    setClasses((prev) => prev.map((c) => (c.id === classId ? updatedClass : c)));

    setIsSyncing(true);
    try {
      await setDoc(doc(db, 'classes', classId), cleanForFirestore(updatedClass), { merge: true });
      addToast('success', 'התגובה נשמרה בהצלחה', 'הערת הדיגום סומנה כטופלה עם התגובה');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `classes/${classId}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Save complete SG report to Firestore & sync students
  const handleSaveSgReport = async (report: SgReport) => {
    setIsSyncing(true);
    try {
      const entriesByClass: Record<string, SgReportEntry[]> = {};
      for (const entry of report.entries) {
        if (!entriesByClass[entry.classId]) {
          entriesByClass[entry.classId] = [];
        }
        entriesByClass[entry.classId].push(entry);
      }

      const batch = writeBatch(db);
      let updatedClassesList = [...classes];

      for (const [classId, entries] of Object.entries(entriesByClass)) {
        const classIdx = updatedClassesList.findIndex((c) => c.id === classId);
        if (classIdx === -1) continue;

        const currentClass = updatedClassesList[classIdx];
        const updatedStudents = currentClass.students.map((st) => {
          const matchEntries = entries.filter((e) => e.studentId === st.id);
          if (matchEntries.length === 0) return st;

          const newNotes: DigumNote[] = matchEntries.map((e, idx) => ({
            id: `note-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
            studentId: st.id,
            category: e.infractions[0] || 'דיגום',
            note: e.customNote || '',
            infractions: e.infractions,
            reportedBy: report.dutyOfficerName,
            status: 'פתוח',
            date: report.date,
            createdAt: Date.now() + idx,
          }));

          return {
            ...st,
            digumNotes: [...newNotes, ...(st.digumNotes || [])],
          };
        });

        const updatedClass: SchoolClass = {
          ...currentClass,
          students: updatedStudents,
          updatedAt: Date.now(),
        };

        updatedClassesList[classIdx] = updatedClass;
        batch.set(doc(db, 'classes', classId), cleanForFirestore(updatedClass), { merge: true });
      }

      batch.set(doc(db, 'sg_reports', report.id), cleanForFirestore(report));
      await batch.commit();

      setClasses(updatedClassesList);
      addToast(
        'success',
        'דו״ח ש״ג נשמר בהצלחה בענן!',
        `ההערות עבור ${report.entries.length} תלמידים סונכרנו לכיתות הרלוונטיות ע״י התורן ${report.dutyOfficerName}`
      );
    } catch (err) {
      console.error('Failed to save SG report:', err);
      addToast('error', 'שגיאה בשמירת הדו״ח', 'אנא נסו שנית');
    } finally {
      setIsSyncing(false);
    }
  };

  // Apply students parsed from PDF / Excel / List (Batch update in Cloud)
  const handleApplyStudentsFromDocument = async (
    classUpdates: { className: string; newStudents: Student[] }[]
  ) => {
    let totalAdded = 0;
    let newlyCreatedClassesCount = 0;

    // Helper to parse grade and number from class name (e.g. "י6", "יא2", "ט4")
    const parseClassParts = (name: string): { grade: Grade; number: ClassNumber } => {
      const match = name.match(/^(ט|י|יא|יב|יג|יד)([1-8])$/);
      if (match) {
        return { grade: match[1] as Grade, number: parseInt(match[2], 10) as ClassNumber };
      }
      return { grade: 'י', number: 6 };
    };

    let updatedList = [...classes];

    for (const update of classUpdates) {
      const existingIdx = updatedList.findIndex((c) => c.fullName === update.className);

      if (existingIdx !== -1) {
        const cls = updatedList[existingIdx];
        const existingTzs = new Set(cls.students.map((s) => s.tz));
        const studentsToAdd = update.newStudents.filter((s) => !existingTzs.has(s.tz));
        totalAdded += studentsToAdd.length;

        updatedList[existingIdx] = {
          ...cls,
          students: [...cls.students, ...studentsToAdd],
          updatedAt: Date.now(),
        };
      } else {
        // Class does not exist yet! Automatically create it!
        const { grade, number } = parseClassParts(update.className);
        const newClass: SchoolClass = {
          id: `class-${Date.now()}-${Math.floor(Math.random() * 1000)}-${update.className}`,
          grade,
          number,
          fullName: update.className,
          teacherName: '',
          mks: '',
          track: 'כללי',
          notes: '',
          students: update.newStudents,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        totalAdded += update.newStudents.length;
        newlyCreatedClassesCount++;
        updatedList.push(newClass);
      }
    }

    setClasses(updatedList);

    // Save batch to Cloud
    setIsSyncing(true);
    try {
      const batch = writeBatch(db);
      for (const cls of updatedList) {
        batch.set(doc(db, 'classes', cls.id), cleanForFirestore(cls), { merge: true });
      }
      await batch.commit();
    } catch (err) {
      console.error('Failed to sync students batch to cloud:', err);
    } finally {
      setIsSyncing(false);
    }

    addToast(
      'success',
      'טעינת התלמידים הושלמה וסונכרנה בענן!',
      newlyCreatedClassesCount > 0
        ? `נוספו ${totalAdded} תלמידים לפי כיתות, ונוצרו ${newlyCreatedClassesCount} כיתות חדשות שהתגלו ברשימה!`
        : `נוספו ${totalAdded} תלמידים לכיתות הרלוונטיות במאגר.`
    );
  };

  // Reset database (Deletes all classes from Cloud)
  const handleReset = async () => {
    if (classes.length === 0) return;
    setIsSyncing(true);
    try {
      const batch = writeBatch(db);
      for (const cls of classes) {
        batch.delete(doc(db, 'classes', cls.id));
      }
      await batch.commit();
      setClasses([]);
      setSelectedClassId(null);
      addToast('info', 'כל הנתונים אופסו ונמחקו מהענן בהצלחה');
    } catch (err) {
      console.error('Error resetting database in cloud:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Export JSON backup
  const handleExport = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(classes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `digum-backup-${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast('success', 'קובץ הגיבוי יוצא בהצלחה');
  };

  // Import JSON backup (Writes to Cloud)
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          setClasses(parsed);
          setIsSyncing(true);
          try {
            const batch = writeBatch(db);
            for (const cls of parsed) {
              batch.set(doc(db, 'classes', cls.id), cleanForFirestore(cls));
            }
            await batch.commit();
          } catch (err) {
            console.error('Error uploading backup to cloud:', err);
          } finally {
            setIsSyncing(false);
          }
          addToast('success', `יובאו וסונכרנו ${parsed.length} כיתות בענן!`);
        } else {
          addToast('error', 'קובץ לא תקין', 'הקובץ חייב להכיל רשימת כיתות תקינה.');
        }
      } catch (err) {
        addToast('error', 'שגיאה בקריאת הקובץ', 'וודאו שזהו קובץ JSON תקני.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const scrollToForm = () => {
    const el = document.getElementById('add-class-form');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const totalStudents = classes.reduce((sum, c) => sum + c.students.length, 0);
  const totalOpenDigumNotes = classes.reduce(
    (sum, c) =>
      sum +
      c.students.reduce(
        (acc, s) => acc + (s.digumNotes?.filter((n) => n.status === 'פתוח').length || 0),
        0
      ),
    0
  );

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  // If not logged in as Admin, show the public SG Digum portal matching bistbash
  if (!isAdminAuthenticated) {
    return (
      <>
        <PublicHomeScreen
          classes={classes}
          sgReports={sgReports}
          isCloudSynced={isCloudSynced}
          onAdminLoginSuccess={handleAdminLogin}
          onAddDigumNote={handleAddDigumNote}
          onToggleDigumStatus={handleToggleDigumStatus}
          onSaveSgReport={handleSaveSgReport}
          onSaveDigumResponse={handleSaveDigumResponse}
        />
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-['Assistant',sans-serif]"
      dir="rtl"
    >
      {/* Hidden file input for JSON import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      {/* Digum Header */}
      <Header
        totalClasses={classes.length}
        totalStudents={totalStudents}
        totalOpenDigumNotes={totalOpenDigumNotes}
        isCloudSynced={isCloudSynced}
        isSyncing={isSyncing}
        onReset={handleReset}
        onExport={handleExport}
        onImport={handleImportClick}
        onOpenDocumentUpload={() => setIsDocumentModalOpen(true)}
        onScrollToAdd={scrollToForm}
        onLogout={handleAdminLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {selectedClass ? (
          /* Profile View for the Selected Class */
          <ClassProfileView
            schoolClass={selectedClass}
            onBack={() => setSelectedClassId(null)}
            onEditClass={(c) => setEditingClass(c)}
            onDeleteClass={handleDeleteClass}
            onAddStudent={handleAddStudentToClass}
            onRemoveStudent={handleRemoveStudentFromClass}
            onAddDigumNote={handleAddDigumNote}
            onToggleDigumStatus={handleToggleDigumStatus}
            onDeleteDigumNote={handleDeleteDigumNote}
          />
        ) : (
          /* Home Screen: Form & Grid */
          <>
            {/* Real-time Cloud Notice Banner */}
            <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-blue-500/10 border border-blue-200/80 rounded-2xl p-3 sm:px-5 flex items-center justify-between gap-3 text-xs font-bold text-blue-900 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span>
                  <strong>סנכרון ענן פעיל בזמן אמת:</strong> כל השינויים (כיתות, תלמידים והערות דיגום) נשמרים בענן ונגישים מכל מכשיר, טלפון ומחשב.
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-blue-700 bg-white/80 px-2.5 py-1 rounded-xl border border-blue-100">
                ☁️ מסד ענן מקושר
              </div>
            </div>

            {/* Quick Stats overview across all classes */}
            <StatsBar classes={classes} onSelectGrade={() => {}} />

            {/* Direct Add Class Form (No dropdowns needed for class selection!) */}
            <AddClassForm
              existingClasses={classes}
              onAddClass={handleAddClass}
            />

            {/* Grid of all classes */}
            <ClassGrid
              classes={classes}
              onOpenProfile={(c) => setSelectedClassId(c.id)}
              onAddClick={scrollToForm}
              onOpenDocumentUpload={() => setIsDocumentModalOpen(true)}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center font-black text-[10px]">
              D
            </div>
            <span>Digum — מערכת ניהול כיתות, תלמידים והערות דיגום</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-emerald-600 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              שמירה וסנכרון בענן
            </span>
            <span>•</span>
            <span>טעינת תלמידים ישירות מ-PDF משו״ב</span>
          </div>
        </div>
      </footer>

      {/* Edit Class Modal */}
      <ClassDetailsModal
        isOpen={!!editingClass}
        schoolClass={editingClass}
        onClose={() => setEditingClass(null)}
        onSave={handleSaveClass}
        onDelete={handleDeleteClass}
        existingClasses={classes}
      />

      {/* Document / PDF Upload Modal */}
      <DocumentUploadModal
        isOpen={isDocumentModalOpen}
        onClose={() => setIsDocumentModalOpen(false)}
        existingClasses={classes}
        onApplyStudents={handleApplyStudentsFromDocument}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
