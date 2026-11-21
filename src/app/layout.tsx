import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart/cart-context";
import { FavoritesProvider } from "@/components/favorites/favorites-context";
import { RecentlyViewedProvider } from "@/components/product/recently-viewed-context";
import { UserProvider } from "@/components/auth/user-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartDrawer } from "@/components/cart/cart-drawer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});


export const metadata: Metadata = {
  title: "St. Thomas' College Matale — Merchandises & Event Tickets",
  description:
    "The official online store of St. Thomas' College, Matale (Est. 1873). College merchandises and event tickets for Thomians, parents and old boys.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="min-h-screen bg-paper font-sans text-ink antialiased">
        <UserProvider>
          <FavoritesProvider>
            <RecentlyViewedProvider>
              <CartProvider>
                <Header />
                <CartDrawer />
                <main className="min-h-screen">{children}</main>
                <Footer />
              </CartProvider>
            </RecentlyViewedProvider>
          </FavoritesProvider>
        </UserProvider>
      </body>
    </html>
  );
}
