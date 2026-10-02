const express = require('express');
const router = express.Router();
const db = require('../db');

// --- Helper Functions ---
function sanitizeExamForStudent(exam) {
  // Strip out correct answers from questions sent to student
  const cloned = JSON.parse(JSON.stringify(exam));
  cloned.questions = cloned.questions.map(q => {
    const { correctKey, ...safeQ } = q;
    return safeQ;
  });
  return cloned;
}

// 1. Public App Configuration
router.get('/config', (req, res) => {
  const settings = db.getSettings();
  res.json({
    schoolName: settings.schoolName,
    schoolTagline: settings.schoolTagline,
    maxStrikes: settings.maxStrikes,
    allowCalculator: settings.allowCalculator,
    externalPresets: settings.externalPresets || []
  });
});

// 2. Student Authentication / Exam Start
router.post('/auth/student', (req, res) => {
  const { nisn, name, token, className } = req.body;

  if (!nisn || !name || !token) {
    return res.status(400).json({ error: 'NISN, Nama, dan Token Ujian wajib diisi!' });
  }

  const cleanToken = token.trim().toUpperCase();
  const exams = db.getExams();
  const matchedExam = exams.find(e => e.isActive && e.token.toUpperCase() === cleanToken);

  if (!matchedExam) {
    return res.status(401).json({ error: 'Token ujian tidak valid atau ujian sedang tidak aktif!' });
  }

  // Create or retrieve session ID
  const sessionId = `${matchedExam.id}_${nisn.trim()}`;
  const sessions = db.getSessions();
  let session = sessions[sessionId];

  if (!session) {
    session = {
      sessionId,
      examId: matchedExam.id,
      nisn: nisn.trim(),
      name: name.trim(),
      className: className ? className.trim() : 'Reguler',
      startTime: Date.now(),
      durationMinutes: matchedExam.durationMinutes,
      answers: {},        // { qId: { answer: 'B', isDoubtful: false } }
      strikes: 0,
      isLocked: false,
      lockReason: null,
      isFinished: false,
      currentQuestionIndex: 0
    };
  }

  // If already finished
  if (session.isFinished) {
    return res.status(403).json({ error: 'Anda sudah mengumpulkan ujian ini sebelumnya.' });
  }

  db.saveSession(sessionId, session);

  // Return safe exam data & session
  const safeExam = sanitizeExamForStudent(matchedExam);
  res.json({
    success: true,
    session,
    exam: safeExam
  });
});

// 3. Save Question Answer (Live Auto-save)
router.post('/exam/answer', (req, res) => {
  const { sessionId, questionId, answer, isDoubtful, questionIndex } = req.body;
  if (!sessionId || !questionId) {
    return res.status(400).json({ error: 'Parameter tidak lengkap' });
  }

  const sessions = db.getSessions();
  const session = sessions[sessionId];

  if (!session) {
    return res.status(404).json({ error: 'Sesi ujian tidak ditemukan' });
  }

  if (session.isLocked) {
    return res.status(403).json({ error: 'Ujian sedang terkunci oleh pengawas.' });
  }

  if (session.isFinished) {
    return res.status(403).json({ error: 'Ujian telah selesai.' });
  }

  if (!session.answers) session.answers = {};
  session.answers[questionId] = {
    answer: answer || '',
    isDoubtful: !!isDoubtful,
    savedAt: new Date().toISOString()
  };

  if (typeof questionIndex === 'number') {
    session.currentQuestionIndex = questionIndex;
  }

  db.saveSession(sessionId, session);
  res.json({ success: true, savedAnswersCount: Object.keys(session.answers).length });
});

