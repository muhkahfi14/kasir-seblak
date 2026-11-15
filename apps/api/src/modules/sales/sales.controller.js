import { randomUUID } from 'crypto';
import prisma from '../../config/database.js';

const PAYMENT_METHODS = ['CASH', 'QRIS'];

const SALE_INCLUDE = {
  creator: { select: { id: true, name: true } },
  items: {
    include: {
      toppings: true,
    },
  },
  payment: {
    include: {
      cashier: { select: { id: true, name: true } },
    },
  },
  cashSession: true,
};

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const parseMoney = (value) => {
  if (value === null || value === undefined || value === '') return NaN;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? roundMoney(parsed) : NaN;
};

const generateSaleNumber = () => {
  const now = new Date();
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('');
  const suffix = randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase();
  return `INV-${datePart}-${suffix}`;
};

const dateRangeFilter = (startDate, endDate) => {
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

export const getSales = async (req, res, next) => {
  try {
    const { startDate, endDate, status, paymentMethod, limit = 100 } = req.query;

    const where = {};
    if (status) where.status = status;
    if (paymentMethod) {
      where.payment = {
        is: {
          paymentMethod,
          status: 'PAID',
        },
      };
    }

    const createdAt = dateRangeFilter(startDate, endDate);
    if (createdAt) where.createdAt = createdAt;

    const sales = await prisma.sale.findMany({
      where,
      include: SALE_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: Math.min(parseInt(limit, 10) || 100, 500),
    });

    res.json({ success: true, data: sales });
  } catch (err) {
    next(err);
  }
};

export const getSaleDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: SALE_INCLUDE,
    });

    if (!sale) {
      return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
    }

    res.json({ success: true, data: sale });
  } catch (err) {
    next(err);
  }
};

