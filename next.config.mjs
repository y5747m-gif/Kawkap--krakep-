/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ملفات الرفع تُخزَّن محليًا في public/uploads — في الإنتاج يمكن استبدالها بـ S3/Cloudinary
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
