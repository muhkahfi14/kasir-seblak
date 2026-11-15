import prisma from '../config/database.js';

export async function authenticate(req, res, next) {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Silakan login terlebih dahulu.'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user || !user.isActive) {
      req.session.destroy(() => {});
      return res.status(401).json({
        success: false,
        message: 'Pengguna tidak ditemukan atau akun dinonaktifkan.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export default authenticate;
