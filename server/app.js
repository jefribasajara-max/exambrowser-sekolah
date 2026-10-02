const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Anti-clickjacking / security headers for locked exam context
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Allow framing for the exam browser internal frame
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

// API Routes
app.use('/api', apiRoutes);

// Static frontend files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Fallback to index.html for SPA routing
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Helper: Get local network IPv4 address for multi-device school network access
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

function startServer(initialPort = PORT) {
  return new Promise((resolve, reject) => {
    let currentPort = parseInt(initialPort, 10);
    
    function tryListen() {
      const server = app.listen(currentPort, '0.0.0.0', () => {
        const localIp = getLocalIp();
        console.log(`====================================================`);
        console.log(`  EXAM BROWSER & CBT SERVER RUNNING!`);
        console.log(`  Akses Komputer Ini  : http://localhost:${currentPort}`);
        console.log(`  Akses Jaringan LAN  : http://${localIp}:${currentPort}`);
        console.log(`  Portal Pengawas/PIN : Default PIN '1234'`);
        console.log(`====================================================`);
        resolve({ server, port: currentPort, localIp });
      });

      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.warn(`[Port ${currentPort} sedang digunakan] Mencoba port ${currentPort + 1}...`);
          currentPort += 1;
          setTimeout(tryListen, 250);
        } else {
          reject(err);
        }
      });
    }

    tryListen();
  });
}

// If executed directly: start server
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer, getLocalIp };
