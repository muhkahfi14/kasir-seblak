import prisma from '../../config/database.js';

export const getIngredients = async (req, res, next) => {
  try {
    const ingredients = await prisma.ingredient.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: ingredients });
  } catch (err) {
    next(err);
  }
};

export const createIngredient = async (req, res, next) => {
  try {
    const { name, category, unit, minStock, stock, avgCost } = req.body;
    const ingredient = await prisma.ingredient.create({
      data: {
        name,
        category: category || 'Umum',
        unit,
        minStock: minStock || 0,
        stock: stock || 0,
        avgCost: avgCost || 0,
      },
    });

    // Record initial movement
    if (stock > 0) {
      await prisma.inventoryMovement.create({
        data: {
          ingredientId: ingredient.id,
          type: 'ADJUSTMENT_IN',
          quantity: stock,
          unitCost: avgCost || 0,
          notes: 'Stok Awal Pembuatan Bahan',
          createdBy: req.user.id,
        },
      });
    }

    res.status(201).json({ success: true, data: ingredient });
  } catch (err) {
    next(err);
  }
};

export const updateIngredient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, category, unit, minStock } = req.body;
    const ingredient = await prisma.ingredient.update({
      where: { id },
      data: {
        name,
        category,
        unit,
        minStock,
      },
    });
    res.json({ success: true, data: ingredient });
  } catch (err) {
    next(err);
  }
};

export const adjustStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { actualStock, reason, notes } = req.body;

    const current = await prisma.ingredient.findUnique({
      where: { id },
    });

    if (!current) {
      return res.status(404).json({ success: false, message: 'Bahan baku tidak ditemukan' });
    }

    const currentStockNum = parseFloat(current.stock);
    const newStockNum = parseFloat(actualStock);
    const diff = newStockNum - currentStockNum;

    if (diff === 0) {
      return res.json({ success: true, message: 'Stok tidak berubah', data: current });
    }

    const movementType = diff > 0 ? 'ADJUSTMENT_IN' : (reason === 'WASTE' ? 'WASTE' : 'ADJUSTMENT_OUT');

    const [updated] = await prisma.$transaction([
      prisma.ingredient.update({
        where: { id },
        data: { stock: newStockNum },
      }),
      prisma.inventoryMovement.create({
        data: {
          ingredientId: id,
          type: movementType,
          quantity: Math.abs(diff),
          unitCost: current.avgCost,
          notes: notes || `Penyesuaian stok manual (${reason || 'Stock Opname'})`,
          createdBy: req.user.id,
        },
      }),
    ]);

    res.json({ success: true, data: updated, difference: diff });
  } catch (err) {
    next(err);
  }
};

export const getMovements = async (req, res, next) => {
  try {
    const { ingredientId, limit = 50 } = req.query;
    const movements = await prisma.inventoryMovement.findMany({
      where: ingredientId ? { ingredientId } : undefined,
      include: {
        ingredient: true,
        creator: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit, 10),
    });
    res.json({ success: true, data: movements });
  } catch (err) {
    next(err);
  }
};
