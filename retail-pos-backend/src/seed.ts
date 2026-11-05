import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from './app.module';
import { Category } from './categories/category.entity';
import { Customer } from './customers/customer.entity';
import { Product } from './products/product.entity';
import { Sale, SaleItem } from './sales/sale.entity';

// [sku, name, category, price, cost, stock, reorderLevel, emoji]
const productRows: [string, string, string, number, number, number, number, string][] = [
  ['GRC-001', 'Miniket Rice 5kg', 'Grocery', 380, 330, 64, 20, '🍚'],
  ['GRC-002', 'Soybean Oil 1L', 'Grocery', 185, 165, 12, 25, '🛢️'],
  ['GRC-003', 'Red Lentil (Masur) 1kg', 'Grocery', 140, 118, 48, 20, '🫘'],
  ['GRC-004', 'Iodized Salt 1kg', 'Grocery', 45, 36, 90, 30, '🧂'],
  ['BEV-001', 'Mango Juice 1L', 'Beverages', 110, 82, 35, 15, '🥭'],
  ['BEV-002', 'Mineral Water 2L', 'Beverages', 40, 28, 8, 30, '💧'],
  ['BEV-003', 'Cola 750ml', 'Beverages', 65, 50, 72, 25, '🥤'],
  ['BEV-004', 'Black Tea 400g', 'Beverages', 220, 185, 27, 10, '🍵'],
  ['SNK-001', 'Potato Chips 60g', 'Snacks', 30, 22, 120, 40, '🥔'],
  ['SNK-002', 'Chocolate Biscuit', 'Snacks', 55, 41, 58, 20, '🍪'],
  ['SNK-003', 'Instant Noodles 5pk', 'Snacks', 95, 74, 6, 20, '🍜'],
  ['DAI-001', 'Full Cream Milk 1L', 'Dairy', 95, 80, 40, 20, '🥛'],
  ['DAI-002', 'Butter 200g', 'Dairy', 260, 215, 18, 10, '🧈'],
  ['PCR-001', 'Herbal Soap 100g', 'Personal Care', 50, 36, 85, 30, '🧼'],
  ['PCR-002', 'Shampoo 340ml', 'Personal Care', 320, 255, 22, 12, '🧴'],
  ['HSH-001', 'Dish Wash Liquid 500ml', 'Household', 130, 98, 30, 15, '🫧'],
  ['HSH-002', 'Detergent Powder 1kg', 'Household', 175, 140, 4, 15, '🧺'],
  ['HSH-003', 'Toilet Tissue 4pk', 'Household', 150, 115, 44, 15, '🧻'],
];

const customerRows: [string, string, string, number][] = [
  ['Rahim Uddin', '01711-000111', 'rahim@example.com', 482],
  ['Nusrat Jahan', '01819-222333', 'nusrat@example.com', 367],
  ['Karim Hossain', '01915-444555', 'karim@example.com', 154],
  ['Sadia Islam', '01611-666777', 'sadia@example.com', 713],
  ['Tanvir Ahmed', '01511-888999', 'tanvir@example.com', 68],
  ['Farhana Akter', '01311-123456', 'farhana@example.com', 289],
  ['Imran Khan', '01711-654321', 'imran@example.com', 112],
  ['Mitu Rani', '01811-987654', 'mitu@example.com', 421],
];

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  const categories = app.get<Repository<Category>>(getRepositoryToken(Category));
  const products = app.get<Repository<Product>>(getRepositoryToken(Product));
  const customers = app.get<Repository<Customer>>(getRepositoryToken(Customer));

  if ((await products.count()) > 0) {
    console.log('Database already has products. Seed skipped.');
    await app.close();
    return;
  }

  const names = [...new Set(productRows.map((r) => r[2]))];
  const savedCategories = await categories.save(names.map((name) => categories.create({ name })));
  const byName = new Map(savedCategories.map((c) => [c.name, c]));

  await products.save(
    productRows.map(([sku, name, category, price, cost, stock, reorderLevel, emoji]) =>
      products.create({ sku, name, category: byName.get(category), price, cost, stock, reorderLevel, emoji }),
    ),
  );

  await customers.save(
    customerRows.map(([name, phone, email, loyaltyPoints]) =>
      customers.create({ name, phone, email, loyaltyPoints }),
    ),
  );

  console.log(
    `Seeded ${savedCategories.length} categories, ${productRows.length} products, ${customerRows.length} customers.`,
  );

  const salesRepo = app.get<Repository<Sale>>(getRepositoryToken(Sale));
  const saleItemRepo = app.get<Repository<SaleItem>>(getRepositoryToken(SaleItem));

  if ((await salesRepo.count()) === 0) {
    const allProducts = await products.find();
    const p1 = allProducts[0];
    const p2 = allProducts[1];

    const sampleOrders = [
      { id: 24, name: 'Sourov Kumar', email: 'guest_0196613028@guest.shopypos.local', source: 'Website', payment: 'COD', total: 1450, status: 'New' },
      { id: 25, name: 'Walk in customer', email: 'walkincustomer@gmail.com', source: 'POS', payment: 'Cash', total: 2040, status: 'Delivered' },
      { id: 26, name: 'sharif', email: 'guest_01724809116@guest.shopypos.local', source: 'Website', payment: 'COD', total: 1790, status: 'New' },
      { id: 27, name: 'Walk in customer', email: 'walkincustomer@gmail.com', source: 'POS', payment: 'Cash', total: 1499, status: 'Delivered' },
      { id: 28, name: 'Walk in customer', email: 'walkincustomer@gmail.com', source: 'POS', payment: 'bKash', total: 21500, status: 'Delivered' },
      { id: 29, name: 'Walk in customer', email: 'walkincustomer@gmail.com', source: 'POS', payment: 'Card', total: 2499, status: 'Delivered' },
      { id: 30, name: 'Walk in customer', email: 'walkincustomer@gmail.com', source: 'POS', payment: 'Cash', total: 2950, status: 'Delivered' },
      { id: 31, name: 'Walk in customer', email: 'walkincustomer@gmail.com', source: 'POS', payment: 'Cash', total: 7000, status: 'Delivered' },
      { id: 32, name: 'Walk in customer', email: 'walkincustomer@gmail.com', source: 'POS', payment: 'Cash', total: 1300, status: 'Delivered' },
      { id: 33, name: 'Walk in customer', email: 'walkincustomer@gmail.com', source: 'POS', payment: 'Cash', total: 3900, status: 'Delivered' },
    ];

    for (const o of sampleOrders) {
      const subtotal = Math.round((o.total / 1.05) * 100) / 100;
      const vat = Math.round((o.total - subtotal) * 100) / 100;
      const sale = await salesRepo.save(
        salesRepo.create({
          invoiceNo: `INV-10${o.id}`,
          customer: null,
          customerName: o.name,
          customerEmail: o.email,
          source: o.source,
          payment: o.payment,
          status: o.status,
          subtotal,
          discount: 0,
          vat,
          total: o.total,
        }),
      );
      if (p1 && p2) {
        await saleItemRepo.save([
          saleItemRepo.create({ sale, product: p1, qty: 2, unitPrice: p1.price }),
          saleItemRepo.create({ sale, product: p2, qty: 1, unitPrice: p2.price }),
        ]);
      }
    }
    console.log(`Seeded ${sampleOrders.length} sample orders.`);
  }

  await app.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
