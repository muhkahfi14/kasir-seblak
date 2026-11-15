import prisma from '../../config/database.js';

export const getSuppliers = async (req, res, next) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: suppliers });
  } catch (err) {
    next(err);
  }
};

export const createSupplier = async (req, res, next) => {
  try {
    const { name, phone, address } = req.body;
    const supplier = await prisma.supplier.create({
      data: { name, phone, address },
    });
    res.status(201).json({ success: true, data: supplier });
  } catch (err) {
    next(err);
  }
};

export const getPurchases = async (req, res, next) => {
  try {
    const purchases = await prisma.purchase.findMany({
      include: {
        supplier: true,
        creator: { select: { id: true, name: true } },
        items: {
          include: {
            ingredient: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: purchases });
  } catch (err) {
    next(err);
  }
};

export const createPurchase = async (req, res, next) => {
  try {
    const { supplierId, notes, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Daftar item belanja tidak boleh kosong' });
    }

    const purchaseNumber = `PO-${Date.now().toString().slice(-8)}`;
    const totalAmount = items.reduce(
      (sum, item) => sum + parseFloat(item.quantity) * parseFloat(item.pricePerUnit),
      0
    );

    // Execute in transaction to update inventory and weighted average cost
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Purchase record
      const purchase = await tx.purchase.create({
        data: {
          purchaseNumber,
          supplierId: supplierId || null,
          status: 'RECEIVED',
          totalAmount,
          notes,
          receivedAt: new Date(),
          createdBy: req.user.id,
          items: {
            create: items.map((i) => ({
              ingredientId: i.ingredientId,
              quantity: parseFloat(i.quantity),
              unit: i.unit || 'gram',
              pricePerUnit: parseFloat(i.pricePerUnit),
              totalPrice: parseFloat(i.quantity) * parseFloat(i.pricePerUnit),
            })),
          },
        },
        include: { items: true },
      });

      // 2. Update each ingredient stock & weighted average cost
      for (const item of items) {
        const qty = parseFloat(item.quantity);
        const price = parseFloat(item.pricePerUnit);

        const current = await tx.ingredient.findUnique({
          where: { id: item.ingredientId },
        });

        if (current) {
          const oldStock = parseFloat(current.stock);
          const oldAvgCost = parseFloat(current.avgCost);
          const newStock = oldStock + qty;

          // Weighted average cost formula: ((oldStock * oldAvgCost) + (qty * price)) / newStock
          let newAvgCost = price;
          if (newStock > 0) {
            newAvgCost = (oldStock * oldAvgCost + qty * price) / newStock;
          }

          await tx.ingredient.update({
            where: { id: item.ingredientId },
            data: {
              stock: newStock,
              avgCost: Math.round(newAvgCost),
            },
          });

          // Log inventory movement
          await tx.inventoryMovement.create({
            data: {
              ingredientId: item.ingredientId,
              type: 'PURCHASE',
              quantity: qty,
              unitCost: price,
              reference: purchaseNumber,
              referenceId: purchase.id,
              notes: `Pembelian Bahan Baku #${purchaseNumber}`,
              createdBy: req.user.id,
            },
          });
        }
      }

      // 3. Automatically record Expense for this purchase
      await tx.expense.create({
        data: {
          expenseNumber: `EXP-PO-${Date.now().toString().slice(-6)}`,
          category: 'OTHER',
          expenseType: 'INVENTORY_PURCHASE',
          description: `Pembelian Bahan Baku (${purchaseNumber})`,
          amount: totalAmount,
          paymentMethod: 'CASH',
          status: 'PAID',
          notes: notes || `Pembelian #${purchaseNumber}`,
          createdBy: req.user.id,
        },
      });

      return purchase;
    });

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
