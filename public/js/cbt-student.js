/**
 * CBT STUDENT EXAM CONTROLLER
 * Handles Question Rendering, Timer, Answers Auto-Save, Palette State, and Submission
 */

class CBTStudentController {
  constructor() {
    this.session = null;
    this.exam = null;
    this.currentQIndex = 0;
    this.answers = {}; // { qId: { answer: 'A', isDoubtful: false } }
    this.timerInterval = null;
    this.remainingSeconds = 0;
    this.fontSize = 'md'; // sm, md, lg

    this.initElements();
    this.initEventListeners();
  }

  initElements() {
    this.dom = {
      loginForm: document.getElementById('student-login-form'),
      examWorkspace: document.getElementById('view-student-exam'),
      loginView: document.getElementById('view-student-login'),
      resultView: document.getElementById('view-student-result'),
      
      // Exam room elements
      examTitle: document.getElementById('exam-subject-display'),
      studentName: document.getElementById('student-name-display'),
      studentNisn: document.getElementById('student-nisn-display'),
      qNumBadge: document.getElementById('q-num-badge'),
      qPointsBadge: document.getElementById('q-points-badge'),
      qTextBox: document.getElementById('question-text-box'),
      optionsList: document.getElementById('options-list'),
      essayBox: document.getElementById('essay-input-box'),
      
      btnPrev: document.getElementById('btn-prev-q'),
      btnNext: document.getElementById('btn-next-q'),
      btnDoubtful: document.getElementById('btn-toggle-doubtful'),
      btnSubmit: document.getElementById('btn-submit-exam-modal'),
      
      paletteGrid: document.getElementById('question-palette-grid'),
      timerDisplay: document.getElementById('exam-timer-display'),
      timerContainer: document.getElementById('exam-timer-container'),
      
      // Confirm Submit Modal
      confirmModal: document.getElementById('modal-confirm-submit'),
      summaryAnswered: document.getElementById('summary-answered-count'),
      summaryDoubtful: document.getElementById('summary-doubtful-count'),
      summaryUnanswered: document.getElementById('summary-unanswered-count')
    };
  }

