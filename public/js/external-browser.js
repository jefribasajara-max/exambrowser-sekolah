/**
 * EXTERNAL EXAM BROWSER CONTROLLER
 * Loads external URLs (Google Forms, Moodle, School CBT server) securely inside the locked Kiosk wrapper
 */

class ExternalBrowserController {
  constructor() {
    this.currentUrl = '';
    this.iframe = null;
    this.urlInput = null;
    this.init();
  }

  init() {
    this.iframe = document.getElementById('external-exam-iframe');
    this.urlInput = document.getElementById('external-url-input');
    const btnGo = document.getElementById('btn-go-external-url');
    const btnReload = document.getElementById('btn-reload-external');
    const presetSelect = document.getElementById('external-preset-select');

    if (btnGo) {
      btnGo.addEventListener('click', () => this.loadUrlFromInput());
    }

    if (this.urlInput) {
      this.urlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.loadUrlFromInput();
        }
      });
    }

    if (btnReload && this.iframe) {
      btnReload.addEventListener('click', () => {
        if (this.iframe.src) {
          this.iframe.src = this.iframe.src;
          window.ExamApp.showToast('Memuat ulang halaman ujian...', 'info');
        }
      });
    }

    if (presetSelect) {
      presetSelect.addEventListener('change', (e) => {
        if (e.target.value) {
          if (this.urlInput) this.urlInput.value = e.target.value;
          this.loadUrl(e.target.value);
        }
      });
    }
  }

  loadUrlFromInput() {
    if (!this.urlInput) return;
    let url = this.urlInput.value.trim();
    if (!url) return;

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
      this.urlInput.value = url;
    }

    this.loadUrl(url);
  }

  loadUrl(url) {
    this.currentUrl = url;
    if (this.iframe) {
      this.iframe.src = url;
    }

    // Activate Anti-Cheat protection for external exams as well
    window.AntiCheat.startSession('external_session_' + Date.now(), {
      strikes: 0,
      maxStrikes: 3
    });

    window.ExamApp.showToast(`Membuka URL Ujian: ${url}`, 'info');
  }
}

window.ExternalBrowser = new ExternalBrowserController();
