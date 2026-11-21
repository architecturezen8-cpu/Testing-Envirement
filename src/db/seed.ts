import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { collections, products, reviews } from "./schema";

function gallery(url: string) {
  return [
    url,
    url.replace("fit=crop&h=1200&w=800", "fit=crop&h=600&w=600"),
    url.replace("fit=crop&h=1200&w=800", "fit=crop&h=1200&w=600"),
  ];
}

const colors = {
  black: { name: "Black", value: "#111111" },
  white: { name: "White", value: "#f8f8f8" },
  navy: { name: "Navy", value: "#1e293b" },
  beige: { name: "Beige", value: "#d4c5b5" },
  camel: { name: "Camel", value: "#c29b61" },
  charcoal: { name: "Charcoal", value: "#374151" },
  sage: { name: "Sage", value: "#8fa395" },
  burgundy: { name: "Burgundy", value: "#722f37" },
  cream: { name: "Cream", value: "#f5f5dc" },
};

async function seed() {
  await db.delete(reviews);
  await db.delete(products);
  await db.delete(collections);

  const [newArrivals, essentials, tailoring, footwear, outerwear] = await db
    .insert(collections)
    .values([
      {
        name: "New Arrivals",
        slug: "new-arrivals",
        description: "The latest arrivals from Nova studios.",
        featured: true,
        sortOrder: 1,
      },
      {
        name: "Essentials",
        slug: "essentials",
        description: "Timeless pieces designed for everyday elegance.",
        featured: true,
        sortOrder: 2,
      },
      {
        name: "Tailoring",
        slug: "tailoring",
        description: "Precision-cut silhouettes and modern suiting.",
        featured: false,
        sortOrder: 3,
      },
      {
        name: "Footwear",
        slug: "footwear",
        description: "Sneakers, loafers and boots crafted for the global city.",
        featured: true,
        sortOrder: 4,
      },
      {
        name: "Outerwear",
        slug: "outerwear",
        description: "Layers that travel with you across seasons.",
        featured: false,
        sortOrder: 5,
      },
    ])
    .returning();

  const productData: (typeof products.$inferInsert)[] = [
    {
      name: "Nova Essential Tee",
      slug: "nova-essential-tee",
      description:
        "A heavyweight organic-cotton tee in a relaxed fit. garment-dyed for a soft, lived-in feel and finished with a subtle Nova emblem at the hem.",
      price: 4500,
      category: "Clothing",
      gender: "Unisex",
      sizes: ["XS", "S", "M", "L", "XL"],
      colors: [colors.white, colors.black, colors.sage],
      images: gallery(
        "https://images.pexels.com/photos/9594089/pexels-photo-9594089.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800"
      ),
      collectionId: essentials.id,
      badge: "Best Seller",
    },
    {
      name: "Relaxed Silk Shirt",
      slug: "relaxed-silk-shirt",
      description:
        "Cut from sand-washed silk with a matte luster, this shirt drapes beautifully whether tucked into tailoring or worn loose.",
      price: 12800,
      compareAtPrice: 15500,
      category: "Clothing",
      gender: "Men",
      sizes: ["S", "M", "L", "XL"],
      colors: [colors.cream, colors.navy, colors.burgundy],
      images: gallery(
        "https://images.pexels.com/photos/8148577/pexels-photo-8148577.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800"
      ),
      collectionId: newArrivals.id,
    },
    {
      name: "Silk Band-Collar Blouse",
      slug: "silk-band-collar-blouse",
      description:
        "An elevated blouse with a clean band collar and concealed placket. Designed for boardrooms and evenings out.",
      price: 13500,
      category: "Clothing",
      gender: "Women",
      sizes: ["XS", "S", "M", "L"],
      colors: [colors.cream, colors.black],
      images: gallery(
        "https://images.pexels.com/photos/8346225/pexels-photo-8346225.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800"
      ),
      collectionId: newArrivals.id,
    },
    {
      name: "Structured Wool Blazer",
      slug: "structured-wool-blazer",
      description:
        "Single-breasted blazer in Italian wool with a structured shoulder and soft drape. The definition of modern power dressing.",
      price: 29500,
      category: "Clothing",
      gender: "Men",
      sizes: ["36", "38", "40", "42", "44"],
      colors: [colors.charcoal, colors.navy, colors.camel],
      images: gallery(
        "https://images.pexels.com/photos/9218524/pexels-photo-9218524.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800"
      ),
      collectionId: tailoring.id,
    },
    {
      name: "Hourglass Wool Blazer",
      slug: "hourglass-wool-blazer",
      description:
        "Sculpted through the waist with a nipped-in silhouette. Wear with the matching trousers for a commanding look.",
      price: 32000,
      category: "Clothing",
      gender: "Women",
      sizes: ["XS", "S", "M", "L"],
      colors: [colors.black, colors.camel, colors.charcoal],
      images: gallery(
        "https://images.pexels.com/photos/9218536/pexels-photo-9218536.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800"
      ),
      collectionId: tailoring.id,
    },
    {
      name: "Tailored Pleat Trousers",
      slug: "tailored-pleat-trousers",
      description:
        "Wide-leg trousers with pressed pleats and a high-rise waist. Finished with a hook-and-bar closure for a clean front.",
      price: 16500,
      category: "Clothing",
      gender: "Men",
      sizes: ["30", "32", "34", "36", "38"],
      colors: [colors.charcoal, colors.navy, colors.beige],
      images: gallery(
        "https://images.pexels.com/photos/4210864/pexels-photo-4210864.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800"
      ),
      collectionId: tailoring.id,
    },
    {
      name: "Pleated Wide-Leg Trousers",
      slug: "pleated-wide-leg-trousers",
      description:
        "Fluid wide-leg trousers that move with you. Cut from a soft crepe blend with deep pleats and side pockets.",
      price: 15500,
      category: "Clothing",
      gender: "Women",
      sizes: ["XS", "S", "M", "L", "XL"],
      colors: [colors.black, colors.cream, colors.sage],
      images: gallery(
        "https://images.pexels.com/photos/20669538/pexels-photo-20669538.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800"
      ),
      collectionId: essentials.id,
    },
    {
      name: "Cashmere Crew Knit",
      slug: "cashmere-crew-knit",
      description:
        "Spun from Grade-A Mongolian cashmere, this crew knit is featherlight yet insulating. A forever piece.",
      price: 22000,
      category: "Clothing",
      gender: "Women",
      sizes: ["XS", "S", "M", "L"],
      colors: [colors.camel, colors.charcoal, colors.cream],
      images: gallery(
        "https://images.pexels.com/photos/30569741/pexels-photo-30569741.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800"
      ),
      collectionId: essentials.id,
      badge: "New",
    },
    {
      name: "Merino Roll-Neck",
      slug: "merino-roll-neck",
      description:
        "A fine-gauge merino roll-neck with a refined close fit. The ultimate layering staple.",
      price: 18500,
      category: "Clothing",
      gender: "Unisex",
      sizes: ["XS", "S", "M", "L", "XL"],
      colors: [colors.black, colors.navy, colors.cream],
      images: gallery(
        "https://images.pexels.com/photos/19203177/pexels-photo-19203177.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800"
      ),
      collectionId: essentials.id,
    },
    {
      name: "Leather Biker Jacket",
      slug: "leather-biker-jacket",
      description:
        "Hand-finished vegetable-tanned leather with brushed gunmetal hardware. Designed to age beautifully.",
      price: 45000,
      compareAtPrice: 52000,
      category: "Clothing",
      gender: "Men",
      sizes: ["S", "M", "L", "XL"],
      colors: [colors.black],
      images: gallery(
        "https://images.pexels.com/photos/6899174/pexels-photo-6899174.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800"
      ),
      collectionId: outerwear.id,
    },
    {
      name: "Wool Overcoat",
      slug: "wool-overcoat",
      description:
        "A full-length overcoat in double-faced wool. Unlined for lightness, with an internal pocket for travel.",
      price: 59000,
      category: "Clothing",
      gender: "Men",
      sizes: ["36", "38", "40", "42", "44"],
      colors: [colors.camel, colors.charcoal],
      images: gallery(
        "https://images.pexels.com/photos/6726841/pexels-photo-6726841.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800"
      ),
      collectionId: outerwear.id,
    },
    {
      name: "Belted Trench Coat",
      slug: "belted-trench-coat",
      description:
        "A reimagined classic in water-resistant cotton gabardine. Belted waist, storm flaps and a flowing back vent.",
      price: 54000,
      category: "Clothing",
      gender: "Women",
      sizes: ["XS", "S", "M", "L"],
      colors: [colors.beige, colors.navy],
      images: gallery(
        "https://images.pexels.com/photos/36168977/pexels-photo-36168977.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800"
      ),
      collectionId: outerwear.id,
    },
    {
      name: "Nova Minimalist Sneaker",
      slug: "nova-minimalist-sneaker",
      description:
        "A clean, low-profile sneaker built from full-grain leather with a cushioned footbed and rubber cupsole.",
      price: 16000,
      category: "Shoes",
      gender: "Unisex",
      sizes: ["7", "8", "9", "10", "11", "12"],
      colors: [colors.white, colors.black],
      images: gallery(
        "https://images.pexels.com/photos/12611630/pexels-photo-12611630.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800"
      ),
      collectionId: footwear.id,
      badge: "Best Seller",
    },
    {
      name: "Court Trainer",
      slug: "court-trainer",
      description:
        "Heritage tennis styling meets modern comfort. Perforated leather upper and a tonal rubber sole.",
      price: 14000,
      category: "Shoes",
      gender: "Unisex",
      sizes: ["7", "8", "9", "10", "11"],
      colors: [colors.white, colors.navy, colors.sage],
      images: gallery(
        "https://images.pexels.com/photos/14212621/pexels-photo-14212621.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800"
      ),
      collectionId: footwear.id,
    },
    {
      name: "Leather Penny Loafer",
      slug: "leather-penny-loafer",
      description:
        "Hand-stitched leather loafers with a refined apron toe. Easy enough for weekends, polished enough for the office.",
      price: 24500,
      category: "Shoes",
      gender: "Men",
      sizes: ["7", "8", "9", "10", "11", "12"],
      colors: [colors.black, colors.camel],
      images: gallery(
        "https://images.pexels.com/photos/34871894/pexels-photo-34871894.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800"
      ),
      collectionId: footwear.id,
    },
    {
      name: "Suede Tassel Loafer",
      slug: "suede-tassel-loafer",
      description:
        "Soft suede loafers with classic tassel detail and a leather sole. A refined finishing touch.",
      price: 23500,
      category: "Shoes",
      gender: "Women",
      sizes: ["5", "6", "7", "8", "9", "10"],
      colors: [colors.camel, colors.navy],
      images: gallery(
        "https://images.pexels.com/photos/8394709/pexels-photo-8394709.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800"
      ),
      collectionId: footwear.id,
    },
    {
      name: "Leather Ankle Boot",
      slug: "leather-ankle-boot",
      description:
        "A sleek ankle boot with a sculpted heel and side zip. Crafted from polished calf leather.",
      price: 28500,
      category: "Shoes",
      gender: "Women",
      sizes: ["5", "6", "7", "8", "9", "10"],
      colors: [colors.black, colors.burgundy],
      images: gallery(
        "https://images.pexels.com/photos/25381178/pexels-photo-25381178.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800"
      ),
      collectionId: footwear.id,
    },
  ];

  const insertedProducts = await db
    .insert(products)
    .values(productData)
    .returning();

  const reviewPhrases = [
    {
      title: "Exceeded expectations",
      body: "Beautiful fabric and perfect drape. Already planning a second color.",
    },
    {
      title: "Wardrobe staple",
      body: "The cut is flattering and the quality is exactly what I hoped for.",
    },
    {
      title: "True to size",
      body: "Ordered my usual size and it fits perfectly. Fast shipping too.",
    },
    {
      title: "Premium feel",
      body: "You can tell the materials are top-tier. Looks even better in person.",
    },
    {
      title: "Great investment",
      body: "Higher price point but worth every penny for the craftsmanship.",
    },
    {
      title: "Versatile piece",
      body: "Works with everything in my closet. Dress up or down effortlessly.",
    },
  ];

  const authors = [
    "Elena R.",
    "James K.",
    "Sarah M.",
    "David L.",
    "Priya S.",
    "Thomas B.",
    "Chloe W.",
    "Marcus J.",
  ];

  const reviewInserts = insertedProducts.flatMap((product) => {
    const count = 3 + Math.floor(Math.random() * 4);
    return Array.from({ length: count }).map((_, i) => {
      const phrase = reviewPhrases[(i + product.id) % reviewPhrases.length];
      return {
        productId: product.id,
        author: authors[(i + product.id) % authors.length],
        rating: 4 + (Math.random() > 0.7 ? 1 : 0),
        title: phrase.title,
        body: phrase.body,
        helpful: Math.floor(Math.random() * 30),
      };
    });
  });

  await db.insert(reviews).values(reviewInserts);

  for (const product of insertedProducts) {
    const productReviews = reviewInserts.filter((r) => r.productId === product.id);
    if (productReviews.length) {
      const avg =
        productReviews.reduce((sum, r) => sum + r.rating, 0) /
        productReviews.length;
      await db
        .update(products)
        .set({
          rating: avg.toFixed(1),
          reviewCount: productReviews.length,
        })
        .where(eq(products.id, product.id));
    }
  }

  console.log(`Seeded ${insertedProducts.length} products and ${reviewInserts.length} reviews.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
