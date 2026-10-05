/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ملفات الرفع تُخزَّن محليًا في public/uploads — في الإنتاج يمكن استبدالها بـ S3/Cloudinary
  images: { unoptimized: true },
  // node:sqlite يفتح الملف وقت التشغيل، لذلك لا يكتشفه متتبع Next تلقائيًا.
  // تضمينه صراحةً ضروري كي تستطيع دوال Vercel نسخه إلى /tmp بدل خطأ 500.
  outputFileTracingIncludes: {
    "/*": ["./data/app.db"],
  },

  /**
   * ترويسات التخزين المؤقت.
   *
   * Next.js يقدّم كل ما في مجلد ‎public‎ بترويسة ‎Cache-Control: public, max-age=0‎،
   * أي أن المتصفح يعيد سؤال الخادم عن **كل صورة في كل صفحة** حتى لو لم تتغير.
   * على شبكة الهاتف كان هذا يعني عشرات الطلبات الزائدة مع كل تنقّل وإحساسًا
   * دائمًا بالبطء رغم أن الصور نفسها محفوظة. الملفات هنا ثابتة بطبيعتها
   * (صور العرض، الشعارات، الأيقونات) فتُخزَّن لمدة طويلة.
   */
  async headers() {
    return [
      {
        source: "/uploads/demo/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
      {
        source: "/brand/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, immutable" }],
      },
      {
        // صور المستخدمين تحمل اسمًا فريدًا عند الرفع فلا يتغير محتواها أبدًا
        source: "/uploads/user/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
