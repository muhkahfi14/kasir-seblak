import prisma from '../../config/database.js';

export const getExpenses = async (req, res, next) => {
  try {
    const { category, startDate, endDate } = req.query;
    const where = {};
    if (category) where.category = category;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: expenses });
  } catch (err) {
    next(err);
  }
};

export const createExpense = async (req, res, next) => {
  try {
    const { category, description, amount, paymentMethod, notes } = req.body;
    const expenseNumber = `EXP-${Date.now().toString().slice(-8)}`;
    const parsedAmount = parseFloat(amount);

    const expense = await prisma.$transaction(async (tx) => {
      const exp = await tx.expense.create({
        data: {
          expenseNumber,
          category: category || 'OTHER',
          expenseType: 'OPERATIONAL',
          description,
          amount: parsedAmount,
          paymentMethod: paymentMethod || 'CASH',
          status: 'PAID',
          notes,
          createdBy: req.user.id,
        },
      });

      // If paid via cash, deduct from active cash session if present
      if (paymentMethod === 'CASH') {
        const activeSession = await tx.cashSession.findFirst({
          where: { cashierUserId: req.user.id, isClosed: false },
        });

        if (activeSession) {
          await tx.cashSession.update({
            where: { id: activeSession.id },
            data: {
              totalCashExpenses: { increment: parsedAmount },
              expectedCash: { decrement: parsedAmount },
            },
          });
        }
      }

      return exp;
    });

    res.status(201).json({ success: true, data: expense });
  } catch (err) {
    next(err);
  }
};

export const deleteExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.expense.delete({ where: { id } });
    res.json({ success: true, message: 'Pengeluaran berhasil dihapus' });
  } catch (err) {
    next(err);
  }
};
