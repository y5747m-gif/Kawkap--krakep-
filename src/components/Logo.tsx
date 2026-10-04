/** شعار كوكب كراكيب — كوكب بحلقة مدارية وورقة (SVG) */
export default function Logo({ size = 40, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <span className="kk-logo inline-flex items-center gap-2.5" aria-label="كوكب كراكيب">
      <svg className="kk-logo-svg" width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="kk-planet" x1="8" y1="6" x2="52" y2="56" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2dd4bf" />
            <stop offset="1" stopColor="#128266" />
          </linearGradient>
          <linearGradient id="kk-ring" x1="4" y1="30" x2="60" y2="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fbbf24" />
            <stop offset="0.5" stopColor="#f59e0b" />
            <stop offset="1" stopColor="#fb923c" />
          </linearGradient>
        </defs>
        {/* هالة */}
        <circle cx="32" cy="32" r="30" fill="url(#kk-planet)" opacity="0.14" />
        {/* الكوكب */}
        <circle cx="32" cy="32" r="18.5" fill="url(#kk-planet)" />
        {/* قارة على شكل ورقة */}
        <path
          d="M36.5 20.5c-8.5 1.8-13.5 7-13.5 13.6 0 3.4 1.4 6.4 3.8 8.6 2.4-10.4 9-14.6 15.4-16.2-1.4-3.6-3.6-6-5.7-6z"
          fill="#eafff5"
          opacity="0.95"
        />
        <circle cx="24.5" cy="39" r="3.2" fill="#eafff5" opacity="0.8" />
        <circle cx="39.5" cy="38" r="2.2" fill="#eafff5" opacity="0.7" />
        {/* الحلقة المدارية الذهبية */}
        <g transform="rotate(-16 32 32)">
          <ellipse className="kk-logo-ring" cx="32" cy="32" rx="29" ry="9.5" stroke="url(#kk-ring)" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeDasharray="130 24" />
        </g>
        {/* نجم صغير على المدار */}
        <circle className="kk-logo-star" cx="55.5" cy="24" r="3" fill="#fbbf24" />
        <circle className="kk-logo-star" cx="55.5" cy="24" r="5.5" fill="#fbbf24" opacity="0.3" />
      </svg>
      {withText && (
        <span className="leading-tight">
          <span className="block text-lg font-extrabold text-planet-900">كوكب كراكيب</span>
          <span className="block text-[10px] font-bold tracking-wide text-planet-500">حوّل كراكيبك إلى قيمة</span>
        </span>
      )}
    </span>
  );
}
