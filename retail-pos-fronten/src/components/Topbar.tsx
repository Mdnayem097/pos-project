import Link from "next/link";
import { Bell, Search, ShoppingCart, Store } from "lucide-react";

export default function Topbar() {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-stone-200 bg-stone-100/85 px-3 py-3 backdrop-blur sm:px-4 lg:px-[25px]">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-500 text-stone-950 lg:hidden">
        <Store size={19} strokeWidth={2.4} />
      </span>

      <div className="relative max-w-md flex-1">
        <Search
          size={17}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
        />
        <input
          type="search"
          aria-label="Search"
          placeholder="Search products, invoices, customers"
          className="input pl-10"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span className="hidden items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-600 md:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Counter 1 open
        </span>
        <Link href="/pos" className="btn-primary">
          <ShoppingCart size={17} />
          <span className="hidden sm:inline">New sale</span>
        </Link>
        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-lg border border-stone-300 bg-white p-2.5 text-stone-600 transition hover:bg-stone-50"
        >
          <Bell size={17} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-500" />
        </button>
      </div>
    </header>
  );
}
