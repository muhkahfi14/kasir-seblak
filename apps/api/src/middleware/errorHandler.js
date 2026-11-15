import { ZodError } from 'zod';
import env from '../config/env.js';

export function errorHandler(err, req, res, _next) {
  // Handle JSON syntax error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Format payload JSON tidak valid.'
    });
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message
    }));

    return res.status(400).json({
      success: false,
      message: 'Validasi input gagal.',
      errors: formattedErrors
    });
  }

  // Handle Prisma errors
  if (err?.name === 'PrismaClientKnownRequestError') {
    switch (err.code) {
      case 'P2002': {
        const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : err.meta?.target || 'data';
        return res.status(409).json({
          success: false,
          message: `Data unik (${target}) sudah digunakan.`
        });
      }
      case 'P2025':
        return res.status(404).json({
          success: false,
          message: 'Data yang diminta tidak ditemukan.'
        });
      case 'P2003':
        return res.status(400).json({
          success: false,
          message: 'Operasi gagal karena integritas referensi data terkait.'
        });
      default:
        break;
    }
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = statusCode === 500 && env.NODE_ENV === 'production'
    ? 'Terjadi kesalahan internal pada server.'
    : err.message || 'Terjadi kesalahan internal pada server.';

  if (env.NODE_ENV !== 'test') {
    console.error('Server Error:', err);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
}

export default errorHandler;
