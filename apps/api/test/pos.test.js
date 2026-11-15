import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import ExcelJS from 'exceljs';
import app from '../src/app.js';
import prisma from '../src/config/database.js';

const binaryParser = (res, callback) => {
  const chunks = [];
  res.on('data', (chunk) => chunks.push(chunk));
  res.on('end', () => callback(null, Buffer.concat(chunks)));
};

describe('POS payment recording: CASH & QRIS', () => {
  let ownerCookie;
  let toppingsList = [];
  let menuList = [];
  let kerupukTopping;

  let cashSale;
  let qrisSale;
  let cashRequestId;
  let qrisRequestId;
  let kerupukStockBeforeCash;
  let kerupukStockBeforeQris;

  const getKerupukStock = async () => {
    const res = await request(app)
      .get('/api/v1/ingredients')
      .set('Cookie', ownerCookie);

    const kerupuk = (res.body.data || []).find((ingredient) => ingredient.id === 'ing-kerupuk');
    return kerupuk ? parseFloat(kerupuk.stock) : null;
  };

  const buildSalePayload = (paymentMethod, extra = {}) => ({
    customerName: `Pelanggan ${paymentMethod}`,
    paymentMethod,
    items: [
      {
        type: 'SEBLAK',
        name: 'Porsi Seblak Test',
        basePrice: 8000,
        spiceLevel: 2,
        broth: 'Original Kencur',
        toppings: [
          {
            toppingId: kerupukTopping.id,
            qty: 1,
            price: parseFloat(kerupukTopping.price),
          },
        ],
      },
    ],
    ...extra,
  });

  beforeAll(async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'owner@seblak.com', password: 'owner123' });
    ownerCookie = login.headers['set-cookie'];

    const [toppingsRes, menuRes] = await Promise.all([
      request(app).get('/api/v1/toppings').set('Cookie', ownerCookie),
      request(app).get('/api/v1/menu/items').set('Cookie', ownerCookie),
    ]);

    toppingsList = toppingsRes.body.data || [];
    menuList = menuRes.body.data || [];
    kerupukTopping =
      toppingsList.find((topping) => topping.name.toLowerCase() === 'kerupuk') ||
      toppingsList[0];
  });

  it('returns active toppings and menu items', () => {
    expect(toppingsList.length).toBeGreaterThan(0);
    expect(menuList.length).toBeGreaterThan(0);
    expect(kerupukTopping).toBeTruthy();
  });

  it('rejects CASH when received amount is less than the bill', async () => {
    const res = await request(app)
      .post('/api/v1/sales')
      .set('Cookie', ownerCookie)
      .send(
        buildSalePayload('CASH', {
          cashTendered: 5000,
          clientRequestId: `invalid-cash-${Date.now()}`,
        })
      );

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message.toLowerCase()).toContain('kurang');
  });

  it('records CASH, calculates change, deducts stock, and prevents duplicate payment', async () => {
    kerupukStockBeforeCash = await getKerupukStock();
    cashRequestId = `test-cash-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const res = await request(app)
      .post('/api/v1/sales')
      .set('Cookie', ownerCookie)
      .send(
        buildSalePayload('CASH', {
          cashTendered: 50000,
          clientRequestId: cashRequestId,
        })
      );

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('COMPLETED');
    expect(res.body.data.saleNumber).toMatch(/^INV-/);
    expect(res.body.data.invoiceNumber).toBe(res.body.data.saleNumber);
    expect(parseFloat(res.body.data.totalHpp)).toBeGreaterThan(0);

    cashSale = res.body.data;
    const total = parseFloat(cashSale.totalAmount);

    expect(cashSale.payment.paymentMethod).toBe('CASH');
    expect(cashSale.payment.status).toBe('PAID');
    expect(parseFloat(cashSale.payment.amount)).toBe(total);
    expect(parseFloat(cashSale.payment.amountReceived)).toBe(50000);
    expect(parseFloat(cashSale.payment.changeAmount)).toBe(50000 - total);
    expect(cashSale.payment.cashier.name).toBe('Owner Seblak');

    const stockAfter = await getKerupukStock();
    expect(stockAfter).toBeLessThan(kerupukStockBeforeCash);

    const movementsRes = await request(app)
      .get('/api/v1/ingredients/movements?ingredientId=ing-kerupuk&limit=100')
      .set('Cookie', ownerCookie);

    const saleMovement = (movementsRes.body.data || []).find(
      (movement) => movement.referenceId === cashSale.id && movement.type === 'SALE'
    );
    expect(saleMovement).toBeTruthy();
    expect(parseFloat(saleMovement.quantity)).toBeGreaterThan(0);
    expect(kerupukStockBeforeCash - stockAfter).toBeCloseTo(parseFloat(saleMovement.quantity), 2);

    // Re-sending the same checkout request must return the original sale, not a second payment.
    const duplicateRes = await request(app)
      .post('/api/v1/sales')
      .set('Cookie', ownerCookie)
      .send(
        buildSalePayload('CASH', {
          cashTendered: 50000,
          clientRequestId: cashRequestId,
        })
      );

    expect(duplicateRes.status).toBe(200);
    expect(duplicateRes.body.duplicate).toBe(true);
    expect(duplicateRes.body.data.id).toBe(cashSale.id);

    const detailRes = await request(app)
      .get(`/api/v1/sales/${cashSale.id}`)
      .set('Cookie', ownerCookie);

    expect(detailRes.status).toBe(200);
    expect(detailRes.body.data.payment.id).toBe(cashSale.payment.id);
    expect(detailRes.body.data.payment.paymentMethod).toBe('CASH');
  });

  it('requires manual QRIS confirmation', async () => {
    const res = await request(app)
      .post('/api/v1/sales')
      .set('Cookie', ownerCookie)
      .send(
        buildSalePayload('QRIS', {
          clientRequestId: `invalid-qris-${Date.now()}`,
        })
      );

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message.toLowerCase()).toContain('konfirmasi');
  });

  it('records QRIS without amount received, deducts stock, and sets PAID', async () => {
    kerupukStockBeforeQris = await getKerupukStock();
    qrisRequestId = `test-qris-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const res = await request(app)
      .post('/api/v1/sales')
      .set('Cookie', ownerCookie)
      .send(
        buildSalePayload('QRIS', {
          qrisConfirmed: true,
          // Sent deliberately to prove QRIS ignores cash fields.
          cashTendered: 999999,
          clientRequestId: qrisRequestId,
        })
      );

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('COMPLETED');

    qrisSale = res.body.data;
    expect(qrisSale.payment.paymentMethod).toBe('QRIS');
    expect(qrisSale.payment.status).toBe('PAID');
    expect(qrisSale.payment.amountReceived).toBeNull();
    expect(qrisSale.payment.changeAmount).toBeNull();
    expect(parseFloat(qrisSale.payment.amount)).toBe(parseFloat(qrisSale.totalAmount));

    const stockAfter = await getKerupukStock();
    expect(stockAfter).toBeLessThan(kerupukStockBeforeQris);

    const movementsRes = await request(app)
      .get('/api/v1/ingredients/movements?ingredientId=ing-kerupuk&limit=100')
      .set('Cookie', ownerCookie);

    const saleMovement = (movementsRes.body.data || []).find(
      (movement) => movement.referenceId === qrisSale.id && movement.type === 'SALE'
    );
    expect(saleMovement).toBeTruthy();
    expect(parseFloat(saleMovement.quantity)).toBeGreaterThan(0);
    expect(kerupukStockBeforeQris - stockAfter).toBeCloseTo(
      parseFloat(saleMovement.quantity),
      2
    );

    const duplicateRes = await request(app)
      .post('/api/v1/sales')
      .set('Cookie', ownerCookie)
      .send(
        buildSalePayload('QRIS', {
          qrisConfirmed: true,
          clientRequestId: qrisRequestId,
        })
      );

    expect(duplicateRes.status).toBe(200);
    expect(duplicateRes.body.duplicate).toBe(true);
    expect(duplicateRes.body.data.id).toBe(qrisSale.id);
  });

  it('separates CASH and QRIS totals, counts, and percentages on the dashboard', async () => {
    const res = await request(app)
      .get('/api/v1/reports/dashboard?period=today')
      .set('Cookie', ownerCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { summary, paymentBreakdown } = res.body.data;
    const cash = paymentBreakdown.methods.find((item) => item.method === 'CASH');
    const qris = paymentBreakdown.methods.find((item) => item.method === 'QRIS');

    expect(cash).toBeTruthy();
    expect(qris).toBeTruthy();
    expect(cash.count).toBeGreaterThanOrEqual(1);
    expect(qris.count).toBeGreaterThanOrEqual(1);
    expect(cash.total).toBeGreaterThanOrEqual(parseFloat(cashSale.totalAmount));
    expect(qris.total).toBeGreaterThanOrEqual(parseFloat(qrisSale.totalAmount));
    expect(summary.cashRevenue).toBe(cash.total);
    expect(summary.qrisRevenue).toBe(qris.total);
    expect(summary.cashTransactions).toBe(cash.count);
    expect(summary.qrisTransactions).toBe(qris.count);
    expect(cash.percentage + qris.percentage).toBeCloseTo(100, 0);
    expect(summary.omzet).toBeGreaterThanOrEqual(
      parseFloat(cashSale.totalAmount) + parseFloat(qrisSale.totalAmount)
    );
  });

  it('filters profit/loss report by payment method and only counts PAID payments', async () => {
    const cashRes = await request(app)
      .get('/api/v1/reports/pnl?paymentMethod=CASH')
      .set('Cookie', ownerCookie);

    expect(cashRes.status).toBe(200);
    expect(cashRes.body.data.paymentMethodFilter).toBe('CASH');
    expect(cashRes.body.data.revenue).toBeGreaterThanOrEqual(
      parseFloat(cashSale.totalAmount)
    );

    const cashMethod = cashRes.body.data.paymentBreakdown.methods.find(
      (item) => item.method === 'CASH'
    );
    const qrisMethod = cashRes.body.data.paymentBreakdown.methods.find(
      (item) => item.method === 'QRIS'
    );

    expect(cashMethod.count).toBeGreaterThanOrEqual(1);
    expect(qrisMethod.count).toBe(0);
    expect(qrisMethod.total).toBe(0);

    const qrisRes = await request(app)
      .get('/api/v1/reports/pnl?paymentMethod=QRIS')
      .set('Cookie', ownerCookie);

    expect(qrisRes.status).toBe(200);
    expect(qrisRes.body.data.revenue).toBeGreaterThanOrEqual(
      parseFloat(qrisSale.totalAmount)
    );
    expect(
      qrisRes.body.data.paymentBreakdown.methods.find((item) => item.method === 'CASH').count
    ).toBe(0);
  });

  it('exports sales Excel with a payment method column', async () => {
    const res = await request(app)
      .get('/api/v1/reports/export/sales?paymentMethod=CASH')
      .set('Cookie', ownerCookie)
      .buffer(true)
      .parse(binaryParser);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('spreadsheetml');

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(res.body);
    const worksheet = workbook.getWorksheet('Laporan Penjualan');

    const headerValues = worksheet.getRow(1).values;
    expect(headerValues).toContain('Metode Pembayaran');

    const methodColumnIndex = headerValues.indexOf('Metode Pembayaran');
    const methods = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) methods.push(row.getCell(methodColumnIndex).value);
    });

    expect(methods.length).toBeGreaterThan(0);
    expect(methods.every((method) => method === 'CASH')).toBe(true);
  });

  it('keeps cancelled transactions with audit history and restores stock', async () => {
    const stockBeforeCancel = await getKerupukStock();
    const dashboardBeforeCancel = await request(app)
      .get('/api/v1/reports/dashboard?period=today')
      .set('Cookie', ownerCookie);
    const qrisBeforeCancel = dashboardBeforeCancel.body.data.paymentBreakdown.methods.find(
      (item) => item.method === 'QRIS'
    );

    const res = await request(app)
      .post(`/api/v1/sales/${qrisSale.id}/cancel`)
      .set('Cookie', ownerCookie)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('CANCELLED');
    expect(res.body.data.payment.status).toBe('CANCELLED');

    const stockAfterCancel = await getKerupukStock();
    expect(stockAfterCancel).toBeGreaterThan(stockBeforeCancel);

    const audit = await prisma.auditLog.findFirst({
      where: {
        entity: 'Sale',
        entityId: qrisSale.id,
        action: 'SALE_CANCELLED',
      },
      orderBy: { createdAt: 'desc' },
    });
    expect(audit).toBeTruthy();

    const detailRes = await request(app)
      .get(`/api/v1/sales/${qrisSale.id}`)
      .set('Cookie', ownerCookie);
    expect(detailRes.body.data.status).toBe('CANCELLED');
    expect(detailRes.body.data.payment.status).toBe('CANCELLED');

    const dashboardRes = await request(app)
      .get('/api/v1/reports/dashboard?period=today')
      .set('Cookie', ownerCookie);

    const qris = dashboardRes.body.data.paymentBreakdown.methods.find(
      (item) => item.method === 'QRIS'
    );
    expect(qris.count).toBe(qrisBeforeCancel.count - 1);
    expect(qris.total).toBeCloseTo(
      qrisBeforeCancel.total - parseFloat(qrisSale.totalAmount),
      2
    );
  });
});
