import prisma from '../../config/database.js';

export const getToppings = async (req, res, next) => {
  try {
    const toppings = await prisma.topping.findMany({
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

    // Format for frontend
    const formatted = toppings.map((t) => ({
      ...t,
      category: t.category?.name || 'Lainnya',
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
};

export const createTopping = async (req, res, next) => {
  try {
    const { name, category, price, unit, recipes } = req.body;

    // Find or create category
    let categoryRecord = null;
    if (category) {
      categoryRecord = await prisma.menuCategory.findFirst({
        where: { name: category },
      });
      if (!categoryRecord) {
        categoryRecord = await prisma.menuCategory.create({
          data: { name: category },
        });
      }
    }

    const topping = await prisma.topping.create({
      data: {
        name,
        categoryId: categoryRecord?.id,
        price,
        unit: unit || 'porsi',
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

    res.status(201).json({ success: true, data: topping });
  } catch (err) {
    next(err);
  }
};

export const updateTopping = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, category, price, isAvailable } = req.body;

    let categoryId = undefined;
    if (category) {
      let categoryRecord = await prisma.menuCategory.findFirst({
        where: { name: category },
      });
      if (!categoryRecord) {
        categoryRecord = await prisma.menuCategory.create({
          data: { name: category },
        });
      }
      categoryId = categoryRecord.id;
    }

    const topping = await prisma.topping.update({
      where: { id },
      data: {
        name,
        categoryId,
        price,
        isActive: isAvailable,
      },
    });

    res.json({ success: true, data: topping });
  } catch (err) {
    next(err);
  }
};

export const deleteTopping = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.topping.update({
      where: { id },
      data: { isActive: false },
    });
    res.json({ success: true, message: 'Topping dinonaktifkan' });
  } catch (err) {
    next(err);
  }
};
