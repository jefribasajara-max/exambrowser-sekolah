const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial default seed data
const initialData = {
  settings: {
    adminPin: '1234',
    schoolName: 'CBT EXAM BROWSER INDONESIA',
    schoolTagline: 'Sistem Ujian Terkunci & Aman Berstandar Nasional',
    maxStrikes: 3,
    allowCalculator: true,
    preventRightClick: true,
    preventInspect: true,
    fullScreenEnforced: true,
    externalPresets: [
      { name: 'Google Forms', url: 'https://docs.google.com/forms' },
      { name: 'Moodle LMS', url: 'https://moodle.org' },
      { name: 'Simulasi CBT Mandiri', url: 'http://localhost:3000' },
      { name: 'Server CBT Lokal (Port 8080)', url: 'http://localhost:8080' }
    ]
  },
  exams: [
    {
      id: 'exam-simulasi-01',
      title: 'Simulasi Ujian Akhir Semester (CBT Nasional)',
      subject: 'Pengetahuan Umum & Sains Teknologi',
      durationMinutes: 45,
      token: 'EXM2026',
      isActive: true,
      randomizeQuestions: false,
      questions: [
        {
          id: 'q1',
          number: 1,
          type: 'multiple-choice',
          question: 'Komponen perangkat keras komputer yang berfungsi sebagai otak utama dalam memproses instruksi aritmatika dan logika adalah...',
          options: [
            { key: 'A', text: 'RAM (Random Access Memory)' },
            { key: 'B', text: 'CPU (Central Processing Unit)' },
            { key: 'C', text: 'SSD (Solid State Drive)' },
            { key: 'D', text: 'GPU (Graphics Processing Unit)' },
            { key: 'E', text: 'Power Supply Unit' }
          ],
          correctKey: 'B',
          points: 10
        },
        {
          id: 'q2',
          number: 2,
          type: 'multiple-choice',
          question: 'Protokol jaringan yang digunakan untuk mengamankan komunikasi data di web browser menggunakan enkripsi SSL/TLS adalah...',
          options: [
            { key: 'A', text: 'HTTP' },
            { key: 'B', text: 'FTP' },
            { key: 'C', text: 'HTTPS' },
            { key: 'D', text: 'SMTP' },
            { key: 'E', text: 'DNS' }
          ],
          correctKey: 'C',
          points: 10
        },
        {
          id: 'q3',
          number: 3,
          type: 'multiple-choice',
          question: 'Sebuah segitiga siku-siku memiliki panjang alas 6 cm dan tinggi 8 cm. Berapakah panjang sisi miring (hipotenusa) segitiga tersebut?',
          options: [
            { key: 'A', text: '9 cm' },
            { key: 'B', text: '10 cm' },
            { key: 'C', text: '12 cm' },
            { key: 'D', text: '14 cm' },
            { key: 'E', text: '15 cm' }
          ],
          correctKey: 'B',
          points: 10
        },
        {
          id: 'q4',
          number: 4,
          type: 'multiple-choice',
          question: 'Langkah pertama yang paling bijak dan aman saat terjadi insiden kebocoran akun atau serangan phishing adalah...',
          options: [
            { key: 'A', text: 'Mengunggah screenshot ke media sosial' },
            { key: 'B', text: 'Segera mengganti kata sandi dan mengaktifkan Two-Factor Authentication (2FA)' },
            { key: 'C', text: 'Menghapus seluruh file dokumen pada komputer' },
            { key: 'D', text: 'Mematikan sambungan listrik PLN di seluruh gedung' },
            { key: 'E', text: 'Mengklik tautan dari pesan mencurigakan untuk memastikannya' }
          ],
          correctKey: 'B',
          points: 10
        },
        {
          id: 'q5',
          number: 5,
          type: 'multiple-choice',
          question: 'Dalam tata bahasa Indonesia yang baku, penulisan kata serapan yang benar menurut KBBI adalah...',
          options: [
            { key: 'A', text: 'Analisa, sistim, kwitansi' },
            { key: 'B', text: 'Analisis, sistem, kuitansi' },
            { key: 'C', text: 'Analysa, sistym, quitansi' },
            { key: 'D', text: 'Analisis, sistim, kwitansi' },
            { key: 'E', text: 'Analisa, sistem, kuitansi' }
          ],
          correctKey: 'B',
          points: 10
        },
        {
          id: 'q6',
          number: 6,
          type: 'multiple-choice',
          question: 'Organel sel tumbuhan yang bertanggung jawab terhadap proses fotosintesis dan menghasilkan klorofil adalah...',
          options: [
            { key: 'A', text: 'Mitokondria' },
            { key: 'B', text: 'Ribosom' },
            { key: 'C', text: 'Kloroplas' },
            { key: 'D', text: 'Badan Golgi' },
            { key: 'E', text: 'Vakuola' }
          ],
          correctKey: 'C',
          points: 10
        },
        {
          id: 'q7',
          number: 7,
          type: 'multiple-choice',
          question: 'Nilai dari operasi matematika 25 × 4 - 30 ÷ 5 adalah...',
          options: [
            { key: 'A', text: '94' },
            { key: 'B', text: '84' },
            { key: 'C', text: '96' },
            { key: 'D', text: '74' },
            { key: 'E', text: '100' }
          ],
          correctKey: 'A',
          points: 10
        },
        {
          id: 'q8',
          number: 8,
          type: 'multiple-choice',
          question: 'Salah satu fungsi utama sistem Exam Browser dalam pelaksanaan ujian berbasis komputer (CBT) adalah...',
          options: [
            { key: 'A', text: 'Mempercepat kecepatan internet secara otomatis' },
            { key: 'B', text: 'Mencegah siswa membuka tab lain, aplikasi lain, atau mencari contekan selama ujian' },
            { key: 'C', text: 'Menggantikan peran pengawas ujian secara fisik seutuhnya' },
            { key: 'D', text: 'Memperbaiki jawaban siswa yang salah secara otomatis' },
            { key: 'E', text: 'Menambah durasi ujian saat koneksi internet lambat' }
          ],
          correctKey: 'B',
          points: 10
        },
        {
          id: 'q9',
          number: 9,
          type: 'multiple-choice',
          question: 'Planet terdekat dari matahari dalam tata surya kita adalah...',
          options: [
            { key: 'A', text: 'Venus' },
            { key: 'B', text: 'Merkurius' },
            { key: 'C', text: 'Mars' },
            { key: 'D', text: 'Bumi' },
            { key: 'E', text: 'Jupiter' }
          ],
          correctKey: 'B',
          points: 10
        },
        {
          id: 'q10',
          number: 10,
          type: 'essay',
          question: 'Jelaskan secara ringkas 3 (tiga) dampak positif pemanfaatan teknologi digital dalam dunia pendidikan di Indonesia!',
          options: [],
          correctKey: '',
          points: 10
        }
      ]
    }
  ],
  // Active student exam sessions
  sessions: {},
  // Completed submissions
  submissions: [],
  // Cheating / violation events
  violations: []
};