export const createSale = async (req, res, next) => {
  const {
    items,
    paymentMethod,
    cashTendered,
    qrisConfirmed,
    customerName,
    notes,
    clientRequestId,
  } = req.body;

  let requestKey = null;

  try {
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Item pesanan tidak boleh kosong' });
    }

    const method = String(paymentMethod || '').toUpperCase();
    if (!PAYMENT_METHODS.includes(method)) {
      return res.status(400).json({
        success: false,
        message: 'Metode pembayaran harus CASH atau QRIS',
      });
    }

    requestKey =
      typeof clientRequestId === 'string' && clientRequestId.trim()
        ? clientRequestId.trim()
        : null;

    // Idempotent checkout: re-sending the same request returns the original sale.
    if (requestKey) {
      const existingSale = await prisma.sale.findUnique({
        where: { clientRequestId: requestKey },
        include: SALE_INCLUDE,
      });

      if (existingSale) {
        return res.status(200).json({
          success: true,
          duplicate: true,
          message: 'Transaksi ini sudah tercatat sebelumnya',
          data: { ...existingSale, invoiceNumber: existingSale.saleNumber },
        });
      }
    }

    // Recipes are the source of truth for both price snapshots and stock deduction.
    const [allToppings, allMenuItems] = await Promise.all([
      prisma.topping.findMany({
        include: { recipes: { include: { ingredient: true } } },
      }),
      prisma.menuItem.findMany({
        include: { recipes: { include: { ingredient: true } } },
      }),
    ]);

    const toppingMap = new Map(allToppings.map((topping) => [topping.id, topping]));
    const menuMap = new Map(allMenuItems.map((menu) => [menu.id, menu]));
    const ingredientsToDeduct = {};
    const saleItemsData = [];

    let calculatedSubtotal = 0;
    let calculatedTotalHpp = 0;

    for (const item of items) {
      if (item.type === 'SEBLAK') {
        const basePrice = parseMoney(item.basePrice);
        if (!Number.isFinite(basePrice) || basePrice < 0) {
          return res.status(400).json({ success: false, message: 'Harga porsi seblak tidak valid' });
        }

        let portionHpp = 0;
        const baseMenu = allMenuItems.find((menu) =>
          menu.name.toLowerCase().includes('seblak')
        );

        if (baseMenu?.recipes?.length) {
          for (const recipe of baseMenu.recipes) {
            const qty = parseFloat(recipe.quantity);
            const cost = parseFloat(recipe.ingredient.avgCost);
            portionHpp += qty * cost;
            ingredientsToDeduct[recipe.ingredientId] =
              (ingredientsToDeduct[recipe.ingredientId] || 0) + qty;
          }
        }

        const saleItemToppings = [];
        let toppingsPrice = 0;

        for (const toppingInput of item.toppings || []) {
          const toppingRecord = toppingMap.get(toppingInput.toppingId);
          if (!toppingRecord) {
            return res.status(400).json({
              success: false,
              message: `Topping ${toppingInput.name || toppingInput.toppingId} tidak ditemukan`,
            });
          }

          const topQty = Math.max(1, parseInt(toppingInput.qty, 10) || 1);
          const topPrice = parseFloat(toppingRecord.price);
          let toppingHpp = 0;

          for (const toppingRecipe of toppingRecord.recipes || []) {
            const requiredQty = parseFloat(toppingRecipe.quantity) * topQty;
            const cost = parseFloat(toppingRecipe.ingredient.avgCost);
            toppingHpp += requiredQty * cost;
            ingredientsToDeduct[toppingRecipe.ingredientId] =
              (ingredientsToDeduct[toppingRecipe.ingredientId] || 0) + requiredQty;
          }

          portionHpp += toppingHpp;
          toppingsPrice += topPrice * topQty;

          saleItemToppings.push({
            toppingId: toppingRecord.id,
            toppingName: toppingRecord.name,
            toppingPrice: topPrice,
            quantity: topQty,
            hpp: roundMoney(toppingHpp),
            subtotal: roundMoney(topPrice * topQty),
          });
        }

        const portionTotal = roundMoney(basePrice + toppingsPrice);
        calculatedSubtotal = roundMoney(calculatedSubtotal + portionTotal);
        calculatedTotalHpp = roundMoney(calculatedTotalHpp + portionHpp);

        saleItemsData.push({
          menuItemId: baseMenu?.id || null,
          menuName: `${item.name || 'Porsi Seblak'} (Pedas Lv.${item.spiceLevel ?? 2}, ${
            item.broth || 'Original'
          })`,
          menuPrice: basePrice,
          quantity: 1,
          hpp: roundMoney(portionHpp),
          subtotal: portionTotal,
          toppings: {
            create: saleItemToppings,
          },
        });
      } else {
        const menuRecord = menuMap.get(item.menuItemId);
        if (!menuRecord) {
          return res.status(400).json({
            success: false,
            message: `Menu ${item.name || item.menuItemId} tidak ditemukan`,
          });
        }

        const qty = Math.max(1, parseInt(item.qty, 10) || 1);
        const price = parseFloat(menuRecord.basePrice);
        let itemHpp = 0;

        for (const recipe of menuRecord.recipes || []) {
          const requiredQty = parseFloat(recipe.quantity) * qty;
          const cost = parseFloat(recipe.ingredient.avgCost);
          itemHpp += requiredQty * cost;
          ingredientsToDeduct[recipe.ingredientId] =
            (ingredientsToDeduct[recipe.ingredientId] || 0) + requiredQty;
        }

        const lineTotal = roundMoney(price * qty);
        calculatedSubtotal = roundMoney(calculatedSubtotal + lineTotal);
        calculatedTotalHpp = roundMoney(calculatedTotalHpp + itemHpp);

        saleItemsData.push({
          menuItemId: menuRecord.id,
          menuName: menuRecord.name,
          menuPrice: price,
          quantity: qty,
          hpp: roundMoney(itemHpp),
          subtotal: lineTotal,
        });
      }
    }

    if (calculatedSubtotal <= 0) {
      return res.status(400).json({ success: false, message: 'Total tagihan tidak valid' });
    }

    let amountReceived = null;
    let changeAmount = null;

    if (method === 'CASH') {
      amountReceived = parseMoney(cashTendered);
      if (!Number.isFinite(amountReceived)) {
        return res.status(400).json({
          success: false,
          message: 'Nominal uang tunai yang diterima wajib diisi',
        });
      }

      if (amountReceived < calculatedSubtotal) {
        return res.status(400).json({
          success: false,
          message: 'Uang yang diterima kurang dari total tagihan',
          data: {
            totalAmount: calculatedSubtotal,
            amountReceived,
            shortfall: roundMoney(calculatedSubtotal - amountReceived),
          },
        });
      }

      changeAmount = roundMoney(amountReceived - calculatedSubtotal);
    } else if (qrisConfirmed !== true) {
      return res.status(400).json({
        success: false,
        message: 'Konfirmasi pemeriksaan pembayaran QRIS diperlukan',
      });
    }

    // Only a cash sale affects the physical cash drawer.
    const activeSession =
      method === 'CASH'
        ? await prisma.cashSession.findFirst({
            where: {
              cashierUserId: req.user.id,
              isClosed: false,
            },
          })
        : null;

    const saleNumber = generateSaleNumber();
    const paidAt = new Date();
    const cashierId = req.user.id;

    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          saleNumber,
          clientRequestId: requestKey,
          status: 'COMPLETED',
          subtotal: calculatedSubtotal,
          discountAmount: 0,
          totalAmount: calculatedSubtotal,
          totalHpp: calculatedTotalHpp,
          cashSessionId: activeSession?.id || null,
          notes: notes || customerName || null,
          createdBy: cashierId,
          items: {
            create: saleItemsData,
          },
          payment: {
            create: {
              paymentMethod: method,
              amount: calculatedSubtotal,
              amountReceived,
              changeAmount,
              status: 'PAID',
              paidAt,
              cashierId,
            },
          },
        },
        include: SALE_INCLUDE,
      });

      // Both CASH and QRIS are recorded as paid immediately, so stock is consumed now.
      for (const [ingredientId, quantity] of Object.entries(ingredientsToDeduct)) {
        await tx.ingredient.update({
          where: { id: ingredientId },
          data: { stock: { decrement: quantity } },
        });

        await tx.inventoryMovement.create({
          data: {
            ingredientId,
            type: 'SALE',
            quantity,
            reference: saleNumber,
            referenceId: sale.id,
            notes: `Penjualan ${method} #${saleNumber}`,
            createdBy: cashierId,
          },
        });
      }

      if (method === 'CASH' && activeSession) {
        await tx.cashSession.update({
          where: { id: activeSession.id },
          data: {
            totalCashSales: { increment: calculatedSubtotal },
            expectedCash: { increment: calculatedSubtotal },
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: cashierId,
          action: 'SALE_COMPLETED',
          entity: 'Sale',
          entityId: sale.id,
          newData: {
            saleNumber,
            paymentMethod: method,
            paymentStatus: 'PAID',
            amount: calculatedSubtotal,
            amountReceived,
            changeAmount,
            totalHpp: calculatedTotalHpp,
          },
          ipAddress: req.ip,
        },
      });

      return sale;
    });

    res.status(201).json({
      success: true,
      data: { ...result, invoiceNumber: result.saleNumber },
    });
  } catch (err) {
    // A concurrent click with the same clientRequestId must not create a second payment.
    if (err?.code === 'P2002' && requestKey) {
      const existingSale = await prisma.sale.findUnique({
        where: { clientRequestId: requestKey },
        include: SALE_INCLUDE,
      });

      if (existingSale) {
        return res.status(200).json({
          success: true,
          duplicate: true,
          message: 'Transaksi ini sudah tercatat sebelumnya',
          data: { ...existingSale, invoiceNumber: existingSale.saleNumber },
        });
      }
    }

    next(err);
  }
};

