// Route segment config has to live in a server file. `page.tsx` here is a
// client component (the shop is filter-driven), so this layout carries the
// setting that keeps the page out of the build-time prerender — otherwise the
// header copy would be frozen from the last build.
export const dynamic = "force-dynamic";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