// 4. Report Violation (Anti-Cheat Strike)
router.post('/exam/violation', (req, res) => {
  const { sessionId, violationType, details } = req.body;
  const settings = db.getSettings();
  const maxStrikes = settings.maxStrikes || 3;

  const sessions = db.getSessions();
  const session = sessions[sessionId];

  if (!session) {
    return res.status(404).json({ error: 'Sesi tidak ditemukan' });
  }

  session.strikes = (session.strikes || 0) + 1;
  const isLocked = session.strikes >= maxStrikes;
  if (isLocked) {
    session.isLocked = true;
    session.lockReason = `Mencapai batas maksimal pelanggaran (${session.strikes}/${maxStrikes}): ${violationType}`;
  }

  db.saveSession(sessionId, session);

  // Log violation in DB
  const violationRecord = db.recordViolation({
    sessionId,
    nisn: session.nisn,
    name: session.name,
    examId: session.examId,
    violationType,
    details: details || 'Pelanggaran anti-cheat terdeteksi oleh sistem',
    strikesNow: session.strikes,
    isLocked
  });

  res.json({
    success: true,
    strikes: session.strikes,
    maxStrikes,
    isLocked,
    violationRecord
  });
});

// 5. Submit Exam
router.post('/exam/submit', (req, res) => {
  const { sessionId } = req.body;
  const sessions = db.getSessions();
  const session = sessions[sessionId];

  if (!session) {
    return res.status(404).json({ error: 'Sesi tidak ditemukan' });
  }

  const exam = db.getExamById(session.examId);
  if (!exam) {
    return res.status(404).json({ error: 'Data ujian tidak ditemukan' });
  }

  // Grade multiple choice questions
  let totalScore = 0;
  let maxPossibleScore = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let essayCount = 0;
  let unansweredCount = 0;

  const detailedAnswers = exam.questions.map(q => {
    const studentAnsObj = session.answers ? session.answers[q.id] : null;
    const studentAns = studentAnsObj ? studentAnsObj.answer : '';
    const points = q.points || 10;
    maxPossibleScore += points;

    let isCorrect = false;
    if (q.type === 'multiple-choice') {
      if (!studentAns) {
        unansweredCount++;
      } else if (studentAns.toUpperCase() === (q.correctKey || '').toUpperCase()) {
        isCorrect = true;
        correctCount++;
        totalScore += points;
      } else {
        wrongCount++;
      }
    } else if (q.type === 'essay') {
      essayCount++;
      if (!studentAns) unansweredCount++;
    }

    return {
      questionId: q.id,
      number: q.number,
      type: q.type,
      studentAnswer: studentAns,
      correctKey: q.correctKey,
      isCorrect,
      pointsEarned: isCorrect ? points : 0,
      pointsPossible: points
    };
  });

  const finalPercentage = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;

  const submission = db.saveSubmission({
    sessionId,
    examId: exam.id,
    examTitle: exam.title,
    subject: exam.subject,
    nisn: session.nisn,
    name: session.name,
    className: session.className,
    startTime: session.startTime,
    finishTime: Date.now(),
    timeSpentSeconds: Math.round((Date.now() - session.startTime) / 1000),
    totalScore,
    maxPossibleScore,
    percentage: finalPercentage,
    correctCount,
    wrongCount,
    essayCount,
    unansweredCount,
    totalQuestions: exam.questions.length,
    strikes: session.strikes || 0,
    answers: session.answers,
    detailedAnswers
  });

  // Mark session finished
  session.isFinished = true;
  db.saveSession(sessionId, session);

  res.json({
    success: true,
    result: {
      studentName: session.name,
      nisn: session.nisn,
      examTitle: exam.title,
      subject: exam.subject,
      totalScore,
      maxPossibleScore,
      percentage: finalPercentage,
      correctCount,
      wrongCount,
      essayCount,
      unansweredCount,
      totalQuestions: exam.questions.length,
      timeSpentSeconds: submission.timeSpentSeconds,
      strikes: session.strikes || 0
    }
  });
});

// --- ADMIN / PROCTOR ENDPOINTS ---

// Admin Pin Check
router.post('/admin/login', (req, res) => {
  const { pin } = req.body;
  const settings = db.getSettings();
  if (pin === settings.adminPin) {
    return res.json({ success: true, message: 'Autentikasi Pengawas Berhasil' });
  }
  return res.status(401).json({ error: 'PIN Pengawas / Admin Salah!' });
});

