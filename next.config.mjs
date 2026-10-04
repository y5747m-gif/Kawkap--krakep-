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
};

export default nextConfig;