function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      writeDb(initialData);
      return initialData;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading database file:', err);
    return initialData;
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing database file:', err);
    return false;
  }
}

module.exports = {
  readDb,
  writeDb,
  getSettings: () => readDb().settings,
  updateSettings: (newSettings) => {
    const db = readDb();
    db.settings = { ...db.settings, ...newSettings };
    writeDb(db);
    return db.settings;
  },
  getExams: () => readDb().exams,
  getExamById: (id) => readDb().exams.find(e => e.id === id),
  saveExam: (examData) => {
    const db = readDb();
    const idx = db.exams.findIndex(e => e.id === examData.id);
    if (idx >= 0) {
      db.exams[idx] = examData;
    } else {
      db.exams.push(examData);
    }
    writeDb(db);
    return examData;
  },
  deleteExam: (id) => {
    const db = readDb();
    db.exams = db.exams.filter(e => e.id !== id);
    writeDb(db);
    return true;
  },
  getSessions: () => readDb().sessions || {},
  saveSession: (sessionId, sessionData) => {
    const db = readDb();
    if (!db.sessions) db.sessions = {};
    db.sessions[sessionId] = {
      ...db.sessions[sessionId],
      ...sessionData,
      updatedAt: new Date().toISOString()
    };
    writeDb(db);
    return db.sessions[sessionId];
  },
  removeSession: (sessionId) => {
    const db = readDb();
    if (db.sessions && db.sessions[sessionId]) {
      delete db.sessions[sessionId];
      writeDb(db);
    }
  },
  recordViolation: (violation) => {
    const db = readDb();
    if (!db.violations) db.violations = [];
    const item = {
      id: 'v-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      ...violation
    };
    db.violations.unshift(item);
    if (db.violations.length > 500) db.violations.pop(); // Keep last 500
    writeDb(db);
    return item;
  },
  getViolations: () => readDb().violations || [],
  getSubmissions: () => readDb().submissions || [],
  saveSubmission: (submission) => {
    const db = readDb();
    if (!db.submissions) db.submissions = [];
    const record = {
      id: 'sub-' + Date.now(),
      submittedAt: new Date().toISOString(),
      ...submission
    };
    db.submissions.unshift(record);
    writeDb(db);
    return record;
  }
};
