const https = require('https');
const http = require('http');
const { startServer } = require('./server/app');
const localtunnel = require('localtunnel');
const { spawn } = require('child_process');

function getPublicIp() {
  return new Promise((resolve) => {
    const req = https.get('https://api.ipify.org', { timeout: 4000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data.trim()));
    });
    req.on('error', () => {
      // Fallback
      https.get('https://ipv4.icanhazip.com', { timeout: 4000 }, (res2) => {
        let d = '';
        res2.on('data', c => d += c);
        res2.on('end', () => resolve(d.trim()));
      }).on('error', () => resolve('Lihat di layar konsol'));
    });
    req.on('timeout', () => {
      req.destroy();
      resolve('Lihat di layar konsol');
    });
  });
}

function openBrowser(url) {
  const startCmd = process.platform === 'win32' ? 'start' : 'open';
  try {
    spawn('cmd.exe', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' });
  } catch (e) {
    // Ignore
  }
}

async function run() {
  console.clear();
  console.log('================================================================');
  console.log('       🛡️ EXAM BROWSER - MODE UJIAN ONLINE DARI RUMAH (PJJ)     ');
  console.log('================================================================\n');

  console.log('[1/3] Menyalakan Server Ujian Lokal...');
  const { port } = await startServer(3000);

  console.log('\n[2/3] Mendeteksi IP Publik & Menghubungkan Tunnel Internet...');
  const publicIp = await getPublicIp();

  let tunnel = null;
  let tunnelUrl = '';
  try {
    tunnel = await localtunnel({ port });
    tunnelUrl = tunnel.url;
  } catch (err) {
    console.error('Gagal menghubungkan tunnel otomatis:', err.message);
  }

  console.log('\n[3/3] SISTEM UJIAN ONLINE SIAP DIGUNAKAN!\n');
  console.log('================================================================');
  console.log('  📢 INFORMASI UNTUK DIBAGIKAN KE SISWA (GRUP WHATSAPP/TELEGRAM):');
  console.log('================================================================');
  if (tunnelUrl) {
    console.log(`  🌐 LINK UJIAN SISWA  : ${tunnelUrl}`);
  } else {
    console.log(`  🌐 LINK UJIAN SISWA  : http://${publicIp}:${port} (Memerlukan Port Forwarding)`);
  }
  console.log(`  🔑 TOKEN UJIAN       : EXM2026`);
  console.log(`  💡 IP SANDI TUNNEL   : ${publicIp} (Jika muncul verifikasi tunnel)`);
  console.log('----------------------------------------------------------------');
  console.log('  👨‍🏫 AKSES KHUSUS GURU / PENGAWAS:');
  console.log(`  💻 Monitoring Guru   : http://localhost:${port}`);
  console.log(`  🔒 PIN Pengawas      : 1234`);
  console.log('================================================================\n');

  console.log('💬 Format Pesan WhatsApp Siap Copy-Paste:\n');
  console.log('-------------------- [ SALIN TEKS DI BAWAH ] -------------------');
  console.log(`*PEMBERITAHUAN PELAKSANAAN UJIAN DARING (ONLINE)*`);
  console.log(`Kepada seluruh siswa, silakan masuk ke sistem ujian melalui link berikut:`);
  console.log(`👉 Link Ujian : ${tunnelUrl || 'http://localhost:' + port}`);
  console.log(`👉 Token Ujian: EXM2026`);
  if (tunnelUrl) {
    console.log(`(Jika muncul halaman "Click to continue" atau minta IP, masukkan: ${publicIp})`);
  }
  console.log(`\n*Tata Tertib:*`);
  console.log(`1. Gunakan Laptop/PC atau HP dalam posisi layar penuh.`);
  console.log(`2. Dilarang membuka aplikasi lain, tab baru, atau berpindah layar.`);
  console.log(`3. Pelanggaran 3x akan mengunci otomatis ujian Anda.`);
  console.log('----------------------------------------------------------------\n');

  console.log('Menjalankan browser pengawas untuk memantau siswa...');
  openBrowser(`http://localhost:${port}`);

  console.log('\n[INFO] Jangan tutup jendela hitam ini selama ujian berlangsung.');
  console.log('Tekan Ctrl + C untuk menghentikan server jika ujian telah selesai.\n');

  if (tunnel) {
    tunnel.on('close', () => {
      console.log('Tunnel terputus.');
    });
  }
}

run().catch((err) => {
  console.error('Terjadi kesalahan:', err);
});
