import prisma from '../../config/database.js';

export const getCurrentSession = async (req, res, next) => {
  try {
    const session = await prisma.cashSession.findFirst({
      where: {
        cashierUserId: req.user.id,
        isClosed: false,
      },
      include: {
        cashier: { select: { id: true, name: true } },
      },
    });

    res.json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
};

export const getSessions = async (req, res, next) => {
  try {
    const sessions = await prisma.cashSession.findMany({
      include: {
        cashier: { select: { id: true, name: true } },
      },
      orderBy: { openedAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: sessions });
  } catch (err) {
    next(err);
  }
};

export const openSession = async (req, res, next) => {
  try {
    const { openingCash, notes } = req.body;

    // Check if cashier already has an active session
    const existing = await prisma.cashSession.findFirst({
      where: {
        cashierUserId: req.user.id,
        isClosed: false,
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Shift kasir masih aktif. Tutup shift sebelumnya terlebih dahulu.',
        data: existing,
      });
    }

    const parsedOpening = parseFloat(openingCash) || 0;

    const session = await prisma.cashSession.create({
      data: {
        cashierUserId: req.user.id,
        openingCash: parsedOpening,
        expectedCash: parsedOpening,
        totalCashSales: 0,
        totalCashExpenses: 0,
        notes,
      },
      include: {
        cashier: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
};

export const closeSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { actualCash, notes } = req.body;

    const session = await prisma.cashSession.findUnique({
      where: { id },
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Shift kasir tidak ditemukan' });
    }

    if (session.isClosed) {
      return res.status(400).json({ success: false, message: 'Shift ini sudah ditutup sebelumnya' });
    }

    const actual = parseFloat(actualCash) || 0;
    const expected = parseFloat(session.expectedCash);
    const diff = actual - expected;

    const closed = await prisma.cashSession.update({
      where: { id },
      data: {
        actualCash: actual,
        difference: diff,
        closedAt: new Date(),
        isClosed: true,
        notes: notes || session.notes,
      },
      include: {
        cashier: { select: { id: true, name: true } },
      },
    });

    res.json({ success: true, data: closed });
  } catch (err) {
    next(err);
  }
};
