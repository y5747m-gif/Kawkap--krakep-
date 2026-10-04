import type { LucideIcon } from "lucide-react";

export default function EmptyState({
  icon: Icon, title, subtitle, action,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="glass mx-auto flex max-w-md flex-col items-center rounded-3xl px-6 py-12 text-center">
      <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-planet-100 to-tealx-500/20 text-planet-600">
        <Icon size={30} strokeWidth={1.8} />
      </span>
      <h3 className="text-lg font-extrabold text-planet-900">{title}</h3>
      {subtitle && <p className="mt-1.5 text-sm leading-6 text-planet-600">{subtitle}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
