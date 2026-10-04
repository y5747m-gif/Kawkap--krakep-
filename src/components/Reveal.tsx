"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

type Variant = "up" | "zoom" | "start" | "end";

/**
 * ظهور العناصر بسلاسة عند التمرير إليها (Scroll Reveal).
 * يعتمد على IntersectionObserver ويعمل مرة واحدة لكل عنصر،
 * ويتجاهل الحركة تمامًا لمن يفضّل تقليلها (CSS).
 */
export default function Reveal({
  children,
  variant = "up",
  delay = 0,
  as: Tag = "div",
  className = "",
}: {
  children: ReactNode;
  variant?: Variant;
  /** تأخير الظهور بالملّي ثانية */
  delay?: number;
  as?: ElementType;
  className?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      style={{ ["--kk-delay" as string]: `${delay}ms` }}
      className={`reveal reveal-${variant} ${shown ? "is-in" : ""} ${className}`}
    >
      {children}
    </Tag>
  );
}
