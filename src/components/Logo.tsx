import { useId } from "react";

/** هوية كوكب كراكيب: كوكب دائري تتوسطه أسهم إعادة الاستخدام وحرف الكاف. */
export default function Logo({ size = 40, withText = true }: { size?: number; withText?: boolean }) {
  const uid = useId().replace(/:/g, "");
  const planet = `planet-${uid}`;
  const orbit = `orbit-${uid}`;

  return (
    <span className="kk-logo inline-flex items-center gap-2.5" aria-label="كوكب كراكيب">
      <svg className="kk-logo-svg" width={size} height={size} viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id={planet} x1="17" y1="12" x2="55" y2="61" gradientUnits="userSpaceOnUse">
            <stop stopColor="#34D399" />
            <stop offset=".48" stopColor="#0F9F7A" />
            <stop offset="1" stopColor="#075B4B" />
          </linearGradient>
          <linearGradient id={orbit} x1="5" y1="50" x2="67" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F59E0B" />
            <stop offset="1" stopColor="#FCD34D" />
          </linearGradient>
        </defs>
        <circle cx="36" cy="36" r="32" fill="#0F9F7A" opacity=".09" />
        <circle cx="36" cy="36" r="24" fill={`url(#${planet})`} />
        <path d="M23.5 32.5c1.8-7 8.8-11.6 16-10.2l-3-3.4 3.8-3.3 8.4 9.4-10.9 6.5-2.6-4.4 3.5-2.1c-4.5-.8-8.7 2-9.9 6.3l-5.3 1.2Z" fill="white" opacity=".96" />
        <path d="M48.5 39.5c-1.8 7-8.8 11.6-16 10.2l3 3.4-3.8 3.3-8.4-9.4 10.9-6.5 2.6 4.4-3.5 2.1c4.5.8 8.7-2 9.9-6.3l5.3-1.2Z" fill="white" opacity=".96" />
        <path d="M34.5 30v12M34.5 36l8-6M34.5 36l8 7" stroke="#075B4B" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 44c7.5 8.5 25.5 11.4 42 5.2 11.2-4.2 17-10.8 14.2-15.5" stroke={`url(#${orbit})`} strokeWidth="3" strokeLinecap="round" />
        <circle cx="63.2" cy="31.8" r="3.4" fill="#FBBF24" />
      </svg>
      {withText && (
        <span className="leading-tight">
          <span className="block text-lg font-black text-planet-950">كوكب <span className="text-planet-600">كراكيب</span></span>
          <span className="block text-[10px] font-bold tracking-wide text-planet-500">كل شيء يستحق فرصة ثانية</span>
        </span>
      )}
    </span>
  );
}
