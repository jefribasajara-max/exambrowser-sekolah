const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { startServer } = require('./server/app');

// Supported browser paths on Windows
const BROWSER_PATHS = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  path.join(process.env.LOCALAPPDATA || '', 'Microsoft\\Edge\\Application\\msedge.exe'),
  path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe')
];

function findBrowser() {
  for (const p of BROWSER_PATHS) {
    if (p && fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

async function main() {
  console.log('Memulai Exam Browser System...');
  const port = process.env.PORT || 3000;
  
  // 1. Start Server
  const { localIp } = await startServer(port);
  const targetUrl = `http://localhost:${port}`;

  // 2. Prepare Isolated User Data Directory for Zero Cheating (No extensions, no history)
  const tempProfileDir = path.join(os.tmpdir(), 'exambro_kiosk_profile');
  if (!fs.existsSync(tempProfileDir)) {
    fs.mkdirSync(tempProfileDir, { recursive: true });
  }

  // 3. Find Edge or Chrome
  const browserExe = findBrowser();
  if (!browserExe) {
    console.warn('Browser Microsoft Edge / Google Chrome tidak ditemukan otomatis.');
    console.log(`Silakan buka browser Anda secara manual di: ${targetUrl}`);
    return;
  }

  console.log(`Menggunakan browser engine: ${browserExe}`);
  console.log('Membuka Kiosk Mode...');

  // Kiosk Launch flags
  const flags = [
    `--app=${targetUrl}`,
    '--kiosk',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--disable-pinch',
    '--disable-sync',
    '--disable-background-networking',
    '--disable-features=TranslateUI,SidePanel,PrivacySandboxSettings4',
    `--user-data-dir=${tempProfileDir}`,
    '--overscroll-history-navigation=0',
    '--autoplay-policy=no-user-gesture-required'
  ];

  // Spawn detached browser process
  const browserProc = spawn(browserExe, flags, {
    detached: false,
    stdio: 'ignore'
  });

  browserProc.on('exit', (code) => {
    console.log(`Exam Browser Kiosk ditutup (Code: ${code})`);
    process.exit(0);
  });

  browserProc.on('error', (err) => {
    console.error('Gagal menjalankan Kiosk Mode:', err);
  });
}

main().catch(console.error);
