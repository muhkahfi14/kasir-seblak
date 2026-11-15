import app from './app.js';
import env from './config/env.js';

const PORT = env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server Kasir Seblak API berjalan di http://localhost:${PORT} [${env.NODE_ENV}]`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM diterima. Menutup server secara aman...');
  server.close(() => {
    console.log('Server Kasir Seblak ditutup.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT diterima. Menutup server secara aman...');
  server.close(() => {
    console.log('Server Kasir Seblak ditutup.');
    process.exit(0);
  });
});

export default server;
