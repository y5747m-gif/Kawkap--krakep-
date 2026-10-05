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
import IntroSplash from "@/components/IntroSplash";
import AmbientLights from "@/components/AmbientLights";
import PointerLight from "@/components/PointerLight";
import PageFade from "@/components/PageFade";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import { getCurrentUser } from "@/lib/auth";
import { cartCount } from "@/lib/models/products";
import { createOwnerContactLink } from "@/lib/whatsapp";

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
  maximumScale: 5,
  userScalable: true,
  // يمتد الموقع تحت «النوتش» ومؤشر الهاتف، والمناطق الآمنة تُعالَج في CSS
  viewportFit: "cover",
};

/**
 * سكربت صغير يعمل قبل الرسم: يحدد إن كان الزائر قد شاهد المقدمة في هذه
 * الجلسة، فتُخفى فورًا بدون أي ومضة (مع دعم ‎?intro=1‎ لإعادة تشغيلها).
 */
const INTRO_BOOT = `(function(){try{var f=location.search.indexOf("intro=")>-1;var s=sessionStorage.getItem("kk-intro-seen-v1")==="1";document.documentElement.dataset.kkIntro=(!f&&s)?"done":"play";}catch(e){document.documentElement.dataset.kkIntro="play";}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const cart = user ? cartCount(user.id) : 0;
  const ownerWhatsAppUrl = createOwnerContactLink();

  return (
    <html lang="ar" dir="rtl">
      <head>
        <script dangerouslySetInnerHTML={{ __html: INTRO_BOOT }} />
        {/* بدون جافاسكربت: لا تظهر المقدمة إطلاقًا */}
        <noscript>
          <style>{`.kk-intro{display:none !important}`}</style>
        </noscript>
      </head>
      <body className="min-h-screen">
        <IntroSplash />
        <AmbientLights />
        <PointerLight />
        <Header user={user} cartCount={cart} />
        <main className="kk-main">
          <PageFade>{children}</PageFade>
        </main>
        <Footer />
        <BottomNav />
        <FloatingWhatsApp url={ownerWhatsAppUrl} />
        <ToastHost />
      </body>
    </html>
  );
}
