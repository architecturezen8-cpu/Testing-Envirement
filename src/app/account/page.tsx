import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getUserSession } from "@/lib/user-auth";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-stone-100 text-stone-700",
  processing: "bg-amber-100 text-amber-700",
  shipped: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default async function AccountPage() {
  const user = await getUserSession();
  if (!user) redirect("/account/login");

  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, user.id))
    .orderBy(desc(orders.createdAt));

  // Get all order items for these orders
  const orderIds = userOrders.map((o) => o.id);
  const allItems = orderIds.length
    ? await db.select().from(orderItems)
    : [];

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-12 lg:px-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-luxe text-bronze">My account</p>
          <h1 className="mt-2 font-serif text-4xl font-light text-ink">
            Hello, {user.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-stone-500">{user.email}</p>
        </div>
        <Link
          href="/track"
          className="rounded-full border border-ink/15 px-6 py-3 text-xs font-medium uppercase tracking-wide-2 text-ink transition-colors hover:bg-ink hover:text-paper"
        >
          Track an order
        </Link>
      </div>

      <div className="mt-10">
        <h2 className="mb-6 font-serif text-2xl text-ink">Order history</h2>

        {userOrders.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-ink/20 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cream text-stone-400">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M6 7h12l-1 13H7L6 7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /><path d="M9 11v-1a3 3 0 016 0v1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
            </div>
            <div>
              <p className="font-serif text-xl text-ink">No orders yet</p>
              <p className="mt-1 text-sm text-stone-500">Your orders will appear here once you make a purchase.</p>
            </div>
            <Link href="/shop" className="mt-2 rounded-full bg-ink px-8 py-4 text-xs uppercase tracking-wide-2 text-paper transition-colors hover:bg-bronze">
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {userOrders.map((order) => {
              const items = allItems.filter((i) => i.orderId === order.id);
              return (
                <div
                  key={order.id}
                  className="rounded-2xl border border-ink/10 bg-paper p-6"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="font-serif text-lg text-ink">{order.number}</p>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide-2 ${STATUS_STYLES[order.status ?? "pending"] ?? "bg-stone-100 text-stone-700"}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-stone-500">
                        {new Date(order.createdAt ?? Date.now()).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}{" "}
                        · {items.length} {items.length === 1 ? "item" : "items"}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="font-serif text-xl text-ink">{formatPrice(order.total)}</p>
                      <Link
                        href={`/track?number=${order.number}`}
                        className="text-xs text-bronze underline-offset-2 hover:underline"
                      >
                        View details →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
