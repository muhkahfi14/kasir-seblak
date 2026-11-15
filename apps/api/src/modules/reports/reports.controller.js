import prisma from '../../config/database.js';
import ExcelJS from 'exceljs';

const PAYMENT_METHODS = ['CASH', 'QRIS'];

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
const money = (value) => (value === null || value === undefined ? 0 : parseFloat(value) || 0);

const buildDateFilter = (startDate, endDate) => {
  if (!startDate && !endDate) return undefined;

  const filter = {};
  if (startDate) filter.gte = new Date(startDate);
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    filter.lte = end;
  }
  return filter;
};

const buildPaymentWhere = (paymentMethod) => ({
  is: {
    status: 'PAID',
    ...(paymentMethod ? { paymentMethod } : {}),
  },
});

const buildPaymentBreakdown = (sales) => {
  const totals = {
    CASH: { total: 0, count: 0 },
    QRIS: { total: 0, count: 0 },
  };

  for (const sale of sales) {
    const payment = sale.payment;
    if (!payment || payment.status !== 'PAID' || !PAYMENT_METHODS.includes(payment.paymentMethod)) {
      continue;
    }

    totals[payment.paymentMethod].total = roundMoney(
      totals[payment.paymentMethod].total + money(payment.amount)
    );
    totals[payment.paymentMethod].count += 1;
  }

  const total = roundMoney(totals.CASH.total + totals.QRIS.total);

  return {
    total,
    methods: PAYMENT_METHODS.map((method) => ({
      method,
      total: totals[method].total,
      count: totals[method].count,
      percentage: total > 0 ? roundMoney((totals[method].total / total) * 100) : 0,
    })),
  };
};

const validatePaymentFilter = (paymentMethod) => {
  if (!paymentMethod) return null;
  const normalized = String(paymentMethod).toUpperCase();
  return PAYMENT_METHODS.includes(normalized) ? normalized : false;
};

