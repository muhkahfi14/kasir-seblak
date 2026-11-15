import bcrypt from 'bcryptjs';
import prisma from '../../config/database.js';

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Akun Anda dinonaktifkan. Silakan hubungi admin/pemilik.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah.'
      });
    }

    // Set session and explicitly persist before sending response
    req.session.userId = user.id;

    req.session.save((err) => {
      if (err) {
        return next(err);
      }

      return res.status(200).json({
        success: true,
        message: 'Login berhasil.',
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        }
      });
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res, next) {
  try {
    if (!req.session) {
      return res.status(200).json({
        success: true,
        message: 'Logout berhasil.'
      });
    }

    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }
      res.clearCookie('connect.sid');
      return res.status(200).json({
        success: true,
        message: 'Logout berhasil.'
      });
    });
  } catch (error) {
    next(error);
  }
}

export async function me(req, res, next) {
  try {
    return res.status(200).json({
      success: true,
      message: 'Data profil berhasil diambil.',
      data: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        user: req.user
      }
    });
  } catch (error) {
    next(error);
  }
}

export default {
  login,
  logout,
  me
};