// Admin Dashboard Overview Stats
router.get('/admin/overview', (req, res) => {
  const exams = db.getExams();
  const sessions = Object.values(db.getSessions());
  const submissions = db.getSubmissions();
  const violations = db.getViolations();

  const activeStudents = sessions.filter(s => !s.isFinished).length;
  const lockedStudents = sessions.filter(s => !s.isFinished && s.isLocked).length;

  res.json({
    totalExams: exams.length,
    activeStudents,
    lockedStudents,
    totalSubmissions: submissions.length,
    totalViolations: violations.length
  });
});

// Admin: Get all exams
router.get('/admin/exams', (req, res) => {
  res.json(db.getExams());
});

// Admin: Save or update exam
router.post('/admin/exams', (req, res) => {
  const exam = req.body;
  if (!exam.title || !exam.token) {
    return res.status(400).json({ error: 'Judul dan Token Ujian wajib diisi!' });
  }

  if (!exam.id) {
    exam.id = 'exam-' + Date.now();
  }

  // Ensure questions have numbers
  if (exam.questions && Array.isArray(exam.questions)) {
    exam.questions = exam.questions.map((q, idx) => ({
      ...q,
      number: idx + 1,
      id: q.id || 'q_' + (idx + 1) + '_' + Date.now()
    }));
  }

  const saved = db.saveExam(exam);
  res.json({ success: true, exam: saved });
});

// Admin: Delete exam
router.delete('/admin/exams/:id', (req, res) => {
  db.deleteExam(req.params.id);
  res.json({ success: true });
});

// Admin: Generate new random token
router.post('/admin/token/generate', (req, res) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let token = '';
  for (let i = 0; i < 6; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  res.json({ token });
});

// Admin: Get all active sessions
router.get('/admin/sessions', (req, res) => {
  const sessions = Object.values(db.getSessions());
  res.json(sessions);
});

// Admin: Unlock student session / Reset strikes
router.post('/admin/sessions/:sessionId/unlock', (req, res) => {
  const { sessionId } = req.params;
  const sessions = db.getSessions();
  const session = sessions[sessionId];

  if (!session) {
    return res.status(404).json({ error: 'Sesi tidak ditemukan' });
  }

  session.isLocked = false;
  session.strikes = 0;
  session.lockReason = null;
  db.saveSession(sessionId, session);

  res.json({ success: true, message: `Siswa ${session.name} berhasil dibuka kuncinya!` });
});

// Admin: Force finish student exam
router.post('/admin/sessions/:sessionId/force-submit', (req, res) => {
  const { sessionId } = req.params;
  const sessions = db.getSessions();
  const session = sessions[sessionId];

  if (!session) {
    return res.status(404).json({ error: 'Sesi tidak ditemukan' });
  }

  session.isFinished = true;
  db.saveSession(sessionId, session);
  res.json({ success: true, message: `Ujian ${session.name} dipaksa selesai.` });
});

// Admin: Reset / Delete a student session
router.delete('/admin/sessions/:sessionId', (req, res) => {
  db.removeSession(req.params.sessionId);
  res.json({ success: true, message: 'Sesi berhasil direset.' });
});

// Admin: Get all submissions / grades
router.get('/admin/submissions', (req, res) => {
  res.json(db.getSubmissions());
});

// Admin: Get violations
router.get('/admin/violations', (req, res) => {
  res.json(db.getViolations());
});

// Admin: Update Settings
router.post('/admin/settings', (req, res) => {
  const updated = db.updateSettings(req.body);
  res.json({ success: true, settings: updated });
});

// System: Exit / Shutdown by Proctor PIN
router.post('/system/exit', (req, res) => {
  const { pin } = req.body || {};
  const settings = db.getSettings();
  if (pin !== settings.adminPin) {
    return res.status(403).json({ error: 'PIN Pengawas salah!' });
  }
  res.json({ success: true, message: 'Server dimatikan secara aman.' });
  setTimeout(() => {
    process.exit(0);
  }, 1000);
});

module.exports = router;