  initEventListeners() {
    // Login form submission
    if (this.dom.loginForm) {
      this.dom.loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    }

    // Question navigation
    if (this.dom.btnPrev) {
      this.dom.btnPrev.addEventListener('click', () => this.navigateQuestion(-1));
    }
    if (this.dom.btnNext) {
      this.dom.btnNext.addEventListener('click', () => this.navigateQuestion(1));
    }

    // Toggle doubtful
    if (this.dom.btnDoubtful) {
      this.dom.btnDoubtful.addEventListener('click', () => this.toggleDoubtful());
    }

    // Submit button clicked -> Open confirmation modal
    if (this.dom.btnSubmit) {
      this.dom.btnSubmit.addEventListener('click', () => this.openSubmitModal());
    }

    // Confirm submit final action
    const btnDoSubmit = document.getElementById('btn-do-final-submit');
    if (btnDoSubmit) {
      btnDoSubmit.addEventListener('click', () => this.submitExam());
    }

    // Cancel submit modal
    const btnCancelSubmit = document.getElementById('btn-cancel-submit');
    if (btnCancelSubmit) {
      btnCancelSubmit.addEventListener('click', () => {
        this.dom.confirmModal.classList.remove('active');
      });
    }

    // Font size toggles
    document.querySelectorAll('.font-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const size = e.target.dataset.size;
        this.setFontSize(size);
      });
    });

    // Calculator tool button
    const btnCalc = document.getElementById('btn-open-calculator');
    if (btnCalc) {
      btnCalc.addEventListener('click', () => {
        const calcModal = document.getElementById('modal-calculator');
        if (calcModal) calcModal.classList.add('active');
      });
    }
  }

  // --- Login & Exam Start ---
  async handleLogin() {
    const nisn = document.getElementById('student-nisn-input').value.trim();
    const name = document.getElementById('student-name-input').value.trim();
    const className = document.getElementById('student-class-input').value.trim();
    const token = document.getElementById('student-token-input').value.trim().toUpperCase();

    if (!nisn || !name || !token) {
      window.ExamApp.showToast('Harap isi semua kolom login dengan benar!', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/auth/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nisn, name, className, token })
      });

      const data = await res.json();
      if (!res.ok) {
        window.ExamApp.showToast(data.error || 'Login gagal!', 'danger');
        return;
      }

      this.session = data.session;
      this.exam = data.exam;
      this.answers = this.session.answers || {};
      this.currentQIndex = this.session.currentQuestionIndex || 0;

      // Start AntiCheat Watchdog
      window.AntiCheat.startSession(this.session.sessionId, {
        strikes: this.session.strikes || 0,
        maxStrikes: 3
      });

      window.ExamApp.showToast(`Selamat datang, ${this.session.name}! Ujian dimulai.`, 'success');
      window.ExamApp.switchView('view-student-exam');

      this.startExamSession();
    } catch (err) {
      console.error(err);
      window.ExamApp.showToast('Gagal terhubung ke server CBT!', 'danger');
    }
  }

  startExamSession() {
    // Setup displays
    if (this.dom.examTitle) this.dom.examTitle.textContent = `${this.exam.title} (${this.exam.subject})`;
    if (this.dom.studentName) this.dom.studentName.textContent = this.session.name;
    if (this.dom.studentNisn) this.dom.studentNisn.textContent = `NISN: ${this.session.nisn} | Kelas: ${this.session.className || 'Reguler'}`;

    // Calculate remaining timer
    const elapsedSeconds = Math.floor((Date.now() - this.session.startTime) / 1000);
    const totalSeconds = this.exam.durationMinutes * 60;
    this.remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);

    this.startTimer();
    this.renderPalette();
    this.renderQuestion(this.currentQIndex);
    this.updateStrikeDisplay(this.session.strikes || 0);
  }

  // --- Countdown Timer ---
  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    const updateDisplay = () => {
      if (this.remainingSeconds <= 0) {
        clearInterval(this.timerInterval);
        this.dom.timerDisplay.textContent = '00:00:00';
        window.ExamApp.showToast('Waktu ujian telah habis! Jawaban Anda akan otomatis dikumpulkan.', 'danger');
        this.submitExam();
        return;
      }

      const h = Math.floor(this.remainingSeconds / 3600);
      const m = Math.floor((this.remainingSeconds % 3600) / 60);
      const s = this.remainingSeconds % 60;

      const format = (n) => String(n).padStart(2, '0');
      this.dom.timerDisplay.textContent = `${format(h)}:${format(m)}:${format(s)}`;

      // Visual warning colors
      if (this.remainingSeconds <= 300) { // last 5 minutes
        this.dom.timerContainer.classList.add('urgent');
      } else {
        this.dom.timerContainer.classList.remove('urgent');
      }

      this.remainingSeconds--;
    };

    updateDisplay();
    this.timerInterval = setInterval(updateDisplay, 1000);
  }

  // --- Render Question ---
  renderQuestion(index) {
    if (!this.exam || !this.exam.questions || !this.exam.questions[index]) return;
    this.currentQIndex = index;
    const q = this.exam.questions[index];

    // Meta badges
    this.dom.qNumBadge.textContent = `Soal No. ${q.number} dari ${this.exam.questions.length}`;
    this.dom.qPointsBadge.textContent = `Bobot: ${q.points || 10} Poin`;

    // Question content
    this.dom.qTextBox.innerHTML = q.question;

    // Previous / Next buttons state
    this.dom.btnPrev.disabled = index === 0;
    this.dom.btnNext.style.display = index === this.exam.questions.length - 1 ? 'none' : 'flex';
    this.dom.btnSubmit.style.display = index === this.exam.questions.length - 1 ? 'flex' : 'none';

    // Retrieve saved answer
    const saved = this.answers[q.id] || { answer: '', isDoubtful: false };

    // Update Doubtful Button state
    if (saved.isDoubtful) {
      this.dom.btnDoubtful.classList.add('active');
      this.dom.btnDoubtful.innerHTML = '<span>★</span> Ragu-ragu (Aktif)';
    } else {
      this.dom.btnDoubtful.classList.remove('active');
      this.dom.btnDoubtful.innerHTML = '<span>?</span> Ragu-ragu';
    }

    // Render Options or Essay
    if (q.type === 'multiple-choice') {
      this.dom.optionsList.style.display = 'flex';
      this.dom.essayBox.style.display = 'none';
      this.renderOptions(q, saved.answer);
    } else if (q.type === 'essay') {
      this.dom.optionsList.style.display = 'none';
      this.dom.essayBox.style.display = 'block';
      this.renderEssay(q, saved.answer);
    }

    this.highlightPaletteActive(index);
  }

  renderOptions(q, selectedKey) {
    this.dom.optionsList.innerHTML = '';
    (q.options || []).forEach(opt => {
      const isSelected = selectedKey === opt.key;
      const item = document.createElement('div');
      item.className = `option-item ${isSelected ? 'selected' : ''}`;
      item.innerHTML = `
        <div class="option-key">${opt.key}</div>
        <div class="option-text">${opt.text}</div>
      `;
      item.addEventListener('click', () => {
        this.selectAnswer(q.id, opt.key);
      });
      this.dom.optionsList.appendChild(item);
    });
  }

  renderEssay(q, textValue) {
    this.dom.essayBox.innerHTML = `
      <label class="form-label" style="margin-bottom: 8px; display:block;">Tuliskan jawaban uraian Anda di bawah ini:</label>
      <textarea class="essay-input" placeholder="Ketik jawaban lengkap di sini...">${textValue || ''}</textarea>
    `;

    const textarea = this.dom.essayBox.querySelector('textarea');
    let debounceTimer;
    textarea.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.saveEssayAnswer(q.id, e.target.value);
      }, 500);
    });
  }

  // --- Save Answer Action ---
  selectAnswer(questionId, answerKey) {
    const isCurrentDoubtful = this.answers[questionId] ? !!this.answers[questionId].isDoubtful : false;
    this.answers[questionId] = {
      answer: answerKey,
      isDoubtful: isCurrentDoubtful
    };

    // Re-render current options
    this.renderQuestion(this.currentQIndex);
    this.updatePaletteButton(this.currentQIndex, questionId);

    // Send to backend
    this.sendAnswerToServer(questionId, answerKey, isCurrentDoubtful);
  }

  saveEssayAnswer(questionId, text) {
    const isCurrentDoubtful = this.answers[questionId] ? !!this.answers[questionId].isDoubtful : false;
    this.answers[questionId] = {
      answer: text,
      isDoubtful: isCurrentDoubtful
    };
    this.updatePaletteButton(this.currentQIndex, questionId);
    this.sendAnswerToServer(questionId, text, isCurrentDoubtful);
  }

  toggleDoubtful() {
    const q = this.exam.questions[this.currentQIndex];
    if (!q) return;

    if (!this.answers[q.id]) {
      this.answers[q.id] = { answer: '', isDoubtful: false };
    }

    this.answers[q.id].isDoubtful = !this.answers[q.id].isDoubtful;
    this.renderQuestion(this.currentQIndex);
    this.updatePaletteButton(this.currentQIndex, q.id);
    this.sendAnswerToServer(q.id, this.answers[q.id].answer, this.answers[q.id].isDoubtful);
  }

  async sendAnswerToServer(questionId, answer, isDoubtful) {
    if (!this.session) return;
    try {
      await fetch('/api/exam/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.session.sessionId,
          questionId,
          answer,
          isDoubtful,
          questionIndex: this.currentQIndex
        })
      });
    } catch (err) {
      console.warn('Auto-save answer failed to sync with server:', err);
    }
  }

  navigateQuestion(delta) {
    const newIdx = this.currentQIndex + delta;
    if (newIdx >= 0 && newIdx < this.exam.questions.length) {
      this.renderQuestion(newIdx);
    }
  }

  // --- Palette Grid (1..N) ---
  renderPalette() {
    this.dom.paletteGrid.innerHTML = '';
    this.exam.questions.forEach((q, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'palette-btn';
      btn.textContent = idx + 1;
      btn.dataset.index = idx;
      btn.dataset.qid = q.id;

      // Status
      const saved = this.answers[q.id];
      if (saved && saved.isDoubtful) {
        btn.classList.add('doubtful');
      } else if (saved && saved.answer) {
        btn.classList.add('answered');
      }

      btn.addEventListener('click', () => {
        this.renderQuestion(idx);
      });

      this.dom.paletteGrid.appendChild(btn);
    });
  }

  updatePaletteButton(idx, questionId) {
    const btn = this.dom.paletteGrid.children[idx];
    if (!btn) return;
    btn.classList.remove('answered', 'doubtful');

    const saved = this.answers[questionId];
    if (saved && saved.isDoubtful) {
      btn.classList.add('doubtful');
    } else if (saved && saved.answer) {
      btn.classList.add('answered');
    }
  }

  highlightPaletteActive(idx) {
    Array.from(this.dom.paletteGrid.children).forEach((btn, i) => {
      if (i === idx) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  setFontSize(size) {
    this.fontSize = size;
    document.querySelectorAll('.font-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.size === size);
    });

    const mainPanel = document.querySelector('.exam-main-panel');
    if (mainPanel) {
      mainPanel.classList.remove('font-size-sm', 'font-size-md', 'font-size-lg');
      mainPanel.classList.add(`font-size-${size}`);
    }
  }

  updateStrikeDisplay(strikes) {
    const strikePills = document.getElementById('sidebar-strike-pills');
    if (!strikePills) return;
    strikePills.innerHTML = '';
    for (let i = 1; i <= 3; i++) {
      const dot = document.createElement('div');
      dot.className = `strike-dot ${i <= strikes ? 'filled' : ''}`;
      strikePills.appendChild(dot);
    }
  }

  // --- Submission Process ---
  openSubmitModal() {
    let answered = 0;
    let doubtful = 0;
    let unanswered = 0;

    this.exam.questions.forEach(q => {
      const a = this.answers[q.id];
      if (a && a.isDoubtful) {
        doubtful++;
      } else if (a && a.answer && a.answer.trim().length > 0) {
        answered++;
      } else {
        unanswered++;
      }
    });

    this.dom.summaryAnswered.textContent = answered;
    this.dom.summaryDoubtful.textContent = doubtful;
    this.dom.summaryUnanswered.textContent = unanswered;

    this.dom.confirmModal.classList.add('active');
  }

  async submitExam() {
    if (!this.session) return;
    if (this.timerInterval) clearInterval(this.timerInterval);

    try {
      const res = await fetch('/api/exam/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: this.session.sessionId })
      });

      const data = await res.json();
      if (!res.ok) {
        window.ExamApp.showToast(data.error || 'Gagal mengumpulkan ujian!', 'danger');
        return;
      }

      // Stop anti-cheat
      window.AntiCheat.stopSession();
      window.AntiCheat.playSuccessSound();

      if (this.dom.confirmModal) this.dom.confirmModal.classList.remove('active');

      // Display result view
      this.renderResult(data.result);
    } catch (err) {
      console.error(err);
      window.ExamApp.showToast('Gagal mengirim data pengumpulan ujian!', 'danger');
    }
  }

  renderResult(res) {
    window.ExamApp.switchView('view-student-result');
    const scoreVal = document.getElementById('res-score-value');
    const scorePct = document.getElementById('res-score-pct');
    const correctEl = document.getElementById('res-correct-count');
    const wrongEl = document.getElementById('res-wrong-count');
    const unansweredEl = document.getElementById('res-unanswered-count');
    const titleEl = document.getElementById('res-exam-title');

    if (scoreVal) scoreVal.textContent = res.totalScore;
    if (scorePct) scorePct.textContent = `${res.percentage}%`;
    if (correctEl) correctEl.textContent = res.correctCount;
    if (wrongEl) wrongEl.textContent = res.wrongCount;
    if (unansweredEl) unansweredEl.textContent = res.unansweredCount;
    if (titleEl) titleEl.textContent = `${res.examTitle} - ${res.studentName}`;
  }
}

// Global initialization
window.CBTStudent = new CBTStudentController();
