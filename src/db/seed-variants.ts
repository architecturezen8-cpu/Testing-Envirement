import "dotenv/config";
import { db } from "./index";
import { products, productVariants } from "./schema";
import { eq } from "drizzle-orm";

async function seedVariants() {
  const allProducts = await db.select().from(products);

  console.log(`📦 Generating variants for ${allProducts.length} products...`);

  for (const product of allProducts) {
    // Delete existing variants for this product
    await db.delete(productVariants).where(eq(productVariants.productId, product.id));

    const sizes = product.sizes ?? [];
    const colors = (product.colors ?? []) as { name: string; value: string }[];
    const totalStock = product.stock ?? 0;

    if (sizes.length === 0 || colors.length === 0) continue;

    const combinations = sizes.length * colors.length;
    // Distribute stock across combinations with some variation
    const base = Math.floor(totalStock / combinations);

    for (let s = 0; s < sizes.length; s++) {
      for (let c = 0; c < colors.length; c++) {
        // Add slight variation so some variants have more/less stock
        let stock = base;
        if ((s + c) % 3 === 0) stock += 2;
        if ((s + c) % 5 === 0) stock = Math.max(0, stock - 1);
        // Make a few specific variants low stock for demo realism
        if (s === sizes.length - 1 && c === colors.length - 1) {
          stock = Math.min(stock, 2); // last combo low stock
        }
        // Out of stock products get 0
        if (!product.inStock) stock = 0;

        await db.insert(productVariants).values({
          productId: product.id,
          size: sizes[s],
          color: colors[c].name,
          stock: Math.max(0, stock),
        });
      }
    }

    console.log(`  ✓ ${product.name}: ${combinations} variants`);
  }

  const total = await db.select({ c: productVariants.id }).from(productVariants);
  console.log(`\n✅ Seeded ${total.length} variants total.`);
  process.exit(0);
}

seedVariants().catch((err) => {
  console.error("❌ Failed:", err);
  process.exit(1);
});
