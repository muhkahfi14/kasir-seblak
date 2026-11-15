import prisma from '../../config/database.js';

export const getCategories = async (req, res, next) => {
  try {
    const categories = await prisma.menuCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, sortOrder } = req.body;
    const category = await prisma.menuCategory.create({
      data: {
        name,
        sortOrder: sortOrder || 0,
      },
    });
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
};

export const getMenuItems = async (req, res, next) => {
  try {
    const items = await prisma.menuItem.findMany({
      where: { isActive: true },
      include: {
        category: true,
        recipes: {
          include: {
            ingredient: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
};

export const createMenuItem = async (req, res, next) => {
  try {
    const { name, categoryId, basePrice, description, isAvailable, recipes } = req.body;
    const sku = `MNU-${Date.now().toString().slice(-6)}`;

    const item = await prisma.menuItem.create({
      data: {
        sku,
        name,
        categoryId,
        basePrice,
        description,
        isActive: isAvailable ?? true,
        recipes: recipes?.length
          ? {
              create: recipes.map((r) => ({
                ingredientId: r.ingredientId,
                quantity: r.quantity,
                unit: r.unit || 'gram',
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        recipes: { include: { ingredient: true } },
      },
    });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

export const updateMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, categoryId, basePrice, description, isAvailable } = req.body;

    const item = await prisma.menuItem.update({
      where: { id },
      data: {
        name,
        categoryId: categoryId || undefined,
        basePrice,
        description,
        isActive: isAvailable,
      },
      include: { category: true },
    });
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

export const deleteMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.menuItem.update({
      where: { id },
      data: { isActive: false },
    });
    res.json({ success: true, message: 'Menu berhasil dinonaktifkan' });
  } catch (err) {
    next(err);
  }
};
