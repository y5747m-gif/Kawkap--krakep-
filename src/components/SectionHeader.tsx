import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function SectionHeader({
  title, subtitle, href, icon,
}: { title: string; subtitle?: string; href?: string; icon?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-extrabold text-planet-950 sm:text-2xl">
          {icon}
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-sm text-planet-600">{subtitle}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="group inline-flex shrink-0 items-center gap-1 rounded-full bg-planet-50 px-4 py-2 text-xs font-extrabold text-planet-700 transition-colors hover:bg-planet-100"
        >
          عرض الكل
          <ChevronLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