const reverseSale = async (req, res, next, { targetStatus, paymentStatus, action }) => {
  try {
    const { id } = req.params;

    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id },
        include: {
          payment: true,
          items: { include: { toppings: true } },
        },
      });

      if (!sale) {
        const error = new Error('Transaksi tidak ditemukan');
        error.status = 404;
        throw error;
      }

      if (sale.status !== 'COMPLETED') {
        const error = new Error(
          `Hanya transaksi berstatus COMPLETED yang dapat diproses menjadi ${targetStatus}`
        );
        error.status = 400;
        throw error;
      }

      // Restore exactly the quantities that were consumed by this sale.
      const saleMovements = await tx.inventoryMovement.findMany({
        where: {
          referenceId: sale.id,
          type: 'SALE',
        },
      });

      for (const movement of saleMovements) {
        const quantity = parseFloat(movement.quantity);
        await tx.ingredient.update({
          where: { id: movement.ingredientId },
          data: { stock: { increment: quantity } },
        });

        await tx.inventoryMovement.create({
          data: {
            ingredientId: movement.ingredientId,
            type: 'SALE_REVERSAL',
            quantity,
            reference: sale.saleNumber,
            referenceId: sale.id,
            notes: `Pengembalian stok ${targetStatus} #${sale.saleNumber}`,
            createdBy: req.user.id,
          },
        });
      }

      if (sale.payment) {
        await tx.payment.update({
          where: { id: sale.payment.id },
          data: { status: paymentStatus },
        });
      }

      const updatedSale = await tx.sale.update({
        where: { id: sale.id },
        data: { status: targetStatus },
        include: SALE_INCLUDE,
      });

      if (
        sale.payment?.paymentMethod === 'CASH' &&
        sale.cashSessionId &&
        sale.payment?.amount
      ) {
        const session = await tx.cashSession.findUnique({
          where: { id: sale.cashSessionId },
        });

        if (session && !session.isClosed) {
          await tx.cashSession.update({
            where: { id: session.id },
            data: {
              totalCashSales: { decrement: parseFloat(sale.payment.amount) },
              expectedCash: { decrement: parseFloat(sale.payment.amount) },
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action,
          entity: 'Sale',
          entityId: sale.id,
          oldData: {
            status: sale.status,
            paymentStatus: sale.payment?.status,
          },
          newData: {
            status: targetStatus,
            paymentStatus,
            restoredMovements: saleMovements.length,
          },
          ipAddress: req.ip,
        },
      });

      return updatedSale;
    });

    res.json({ success: true, message: `Transaksi berhasil di-${targetStatus.toLowerCase()}`, data: result });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    next(err);
  }
};

export const cancelSale = (req, res, next) =>
  reverseSale(req, res, next, {
    targetStatus: 'CANCELLED',
    paymentStatus: 'CANCELLED',
    action: 'SALE_CANCELLED',
  });

export const refundSale = (req, res, next) =>
  reverseSale(req, res, next, {
    targetStatus: 'REFUNDED',
    paymentStatus: 'REFUNDED',
    action: 'SALE_REFUNDED',
  });
