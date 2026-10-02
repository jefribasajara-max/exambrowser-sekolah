/**
 * EXAM BROWSER - CORE ANTI-CHEAT & SECURITY ENGINE
 * Enforces Kiosk lockdown, Fullscreen, Blur/Tab detection, Keyboard interceptor, and Audio Alerts
 */

class AntiCheatEngine {
  constructor() {
    this.isActive = false;
    this.sessionId = null;
    this.strikes = 0;
    this.maxStrikes = 3;
    this.onViolationCallback = null;
    this.onLockedCallback = null;
    this.audioCtx = null;
    this.isFullscreenEnforced = true;
    this.isBypassedForAdmin = false;

    this.initAudio();
    this.initKeyboardInterceptor();
    this.initContextProtections();
    this.initVisibilityListeners();
  }

  initAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  playAlarmSound() {
    if (!this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.audioCtx.currentTime + 0.3);
      osc.frequency.exponentialRampToValueAtTime(800, this.audioCtx.currentTime + 0.6);

      gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.7);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.7);
    } catch (err) {
      console.error('Audio playback error', err);
    }
  }

  playSuccessSound() {
    if (!this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, this.audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, this.audioCtx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, this.audioCtx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.4);
    } catch (e) {}
  }

  startSession(sessionId, options = {}) {
    this.sessionId = sessionId;
    this.strikes = options.strikes || 0;
    this.maxStrikes = options.maxStrikes || 3;
    this.isActive = true;
    this.isBypassedForAdmin = false;
    this.requestFullscreen();
    console.log(`[AntiCheat] Aktif untuk sesi: ${sessionId} (Max Pelanggaran: ${this.maxStrikes})`);
  }

  stopSession() {
    this.isActive = false;
    this.sessionId = null;
    console.log('[AntiCheat] Sesi ujian dinonaktifkan.');
  }

  requestFullscreen() {
    const docEl = document.documentElement;
    if (!document.fullscreenElement) {
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch(() => {});
      } else if (docEl.webkitRequestFullscreen) {
        docEl.webkitRequestFullscreen();
      } else if (docEl.msRequestFullscreen) {
        docEl.msRequestFullscreen();
      }
    }
  }

  exitFullscreen() {
    if (document.fullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }

  // --- Keyboard Shortcuts Interceptor ---
  initKeyboardInterceptor() {
    window.addEventListener('keydown', (e) => {
      // 1. Proctor Emergency Exit Shortcut (Ctrl + Shift + Q or Alt + X)
      if ((e.ctrlKey && e.shiftKey && (e.key === 'Q' || e.key === 'q')) || (e.altKey && (e.key === 'X' || e.key === 'x'))) {
        e.preventDefault();
        window.ExamApp && window.ExamApp.openAdminExitModal();
        return;
      }

      // If active in exam, block all prohibited keys
      if (!this.isActive || this.isBypassedForAdmin) return;

      const prohibitedKeys = [
        'F1', 'F3', 'F5', 'F11', 'F12',
        'PrintScreen', 'ContextMenu'
      ];

      // Block F-keys & dangerous single keys
      if (prohibitedKeys.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        this.handleViolation('BLOCKED_KEY', `Tombol terlarang ditekan: ${e.key}`);
        return false;
      }

      // Block Ctrl + Key combinations
      if (e.ctrlKey) {
        const forbiddenCtrl = ['r', 'R', 'u', 'U', 's', 'S', 'p', 'P', 'n', 'N', 't', 'T', 'w', 'W', 'j', 'J', 'h', 'H'];
        if (forbiddenCtrl.includes(e.key)) {
          e.preventDefault();
          e.stopPropagation();
          this.handleViolation('KEY_COMBINATION', `Kombinasi Ctrl + ${e.key.toUpperCase()} dicegah.`);
          return false;
        }

        // Block Ctrl + Shift combinations (Devtools: I, J, C)
        if (e.shiftKey) {
          const forbiddenCtrlShift = ['i', 'I', 'j', 'J', 'c', 'C', 'delete', 'Delete'];
          if (forbiddenCtrlShift.includes(e.key)) {
            e.preventDefault();
            e.stopPropagation();
            this.handleViolation('DEVTOOLS_ATTEMPT', 'Mencoba membuka Developer Tools!');
            return false;
          }
        }
      }

      // Block Alt + Tab / Alt + Arrows
      if (e.altKey) {
        if (['ArrowLeft', 'ArrowRight', 'Tab', 'F4'].includes(e.key)) {
          e.preventDefault();
          e.stopPropagation();
          this.handleViolation('ALT_COMBINATION', 'Mencoba navigasi atau keluar jendela (Alt kombinasi).');
          return false;
        }
      }
    }, true);
  }

  // --- Context Menu & Selection Prevention ---
  initContextProtections() {
    // Disable right click context menu
    window.addEventListener('contextmenu', (e) => {
      if (this.isActive && !this.isBypassedForAdmin) {
        e.preventDefault();
        this.showToast('Klik kanan dinonaktifkan demi keamanan ujian!', 'warning');
        return false;
      }
    });

    // Disable copy / cut / paste
    ['copy', 'cut', 'paste'].forEach(evt => {
      window.addEventListener(evt, (e) => {
        if (this.isActive && !this.isBypassedForAdmin) {
          // Allow inside normal textareas if necessary, but block copying question
          const target = e.target;
          if (evt === 'paste' && target && target.classList.contains('essay-input')) {
            // Allow typing/pasting into own essay if proctor allows, but warn on question copy
            return;
          }
          e.preventDefault();
          this.handleViolation('CLIPBOARD_ACCESS', `Aksi ${evt.toUpperCase()} dicegah oleh sistem.`);
          return false;
        }
      });
    });

    // Prevent drag and drop of elements
    window.addEventListener('dragstart', (e) => {
      if (this.isActive) e.preventDefault();
    });
  }

  // --- Visibility & Blur Detector (Detects Tab / App Switch) ---
  initVisibilityListeners() {
    // 1. Tab / Document Visibility Change
    document.addEventListener('visibilitychange', () => {
      if (!this.isActive || this.isBypassedForAdmin) return;
      if (document.hidden) {
        this.handleViolation('TAB_SWITCH', 'Terdeteksi berpindah tab atau meminimalkan aplikasi ujian!');
      }
    });

    // 2. Window Blur (User clicked outside the exam window)
    window.addEventListener('blur', () => {
      if (!this.isActive || this.isBypassedForAdmin) return;
      // Slight delay to prevent false positives when interacting with system prompts
      setTimeout(() => {
        if (this.isActive && !document.hasFocus()) {
          this.handleViolation('WINDOW_BLUR', 'Jendela ujian kehilangan fokus (membuka aplikasi lain)!');
        }
      }, 300);
    });

    // 3. Fullscreen Exit Detector
    document.addEventListener('fullscreenchange', () => {
      if (this.isActive && this.isFullscreenEnforced && !document.fullscreenElement && !this.isBypassedForAdmin) {
        this.handleViolation('FULLSCREEN_EXIT', 'Layar penuh ditutup secara tidak wajar!');
        // Automatically attempt to re-engage fullscreen
        setTimeout(() => this.requestFullscreen(), 800);
      }
    });
  }

  handleViolation(type, details) {
    if (!this.isActive || this.isBypassedForAdmin) return;
    this.playAlarmSound();
    this.strikes++;

    console.warn(`[AntiCheat Violation] ${type}: ${details} (Strike: ${this.strikes}/${this.maxStrikes})`);

    // Report to backend server via API
    if (this.sessionId) {
      fetch('/api/exam/violation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          violationType: type,
          details
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.isLocked) {
          if (this.onLockedCallback) this.onLockedCallback(data);
        }
      })
      .catch(err => console.error('Violation report failed', err));
    }

    if (this.onViolationCallback) {
      this.onViolationCallback({
        type,
        details,
        strikes: this.strikes,
        maxStrikes: this.maxStrikes,
        isLocked: this.strikes >= this.maxStrikes
      });
    }

    if (this.strikes >= this.maxStrikes) {
      if (this.onLockedCallback) {
        this.onLockedCallback({ strikes: this.strikes, maxStrikes: this.maxStrikes, reason: details });
      }
    }
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Global instance
window.AntiCheat = new AntiCheatEngine();
