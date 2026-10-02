/**
 * CBT ADMIN & PROCTOR CONTROLLER
 * Handles Proctor Dashboard, Live Student Monitoring, Question Bank, and Grade Exporting
 */

class CBTAdminController {
  constructor() {
    this.isAuthenticated = false;
    this.activeTab = 'tab-overview';
    this.refreshTimer = null;
    this.exams = [];
    this.sessions = [];
    this.submissions = [];

    this.initEventListeners();
  }

  initEventListeners() {
    // Admin login form
    const loginForm = document.getElementById('admin-login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleAdminLogin();
      });
    }

    // Tabs switching
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetTab = e.currentTarget.dataset.tab;
        this.switchTab(targetTab);
      });
    });

    // Refresh live monitoring button
    const btnRefresh = document.getElementById('btn-refresh-monitoring');
    if (btnRefresh) {
      btnRefresh.addEventListener('click', () => {
        this.loadMonitoringSessions();
        window.ExamApp.showToast('Data monitoring diperbarui.', 'info');
      });
    }

    // Add new exam button
    const btnNewExam = document.getElementById('btn-add-new-exam');
    if (btnNewExam) {
      btnNewExam.addEventListener('click', () => this.openExamEditor());
    }

    // Generate token button
    const btnGenToken = document.getElementById('btn-generate-token');
    if (btnGenToken) {
      btnGenToken.addEventListener('click', () => this.generateRandomToken());
    }

    // Export CSV Grades button
    const btnExport = document.getElementById('btn-export-grades-csv');
    if (btnExport) {
      btnExport.addEventListener('click', () => this.exportGradesToCSV());
    }

    // Settings save form
    const settingsForm = document.getElementById('admin-settings-form');
    if (settingsForm) {
      settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveSettings();
      });
    }
  }

  // --- Admin Login ---
  async handleAdminLogin() {
    const pinInput = document.getElementById('admin-pin-input');
    const pin = pinInput.value.trim();

    if (!pin) {
      window.ExamApp.showToast('Masukkan PIN Pengawas!', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });

      const data = await res.json();
      if (!res.ok) {
        window.ExamApp.showToast(data.error || 'PIN Salah!', 'danger');
        return;
      }

      this.isAuthenticated = true;
      pinInput.value = '';
      window.ExamApp.showToast('Login Pengawas berhasil!', 'success');
      window.ExamApp.switchView('view-admin-dashboard');

      this.loadDashboardOverview();
      this.startAutoRefresh();
    } catch (err) {
      console.error(err);
      window.ExamApp.showToast('Gagal terhubung ke server!', 'danger');
    }
  }

  switchTab(tabId) {
    this.activeTab = tabId;
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    document.querySelectorAll('.admin-tab-content').forEach(content => {
      content.classList.toggle('active', content.id === tabId);
    });

    if (tabId === 'tab-overview') this.loadDashboardOverview();
    if (tabId === 'tab-monitoring') this.loadMonitoringSessions();
    if (tabId === 'tab-exams') this.loadExams();
    if (tabId === 'tab-grades') this.loadGrades();
    if (tabId === 'tab-violations') this.loadViolations();
  }

  startAutoRefresh() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.refreshTimer = setInterval(() => {
      if (this.isAuthenticated) {
        if (this.activeTab === 'tab-overview') this.loadDashboardOverview();
        if (this.activeTab === 'tab-monitoring') this.loadMonitoringSessions();
      }
    }, 4000); // Poll every 4 seconds
  }

  // --- 1. Dashboard Overview ---
  async loadDashboardOverview() {
    try {
      const res = await fetch('/api/admin/overview');
      const data = await res.json();

      document.getElementById('stat-total-exams').textContent = data.totalExams || 0;
      document.getElementById('stat-active-students').textContent = data.activeStudents || 0;
      document.getElementById('stat-locked-students').textContent = data.lockedStudents || 0;
      document.getElementById('stat-total-submissions').textContent = data.totalSubmissions || 0;
      document.getElementById('stat-total-violations').textContent = data.totalViolations || 0;
    } catch (e) {
      console.warn('Failed loading overview', e);
    }
  }

  // --- 2. Live Monitoring Sessions ---
  async loadMonitoringSessions() {
    try {
      const res = await fetch('/api/admin/sessions');
      const sessions = await res.json();
      this.sessions = sessions;

      const tbody = document.getElementById('table-monitoring-body');
      if (!tbody) return;

      if (!sessions || sessions.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-dim); padding: 24px;">Belum ada siswa yang aktif ujian saat ini.</td></tr>`;
        return;
      }

      tbody.innerHTML = '';
      sessions.forEach(s => {
        const answeredCount = s.answers ? Object.keys(s.answers).length : 0;
        const tr = document.createElement('tr');

        // Status badge
        let statusBadge = '<span class="badge badge-success">Mengerjakan</span>';
        if (s.isFinished) {
          statusBadge = '<span class="badge badge-info">Selesai</span>';
        } else if (s.isLocked) {
          statusBadge = '<span class="badge badge-danger">Terkunci</span>';
        }

        // Action buttons
        let actions = '';
        if (s.isLocked) {
          actions += `<button class="btn-table-action unlock" onclick="window.CBTAdmin.unlockStudent('${s.sessionId}')">Buka Kunci</button> `;
        }
        if (!s.isFinished) {
          actions += `<button class="btn-table-action force" onclick="window.CBTAdmin.forceSubmitStudent('${s.sessionId}')">Paksa Kumpul</button> `;
        }
        actions += `<button class="btn-table-action" style="color:#f87171;" onclick="window.CBTAdmin.resetStudentSession('${s.sessionId}')">Reset</button>`;

        tr.innerHTML = `
          <td><strong>${s.name}</strong></td>
          <td>${s.nisn}</td>
          <td>${s.className || 'Reguler'}</td>
          <td>Soal #${(s.currentQuestionIndex || 0) + 1} (${answeredCount} Dijawab)</td>
          <td>
            <span class="badge ${s.strikes > 0 ? 'badge-danger' : 'badge-success'}">${s.strikes || 0} / 3</span>
          </td>
          <td>${statusBadge}</td>
          <td>${actions}</td>
        `;

        tbody.appendChild(tr);
      });
    } catch (e) {
      console.warn('Failed loading monitoring sessions', e);
    }
  }

  async unlockStudent(sessionId) {
    if (!confirm('Buka kunci ujian dan reset catatan pelanggaran untuk siswa ini?')) return;
    try {
      const res = await fetch(`/api/admin/sessions/${sessionId}/unlock`, { method: 'POST' });
      const data = await res.json();
      window.ExamApp.showToast(data.message, 'success');
      this.loadMonitoringSessions();
    } catch (e) {
      window.ExamApp.showToast('Gagal membuka kunci siswa', 'danger');
    }
  }

  async forceSubmitStudent(sessionId) {
    if (!confirm('Apakah Anda yakin ingin memaksa mengumpulkan ujian siswa ini?')) return;
    try {
      const res = await fetch(`/api/admin/sessions/${sessionId}/force-submit`, { method: 'POST' });
      const data = await res.json();
      window.ExamApp.showToast(data.message, 'warning');
      this.loadMonitoringSessions();
    } catch (e) {
      window.ExamApp.showToast('Gagal memproses aksi', 'danger');
    }
  }

  async resetStudentSession(sessionId) {
    if (!confirm('Hapus sesi siswa ini agar bisa login ulang dari awal?')) return;
    try {
      const res = await fetch(`/api/admin/sessions/${sessionId}`, { method: 'DELETE' });
      const data = await res.json();
      window.ExamApp.showToast(data.message, 'info');
      this.loadMonitoringSessions();
    } catch (e) {
      window.ExamApp.showToast('Gagal mereset sesi siswa', 'danger');
    }
  }

  // --- 3. Exams & Question Bank ---
  async loadExams() {
    try {
      const res = await fetch('/api/admin/exams');
      this.exams = await res.json();

      const tbody = document.getElementById('table-exams-body');
      if (!tbody) return;

      tbody.innerHTML = '';
      this.exams.forEach(ex => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${ex.title}</strong><br><small style="color:var(--text-dim);">${ex.subject}</small></td>
          <td><code style="background:rgba(255,255,255,0.1); padding:2px 8px; border-radius:4px; font-weight:700; color:#38bdf8;">${ex.token}</code></td>
          <td>${ex.durationMinutes} Menit</td>
          <td>${ex.questions ? ex.questions.length : 0} Butir</td>
          <td>${ex.isActive ? '<span class="badge badge-success">Aktif</span>' : '<span class="badge badge-warning">Nonaktif</span>'}</td>
          <td>
            <button class="btn-table-action" onclick="window.CBTAdmin.editExam('${ex.id}')">Edit</button>
            <button class="btn-table-action" style="color:#f87171;" onclick="window.CBTAdmin.deleteExam('${ex.id}')">Hapus</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch (e) {
      console.warn('Failed loading exams', e);
    }
  }

  async generateRandomToken() {
    try {
      const res = await fetch('/api/admin/token/generate', { method: 'POST' });
      const data = await res.json();
      const tokenInput = document.getElementById('exam-edit-token');
      if (tokenInput) tokenInput.value = data.token;
      window.ExamApp.showToast(`Token baru dihasilkan: ${data.token}`, 'success');
    } catch (e) {}
  }

  // --- 4. Grades & CSV Export ---
  async loadGrades() {
    try {
      const res = await fetch('/api/admin/submissions');
      this.submissions = await res.json();

      const tbody = document.getElementById('table-grades-body');
      if (!tbody) return;

      if (!this.submissions || this.submissions.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-dim); padding: 24px;">Belum ada data nilai ujian yang terkumpul.</td></tr>`;
        return;
      }

      tbody.innerHTML = '';
      this.submissions.forEach((sub, i) => {
        const tr = document.createElement('tr');
        const minutes = Math.floor((sub.timeSpentSeconds || 0) / 60);
        tr.innerHTML = `
          <td>${i + 1}</td>
          <td><strong>${sub.name}</strong><br><small style="color:var(--text-dim);">${sub.nisn}</small></td>
          <td>${sub.className || 'Reguler'}</td>
          <td>${sub.examTitle}</td>
          <td><strong style="color:#38bdf8; font-size:15px;">${sub.totalScore}</strong> (${sub.percentage}%)</td>
          <td>${sub.correctCount} Benar / ${sub.wrongCount} Salah</td>
          <td>${minutes} Menit</td>
        `;
        tbody.appendChild(tr);
      });
    } catch (e) {
      console.warn('Failed loading grades', e);
    }
  }

  exportGradesToCSV() {
    if (!this.submissions || this.submissions.length === 0) {
      window.ExamApp.showToast('Tidak ada data nilai untuk diexport!', 'warning');
      return;
    }

    let csvContent = '\uFEFF'; // UTF-8 BOM for Microsoft Excel
    csvContent += 'No,NISN,Nama Siswa,Kelas,Judul Ujian,Nilai,Persentase,Jawaban Benar,Jawaban Salah,Waktu Pengerjaan (Detik),Jumlah Pelanggaran\n';

    this.submissions.forEach((s, idx) => {
      const row = [
        idx + 1,
        `"${s.nisn}"`,
        `"${s.name}"`,
        `"${s.className || 'Reguler'}"`,
        `"${s.examTitle}"`,
        s.totalScore,
        `${s.percentage}%`,
        s.correctCount,
        s.wrongCount,
        s.timeSpentSeconds,
        s.strikes || 0
      ];
      csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `REKAP_NILAI_CBT_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.ExamApp.showToast('File Rekap Nilai CSV berhasil didownload!', 'success');
  }

  // --- 5. Violations Log ---
  async loadViolations() {
    try {
      const res = await fetch('/api/admin/violations');
      const violations = await res.json();

      const tbody = document.getElementById('table-violations-body');
      if (!tbody) return;

      if (!violations || violations.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-dim); padding: 24px;">Tidak ada catatan pelanggaran ujian. Semua siswa tertib!</td></tr>`;
        return;
      }

      tbody.innerHTML = '';
      violations.forEach((v) => {
        const tr = document.createElement('tr');
        const time = new Date(v.timestamp).toLocaleTimeString();
        tr.innerHTML = `
          <td>${time}</td>
          <td><strong>${v.name}</strong> (${v.nisn})</td>
          <td><span class="badge badge-danger">${v.violationType}</span></td>
          <td>${v.details}</td>
          <td>Strike ke-${v.strikesNow} ${v.isLocked ? '(AKUN TERKUNCI)' : ''}</td>
        `;
        tbody.appendChild(tr);
      });
    } catch (e) {
      console.warn('Failed loading violations', e);
    }
  }
}

// Global initialization
window.CBTAdmin = new CBTAdminController();
