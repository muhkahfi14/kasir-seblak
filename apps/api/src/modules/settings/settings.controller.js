import prisma from '../../config/database.js';
import bcrypt from 'bcryptjs';

export const getStoreSettings = async (req, res, next) => {
  try {
    let settings = await prisma.storeSettings.findFirst();
    if (!settings) {
      settings = await prisma.storeSettings.create({
        data: {
          name: 'Seblak Prasmanan Juara',
          address: 'Jl. Raya Seblak No. 123, Bandung',
          phone: '081234567890',
        },
      });
    }
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
};

export const updateStoreSettings = async (req, res, next) => {
  try {
    const { name, address, phone } = req.body;
    let settings = await prisma.storeSettings.findFirst();
    if (settings) {
      settings = await prisma.storeSettings.update({
        where: { id: settings.id },
        data: { name, address, phone },
      });
    } else {
      settings = await prisma.storeSettings.create({
        data: { name, address, phone },
      });
    }
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { email, name, password, role } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: role || 'CASHIER',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

export const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};
