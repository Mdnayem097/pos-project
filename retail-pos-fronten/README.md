# Retail POS (frontend only)

Next.js (App Router) + TypeScript + Tailwind CSS. All data is dummy data in `src/lib/data.ts`.
Brand color is orange (`brand-*` in `tailwind.config.ts`).

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Pages

| Route        | What it shows                                              |
| ------------ | ---------------------------------------------------------- |
| `/`          | Dashboard: stats, weekly sales, top products, low stock    |
| `/pos`       | POS terminal: product grid, cart, discount, VAT, payment   |
| `/products`  | Product table with search and category filter              |
| `/inventory` | Stock levels, reorder alerts                               |
| `/sales`     | Order history                                              |
| `/customers` | Customer cards with loyalty points                         |

## Notes

- Currency is BDT (৳). Change it in `src/lib/format.ts`.
- Cart and checkout live in client state only; nothing is saved.
- The sidebar is hidden below the `lg` breakpoint (no mobile menu yet).
