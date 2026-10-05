import type { Metadata, Viewport } from "next";
/**
 * خط Cairo — نسخة «متغيّرة» (Variable).
 *
 * كان الموقع يحمّل ستة ملفات ثابتة لكل وزن (400 → 900) ولكل مجموعة حروف،
 * أي ما يقارب اثني عشر طلب خط وأكثر من 170 كيلوبايت قبل أن يظهر النص
 * بشكله النهائي. الملف المتغيّر الواحد يغطي كل الأوزان من 200 إلى 1000
 * في ~31 كيلوبايت للعربية — أسرع في أول تحميل وأخف على الشبكة المحدودة.
 */
import "@fontsource-variable/cairo";
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
import { getSiteUrl } from "@/lib/site";
import { cartCount } from "@/lib/models/products";
import { createOwnerContactLink } from "@/lib/whatsapp";

const SITE_DESCRIPTION =
  "كوكب كراكيب — منصة يعرض فيها العملاء الأشياء التي لا يحتاجونها للبيع، ويشتري منها الآخرون. اعرض شيئًا للبيع، تصفح الكراكيب القريبة منك، وحوّل ما لا تحتاجه إلى قيمة.";

export const metadata: Metadata = {
  // بدونه تبقى روابط الصور والمشاركة نسبية فلا تعمل خارج الموقع
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "كوكب كراكيب — عندك كراكيب؟ حوّلها لقيمة",
    template: "%s | كوكب كراكيب",
  },
  description: SITE_DESCRIPTION,
  applicationName: "كوكب كراكيب",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "كوكب كراكيب",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    locale: "ar_EG",
    siteName: "كوكب كراكيب",
    title: "كوكب كراكيب — عندك كراكيب؟ حوّلها لقيمة",
    description: SITE_DESCRIPTION,
    images: [{ url: "/brand/icon-512.png", width: 512, height: 512, alt: "كوكب كراكيب" }],
  },
  twitter: {
    card: "summary",
    title: "كوكب كراكيب — عندك كراكيب؟ حوّلها لقيمة",
    description: SITE_DESCRIPTION,
  },
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

/**
 * شبكة أمان لصور الإعلانات.
 *
 * صور العملاء تُحفظ خارج Git (‎public/uploads/user‎) وعلى الاستضافات
 * المؤقتة تُحفظ في ‎/tmp‎، فإذا أُعيد النشر أو تبدّلت نسخة الخادم يبقى
 * رابط الصورة في قاعدة البيانات بينما يختفي الملف — فيظهر للزائر **خطأ
 * 404 وأيقونة صورة مكسورة** داخل بطاقات الإعلانات والمعرض.
 *
 * هذا المستمع يلتقط فشل تحميل أي صورة (في طور الالتقاط لأن حدث error
 * للصور لا يتصاعد) ويستبدلها بصورة بديلة من هوية الموقع، فلا تظهر أيقونة
 * مكسورة ولا يتكرر الطلب الفاشل.
 */
const IMG_FALLBACK_BOOT = `(function(){var P="/brand/image-placeholder.svg";window.addEventListener("error",function(e){var t=e.target;if(!t||t.tagName!=="IMG")return;if(t.dataset.kkFallback)return;t.dataset.kkFallback="1";t.src=P;t.style.objectFit="contain";t.style.background="#effbf5";},true);})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const cart = user ? cartCount(user.id) : 0;
  const ownerWhatsAppUrl = createOwnerContactLink();

  return (
    <html lang="ar" dir="rtl">
      <head>
        <script dangerouslySetInnerHTML={{ __html: INTRO_BOOT }} />
        <script dangerouslySetInnerHTML={{ __html: IMG_FALLBACK_BOOT }} />
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