export const getDashboardSummary = async (req, res, next) => {
  try {
    const { period = 'today' } = req.query;

    const now = new Date();
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate.setDate(now.getDate() - 30);
    }

    // Only completed sales with a PAID payment count as valid revenue.
    const sales = await prisma.sale.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: startDate },
        payment: buildPaymentWhere(),
      },
      include: {
        items: {
          include: {
            toppings: true,
          },
        },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    let omzet = 0;
    let cogs = 0;
    let totalPortions = 0;
    const toppingCounts = {};

    for (const sale of sales) {
      omzet += money(sale.totalAmount);
      cogs += money(sale.totalHpp);

      for (const item of sale.items) {
        totalPortions += item.quantity;
        for (const topping of item.toppings) {
          if (!toppingCounts[topping.toppingName]) {
            toppingCounts[topping.toppingName] = {
              name: topping.toppingName,
              soldQty: 0,
              totalSales: 0,
            };
          }
          toppingCounts[topping.toppingName].soldQty += topping.quantity;
          toppingCounts[topping.toppingName].totalSales += money(topping.subtotal);
        }
      }
    }

    omzet = roundMoney(omzet);
    cogs = roundMoney(cogs);
    const grossProfit = roundMoney(omzet - cogs);

    const expenses = await prisma.expense.findMany({
      where: {
        expenseType: 'OPERATIONAL',
        createdAt: { gte: startDate },
      },
    });
    const totalExpenses = roundMoney(
      expenses.reduce((sum, expense) => sum + money(expense.amount), 0)
    );
    const netProfit = roundMoney(grossProfit - totalExpenses);

    const activeSessions = await prisma.cashSession.findMany({
      where: { isClosed: false },
    });
    const cashInDrawer = roundMoney(
      activeSessions.reduce((sum, session) => sum + money(session.expectedCash), 0)
    );

    const ingredients = await prisma.ingredient.findMany({
      where: { isActive: true },
    });

    let stockValue = 0;
    const lowStockIngredients = [];

    for (const ingredient of ingredients) {
      const stock = money(ingredient.stock);
      const minStock = money(ingredient.minStock);
      const avgCost = money(ingredient.avgCost);
      stockValue += stock * avgCost;

      if (stock <= minStock) {
        lowStockIngredients.push({
          id: ingredient.id,
          name: ingredient.name,
          unit: ingredient.unit,
          currentStock: stock,
          minStock,
          averageCost: avgCost,
        });
      }
    }

    const topToppings = Object.values(toppingCounts)
      .sort((a, b) => b.soldQty - a.soldQty)
      .slice(0, 5);

    const recentSales = sales.slice(0, 5).map((sale) => ({
      id: sale.id,
      invoiceNumber: sale.saleNumber,
      totalAmount: money(sale.totalAmount),
      paymentMethod: sale.payment?.paymentMethod || null,
      paymentStatus: sale.payment?.status || null,
      createdAt: sale.createdAt,
    }));

    const chartMap = {};
    const days = period === 'today' ? 1 : period === 'week' ? 7 : 14;
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      chartMap[dateKey] = { name: dateKey, omzet: 0, cogs: 0, cash: 0, qris: 0 };
    }

    for (const sale of sales) {
      const key = new Date(sale.createdAt).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
      });

      if (chartMap[key]) {
        chartMap[key].omzet += money(sale.totalAmount);
        chartMap[key].cogs += money(sale.totalHpp);
        if (sale.payment?.paymentMethod === 'CASH') {
          chartMap[key].cash += money(sale.payment.amount);
        } else if (sale.payment?.paymentMethod === 'QRIS') {
          chartMap[key].qris += money(sale.payment.amount);
        }
      }
    }

    const paymentBreakdown = buildPaymentBreakdown(sales);
    const cash = paymentBreakdown.methods.find((item) => item.method === 'CASH');
    const qris = paymentBreakdown.methods.find((item) => item.method === 'QRIS');

    res.json({
      success: true,
      data: {
        summary: {
          omzet,
          totalTransactions: sales.length,
          totalPortions,
          cogs,
          grossProfit,
          netProfit,
          cashInDrawer,
          stockValue: roundMoney(stockValue),
          cashRevenue: cash.total,
          qrisRevenue: qris.total,
          cashTransactions: cash.count,
          qrisTransactions: qris.count,
          cashPercentage: cash.percentage,
          qrisPercentage: qris.percentage,
        },
        paymentBreakdown,
        chartData: Object.values(chartMap),
        topToppings,
        lowStockIngredients,
        recentSales,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getProfitLossReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const paymentMethod = validatePaymentFilter(req.query.paymentMethod);

    if (paymentMethod === false) {
      return res.status(400).json({
        success: false,
        message: 'Filter metode pembayaran harus CASH atau QRIS',
      });
    }

    const createdAt = buildDateFilter(startDate, endDate);

    const whereSale = {
      status: 'COMPLETED',
      payment: buildPaymentWhere(paymentMethod),
      ...(createdAt ? { createdAt } : {}),
    };
    const whereExpense = createdAt ? { createdAt } : {};

    const [sales, expenses] = await Promise.all([
      prisma.sale.findMany({
        where: whereSale,
        include: { payment: true },
      }),
      prisma.expense.findMany({ where: whereExpense }),
    ]);

    const revenue = roundMoney(sales.reduce((sum, sale) => sum + money(sale.totalAmount), 0));
    const cogs = roundMoney(sales.reduce((sum, sale) => sum + money(sale.totalHpp), 0));
    const grossProfit = roundMoney(revenue - cogs);

    const expenseCategories = {};
    let totalExpenses = 0;

    for (const expense of expenses) {
      const amount = money(expense.amount);
      totalExpenses += amount;
      expenseCategories[expense.category] = roundMoney(
        (expenseCategories[expense.category] || 0) + amount
      );
    }

    totalExpenses = roundMoney(totalExpenses);
    const netProfit = roundMoney(grossProfit - totalExpenses);

    res.json({
      success: true,
      data: {
        revenue,
        cogs,
        grossProfit,
        totalExpenses,
        netProfit,
        expenseBreakdown: expenseCategories,
        totalTransactions: sales.length,
        paymentMethodFilter: paymentMethod || 'ALL',
        paymentBreakdown: buildPaymentBreakdown(sales),
      },
    });
  } catch (err) {
    next(err);
  }
};

// Excel Export: Sales Report
export const exportSalesToExcel = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const paymentMethod = validatePaymentFilter(req.query.paymentMethod);

    if (paymentMethod === false) {
      return res.status(400).json({
        success: false,
        message: 'Filter metode pembayaran harus CASH atau QRIS',
      });
    }

    const createdAt = buildDateFilter(startDate, endDate);

    const sales = await prisma.sale.findMany({
      where: {
        status: 'COMPLETED',
        payment: buildPaymentWhere(paymentMethod),
        ...(createdAt ? { createdAt } : {}),
      },
      include: {
        creator: { select: { name: true } },
        items: true,
        payment: {
          include: {
            cashier: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Laporan Penjualan');

    worksheet.columns = [
      { header: 'No. Invoice', key: 'invoice', width: 20 },
      { header: 'Tanggal & Waktu', key: 'date', width: 22 },
      { header: 'Kasir Penjualan', key: 'cashier', width: 18 },
      { header: 'Kasir Pembayaran', key: 'paymentCashier', width: 18 },
      { header: 'Metode Pembayaran', key: 'paymentMethod', width: 18 },
      { header: 'Status Pembayaran', key: 'paymentStatus', width: 18 },
      { header: 'Uang Diterima (Rp)', key: 'amountReceived', width: 20 },
      { header: 'Kembalian (Rp)', key: 'changeAmount', width: 16 },
      { header: 'Status Transaksi', key: 'status', width: 16 },
      { header: 'Total Omzet (Rp)', key: 'amount', width: 18 },
      { header: 'Total HPP (Rp)', key: 'hpp', width: 18 },
      { header: 'Laba Kotor (Rp)', key: 'profit', width: 18 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF97316' },
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    sales.forEach((sale) => {
      const omzet = money(sale.totalAmount);
      const hpp = money(sale.totalHpp);
      const payment = sale.payment;

      worksheet.addRow({
        invoice: sale.saleNumber,
        date: new Date(sale.createdAt).toLocaleString('id-ID'),
        cashier: sale.creator?.name || 'Kasir',
        paymentCashier: payment?.cashier?.name || sale.creator?.name || 'Kasir',
        paymentMethod: payment?.paymentMethod || '-',
        paymentStatus: payment?.status || '-',
        amountReceived:
          payment?.amountReceived !== null && payment?.amountReceived !== undefined
            ? money(payment.amountReceived)
            : '',
        changeAmount:
          payment?.changeAmount !== null && payment?.changeAmount !== undefined
            ? money(payment.changeAmount)
            : '',
        status: sale.status,
        amount: omzet,
        hpp,
        profit: roundMoney(omzet - hpp),
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename="laporan-penjualan.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};

// Excel Export: Inventory Valuation
export const exportInventoryToExcel = async (req, res, next) => {
  try {
    const ingredients = await prisma.ingredient.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Valuasi Stok Bahan Baku');

    worksheet.columns = [
      { header: 'Nama Bahan', key: 'name', width: 24 },
      { header: 'Kategori', key: 'category', width: 18 },
      { header: 'Satuan', key: 'unit', width: 12 },
      { header: 'Stok Saat Ini', key: 'stock', width: 15 },
      { header: 'Min. Stok', key: 'minStock', width: 15 },
      { header: 'HPP Rata-rata (Rp)', key: 'avgCost', width: 18 },
      { header: 'Total Nilai Aset (Rp)', key: 'totalValue', width: 22 },
      { header: 'Status', key: 'status', width: 14 },
    ];

    worksheet.getRow(1).font = { bold: true };

    ingredients.forEach((ingredient) => {
      const stock = money(ingredient.stock);
      const minStock = money(ingredient.minStock);
      const avgCost = money(ingredient.avgCost);
      const totalValue = stock * avgCost;

      worksheet.addRow({
        name: ingredient.name,
        category: ingredient.category,
        unit: ingredient.unit,
        stock,
        minStock,
        avgCost,
        totalValue,
        status: stock <= minStock ? 'MENIPIS' : 'AMAN',
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename="laporan-stok-bahan.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};
