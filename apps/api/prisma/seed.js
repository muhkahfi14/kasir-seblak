import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 [DEMO DATA] Memulai seeding data awal Kasir Seblak Prasmanan...');

  // 1. Store Settings
  console.log('🌱 [DEMO DATA] Membuat / memperbarui pengaturan toko (StoreSettings)...');
  const storeSettings = await prisma.storeSettings.upsert({
    where: { id: 'store-settings-default' },
    update: {
      name: 'Seblak Prasmanan Juara',
      address: 'Jl. Seblak Pedas Nikmat No. 99, Bandung',
      phone: '081234567890',
      timezone: 'Asia/Jakarta',
      enableDiscount: true
    },
    create: {
      id: 'store-settings-default',
      name: 'Seblak Prasmanan Juara',
      address: 'Jl. Seblak Pedas Nikmat No. 99, Bandung',
      phone: '081234567890',
      timezone: 'Asia/Jakarta',
      enableDiscount: true
    }
  });
  console.log(`✅ [DEMO DATA] StoreSettings: "${storeSettings.name}"`);

  // 2. Users
  console.log('🌱 [DEMO DATA] Menyiapkan pengguna (User)...');
  const ownerPassword = await bcrypt.hash(
    process.env.SEED_OWNER_PASSWORD || 'owner123',
    10
  );
  const cashierPassword = await bcrypt.hash(
    process.env.SEED_CASHIER_PASSWORD || 'kasir123',
    10
  );

  const ownerUser = await prisma.user.upsert({
    where: { email: 'owner@seblak.com' },
    update: {
      name: 'Owner Seblak',
      passwordHash: ownerPassword,
      role: 'OWNER',
      isActive: true
    },
    create: {
      email: 'owner@seblak.com',
      name: 'Owner Seblak',
      passwordHash: ownerPassword,
      role: 'OWNER',
      isActive: true
    }
  });
  console.log(`✅ [DEMO DATA] User Owner: ${ownerUser.email} (${ownerUser.role})`);

  const cashierUser = await prisma.user.upsert({
    where: { email: 'kasir@seblak.com' },
    update: {
      name: 'Kasir Seblak',
      passwordHash: cashierPassword,
      role: 'CASHIER',
      isActive: true
    },
    create: {
      email: 'kasir@seblak.com',
      name: 'Kasir Seblak',
      passwordHash: cashierPassword,
      role: 'CASHIER',
      isActive: true
    }
  });
  console.log(`✅ [DEMO DATA] User Cashier: ${cashierUser.email} (${cashierUser.role})`);

  // 3. Menu Categories
  console.log('🌱 [DEMO DATA] Menyiapkan kategori menu (MenuCategory)...');
  const catSeblak = await prisma.menuCategory.upsert({
    where: { id: 'cat-seblak' },
    update: { name: 'Seblak', sortOrder: 1, isActive: true },
    create: { id: 'cat-seblak', name: 'Seblak', sortOrder: 1, isActive: true }
  });

  const catMinuman = await prisma.menuCategory.upsert({
    where: { id: 'cat-minuman' },
    update: { name: 'Minuman', sortOrder: 2, isActive: true },
    create: { id: 'cat-minuman', name: 'Minuman', sortOrder: 2, isActive: true }
  });
  console.log(`✅ [DEMO DATA] MenuCategory: ${catSeblak.name}, ${catMinuman.name}`);

  // 4. Menu Items
  console.log('🌱 [DEMO DATA] Menyiapkan menu (MenuItem)...');
  const menuItemsData = [
    {
      sku: 'SEBLAK-REG',
      name: 'Seblak Reguler',
      categoryId: catSeblak.id,
      basePrice: 10000,
      description: 'Seblak porsi standar dengan kuah gurih pedas khas Bandung'
    },
    {
      sku: 'SEBLAK-JUMBO',
      name: 'Seblak Jumbo',
      categoryId: catSeblak.id,
      basePrice: 15000,
      description: 'Seblak porsi besar memuaskan dengan kuah rempah berlimpah'
    },
    {
      sku: 'MINUMAN-ESTEH',
      name: 'Es Teh',
      categoryId: catMinuman.id,
      basePrice: 5000,
      description: 'Es teh manis segar pelepas dahaga'
    },
    {
      sku: 'MINUMAN-ESJERUK',
      name: 'Es Jeruk',
      categoryId: catMinuman.id,
      basePrice: 7000,
      description: 'Es jeruk peras segar alami'
    }
  ];

  const menuItemsMap = {};
  for (const item of menuItemsData) {
    const createdItem = await prisma.menuItem.upsert({
      where: { sku: item.sku },
      update: {
        name: item.name,
        categoryId: item.categoryId,
        basePrice: item.basePrice,
        description: item.description,
        isActive: true
      },
      create: {
        sku: item.sku,
        name: item.name,
        categoryId: item.categoryId,
        basePrice: item.basePrice,
        description: item.description,
        isActive: true
      }
    });
    menuItemsMap[item.sku] = createdItem;
    console.log(`✅ [DEMO DATA] MenuItem: ${createdItem.name} (Rp ${item.basePrice})`);
  }

  // 5. Ingredients
  console.log('🌱 [DEMO DATA] Menyiapkan bahan baku (Ingredient)...');
  const ingredientsData = [
    { id: 'ing-kerupuk', name: 'Kerupuk', category: 'Bahan Utama', unit: 'gram', stock: 5000, minStock: 500, avgCost: 30 },
    { id: 'ing-mie', name: 'Mie', category: 'Bahan Utama', unit: 'gram', stock: 3000, minStock: 300, avgCost: 25 },
    { id: 'ing-telur', name: 'Telur', category: 'Topping & Protein', unit: 'buah', stock: 100, minStock: 10, avgCost: 2500 },
    { id: 'ing-bakso', name: 'Bakso', category: 'Topping & Protein', unit: 'buah', stock: 200, minStock: 20, avgCost: 1500 },
    { id: 'ing-sosis', name: 'Sosis', category: 'Topping & Protein', unit: 'buah', stock: 150, minStock: 15, avgCost: 2000 },
    { id: 'ing-ceker', name: 'Ceker', category: 'Topping & Protein', unit: 'buah', stock: 80, minStock: 10, avgCost: 3000 },
    { id: 'ing-sayuran', name: 'Sayuran', category: 'Sayuran', unit: 'gram', stock: 5000, minStock: 500, avgCost: 15 },
    { id: 'ing-bumbu', name: 'Bumbu', category: 'Bumbu & Rempah', unit: 'gram', stock: 2000, minStock: 200, avgCost: 50 },
    { id: 'ing-cabai', name: 'Cabai', category: 'Bumbu & Rempah', unit: 'gram', stock: 1000, minStock: 100, avgCost: 80 },
    { id: 'ing-minyak', name: 'Minyak', category: 'Bumbu & Rempah', unit: 'ml', stock: 5000, minStock: 500, avgCost: 20 },
    { id: 'ing-gas', name: 'Gas', category: 'Operasional', unit: 'unit', stock: 10, minStock: 1, avgCost: 25000 },
    { id: 'ing-kemasan', name: 'Kemasan', category: 'Operasional', unit: 'buah', stock: 500, minStock: 50, avgCost: 500 },
    { id: 'ing-keju', name: 'Keju', category: 'Topping & Protein', unit: 'gram', stock: 500, minStock: 50, avgCost: 150 },
    { id: 'ing-dumpling', name: 'Dumpling', category: 'Topping & Protein', unit: 'buah', stock: 100, minStock: 10, avgCost: 3500 }
  ];

  for (const ing of ingredientsData) {
    await prisma.ingredient.upsert({
      where: { id: ing.id },
      update: {
        name: ing.name,
        category: ing.category,
        unit: ing.unit,
        stock: ing.stock,
        minStock: ing.minStock,
        avgCost: ing.avgCost,
        isActive: true
      },
      create: {
        id: ing.id,
        name: ing.name,
        category: ing.category,
        unit: ing.unit,
        stock: ing.stock,
        minStock: ing.minStock,
        avgCost: ing.avgCost,
        isActive: true
      }
    });
    console.log(`✅ [DEMO DATA] Ingredient: ${ing.name} (Stock: ${ing.stock} ${ing.unit})`);
  }

  // 6. Toppings
  console.log('🌱 [DEMO DATA] Menyiapkan topping (Topping)...');
  const toppingsData = [
    { id: 'top-telur', name: 'Telur', price: 3000, unit: 'buah', categoryId: catSeblak.id },
    { id: 'top-sosis', name: 'Sosis', price: 2000, unit: 'buah', categoryId: catSeblak.id },
    { id: 'top-bakso', name: 'Bakso', price: 2500, unit: 'buah', categoryId: catSeblak.id },
    { id: 'top-ceker', name: 'Ceker', price: 4000, unit: 'buah', categoryId: catSeblak.id },
    { id: 'top-kerupuk', name: 'Kerupuk', price: 1000, unit: 'porsi', categoryId: catSeblak.id },
    { id: 'top-mie', name: 'Mie', price: 1500, unit: 'porsi', categoryId: catSeblak.id },
    { id: 'top-sayuran', name: 'Sayuran', price: 1000, unit: 'porsi', categoryId: catSeblak.id },
    { id: 'top-keju', name: 'Keju', price: 5000, unit: 'porsi', categoryId: catSeblak.id },
    { id: 'top-dumpling', name: 'Dumpling', price: 3500, unit: 'buah', categoryId: catSeblak.id }
  ];

  for (const top of toppingsData) {
    await prisma.topping.upsert({
      where: { id: top.id },
      update: {
        name: top.name,
        price: top.price,
        unit: top.unit,
        categoryId: top.categoryId,
        isActive: true
      },
      create: {
        id: top.id,
        name: top.name,
        price: top.price,
        unit: top.unit,
        categoryId: top.categoryId,
        isActive: true
      }
    });
    console.log(`✅ [DEMO DATA] Topping: ${top.name} (Rp ${top.price} / ${top.unit})`);
  }

  // 7. Menu Recipes
  console.log('🌱 [DEMO DATA] Menyiapkan resep menu (MenuRecipe)...');
  const menuRecipesData = [
    // Seblak Reguler: 50g kerupuk, 30g mie, 100g sayuran, 15g bumbu, 10g cabai, 20ml minyak
    { menuItemId: menuItemsMap['SEBLAK-REG'].id, ingredientId: 'ing-kerupuk', quantity: 50, unit: 'gram' },
    { menuItemId: menuItemsMap['SEBLAK-REG'].id, ingredientId: 'ing-mie', quantity: 30, unit: 'gram' },
    { menuItemId: menuItemsMap['SEBLAK-REG'].id, ingredientId: 'ing-sayuran', quantity: 100, unit: 'gram' },
    { menuItemId: menuItemsMap['SEBLAK-REG'].id, ingredientId: 'ing-bumbu', quantity: 15, unit: 'gram' },
    { menuItemId: menuItemsMap['SEBLAK-REG'].id, ingredientId: 'ing-cabai', quantity: 10, unit: 'gram' },
    { menuItemId: menuItemsMap['SEBLAK-REG'].id, ingredientId: 'ing-minyak', quantity: 20, unit: 'ml' },
    // Seblak Jumbo: 80g kerupuk, 50g mie, 150g sayuran, 20g bumbu, 15g cabai, 30ml minyak
    { menuItemId: menuItemsMap['SEBLAK-JUMBO'].id, ingredientId: 'ing-kerupuk', quantity: 80, unit: 'gram' },
    { menuItemId: menuItemsMap['SEBLAK-JUMBO'].id, ingredientId: 'ing-mie', quantity: 50, unit: 'gram' },
    { menuItemId: menuItemsMap['SEBLAK-JUMBO'].id, ingredientId: 'ing-sayuran', quantity: 150, unit: 'gram' },
    { menuItemId: menuItemsMap['SEBLAK-JUMBO'].id, ingredientId: 'ing-bumbu', quantity: 20, unit: 'gram' },
    { menuItemId: menuItemsMap['SEBLAK-JUMBO'].id, ingredientId: 'ing-cabai', quantity: 15, unit: 'gram' },
    { menuItemId: menuItemsMap['SEBLAK-JUMBO'].id, ingredientId: 'ing-minyak', quantity: 30, unit: 'ml' }
  ];

  for (const recipe of menuRecipesData) {
    await prisma.menuRecipe.upsert({
      where: {
        menuItemId_ingredientId: {
          menuItemId: recipe.menuItemId,
          ingredientId: recipe.ingredientId
        }
      },
      update: {
        quantity: recipe.quantity,
        unit: recipe.unit
      },
      create: {
        menuItemId: recipe.menuItemId,
        ingredientId: recipe.ingredientId,
        quantity: recipe.quantity,
        unit: recipe.unit
      }
    });
  }
  console.log(`✅ [DEMO DATA] Berhasil menambahkan ${menuRecipesData.length} relasi resep menu`);

  // 8. Topping Recipes
  // Telur=1 buah telur, Sosis=1 buah sosis, Bakso=1 buah bakso, Ceker=1 buah ceker,
  // Kerupuk=30g kerupuk, Mie=20g mie, Sayuran=50g sayuran, Keju=20g keju, Dumpling=1 buah dumpling
  console.log('🌱 [DEMO DATA] Menyiapkan resep topping (ToppingRecipe)...');
  const toppingRecipesData = [
    { toppingId: 'top-telur', ingredientId: 'ing-telur', quantity: 1, unit: 'buah' },
    { toppingId: 'top-sosis', ingredientId: 'ing-sosis', quantity: 1, unit: 'buah' },
    { toppingId: 'top-bakso', ingredientId: 'ing-bakso', quantity: 1, unit: 'buah' },
    { toppingId: 'top-ceker', ingredientId: 'ing-ceker', quantity: 1, unit: 'buah' },
    { toppingId: 'top-kerupuk', ingredientId: 'ing-kerupuk', quantity: 30, unit: 'gram' },
    { toppingId: 'top-mie', ingredientId: 'ing-mie', quantity: 20, unit: 'gram' },
    { toppingId: 'top-sayuran', ingredientId: 'ing-sayuran', quantity: 50, unit: 'gram' },
    { toppingId: 'top-keju', ingredientId: 'ing-keju', quantity: 20, unit: 'gram' },
    { toppingId: 'top-dumpling', ingredientId: 'ing-dumpling', quantity: 1, unit: 'buah' }
  ];

  for (const recipe of toppingRecipesData) {
    await prisma.toppingRecipe.upsert({
      where: {
        toppingId_ingredientId: {
          toppingId: recipe.toppingId,
          ingredientId: recipe.ingredientId
        }
      },
      update: {
        quantity: recipe.quantity,
        unit: recipe.unit
      },
      create: {
        toppingId: recipe.toppingId,
        ingredientId: recipe.ingredientId,
        quantity: recipe.quantity,
        unit: recipe.unit
      }
    });
  }
  console.log(`✅ [DEMO DATA] Berhasil menambahkan ${toppingRecipesData.length} relasi resep topping`);

  // 9. Supplier
  console.log('🌱 [DEMO DATA] Menyiapkan supplier (Supplier)...');
  const supplier = await prisma.supplier.upsert({
    where: { id: 'sup-pasar-tradisional' },
    update: {
      name: 'Pasar Tradisional',
      phone: '081298765432',
      address: 'Pasar Induk Gedebage, Bandung',
      isActive: true
    },
    create: {
      id: 'sup-pasar-tradisional',
      name: 'Pasar Tradisional',
      phone: '081298765432',
      address: 'Pasar Induk Gedebage, Bandung',
      isActive: true
    }
  });
  console.log(`✅ [DEMO DATA] Supplier: ${supplier.name} (${supplier.phone})`);

  console.log('✨ [DEMO DATA] Seeding data demo Kasir Seblak selesai dengan sukses!');
}

main()
  .catch((e) => {
    console.error('❌ Gagal menjalankan seeding demo data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
