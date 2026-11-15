import prisma from '../../config/database.js';

export const getCapitalTransactions = async (req, res, next) => {
  try {
    const transactions = await prisma.capitalTransaction.findMany({
      include: {
        creator: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const summary = transactions.reduce(
      (acc, t) => {
        const amt = parseFloat(t.amount);
        if (t.type === 'DEPOSIT' || t.type === 'CASH_ADDITION') {
          acc.totalDeposited += amt;
          acc.currentBalance += amt;
        } else if (t.type === 'WITHDRAWAL') {
          acc.totalWithdrawn += amt;
          acc.currentBalance -= amt;
        }
        return acc;
      },
      { totalDeposited: 0, totalWithdrawn: 0, currentBalance: 0 }
    );

    res.json({ success: true, data: transactions, summary });
  } catch (err) {
    next(err);
  }
};

export const createCapitalTransaction = async (req, res, next) => {
  try {
    const { type, amount, description, reference } = req.body;
    const transaction = await prisma.capitalTransaction.create({
      data: {
        type, // 'DEPOSIT' | 'WITHDRAWAL' | 'CASH_ADDITION'
        amount: parseFloat(amount),
        description,
        reference,
        createdBy: req.user.id,
      },
      include: {
        creator: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({ success: true, data: transaction });
  } catch (err) {
    next(err);
  }
};
