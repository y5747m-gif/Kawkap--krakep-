"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * انتقال ناعم بين الصفحات — كل صفحة تظهر بحركة صعود وتلاشٍ خفيفة.
 * المفتاح (key) هو المسار، فتُعاد الحركة مع كل تنقل داخلي.
 */
export default function PageFade({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="kk-page-fade">
      {children}
    </div>
  );
}
