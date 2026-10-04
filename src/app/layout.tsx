import type { Metadata, Viewport } from "next";
import "@fontsource/cairo/400.css";
import "@fontsource/cairo/500.css";
import "@fontsource/cairo/600.css";
import "@fontsource/cairo/700.css";
import "@fontsource/cairo/800.css";
import "@fontsource/cairo/900.css";
import "./globals.css";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import ToastHost from "@/components/Toast";
import { getCurrentUser } from "@/lib/auth";
import { cartCount } from "@/lib/models/products";

export const metadata: Metadata = {
  title: {
    default: "كوكب كراكيب — عندك كراكيب؟ حوّلها لقيمة",
    template: "%s | كوكب كراكيب",
  },
  description:
    "كوكب كراكيب — منصة يعرض فيها العملاء الأشياء التي لا يحتاجونها للبيع، ويشتري منها الآخرون. اعرض شيئًا للبيع، تصفح الكراكيب القريبة منك، وحوّل ما لا تحتاجه إلى قيمة.",
  applicationName: "كوكب كراكيب",
};

export const viewport: Viewport = {
  themeColor: "#0f4439",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const cart = user ? cartCount(user.id) : 0;

  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen">
        <Header user={user} cartCount={cart} />
        <main className="mx-auto w-full max-w-7xl px-3 pb-28 pt-4 sm:px-5 md:pb-16">{children}</main>
        <Footer />
        <BottomNav />
        <ToastHost />
      </body>
    </html>
  );
}
