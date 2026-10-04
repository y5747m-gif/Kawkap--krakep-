/**
 * كوكب كراكيب — الكوكب المتحرك (SVG)
 * كوكب أخضر/تركوازي بسطح يدور، هالة ضوئية، وحلقة مدارية ذهبية
 * تتحرك حولها شهبٌ صغيرة. يُستخدم في المقدمة (Intro) وفي البطل (Hero).
 */
export default function PlanetMark({
  size = 220,
  spinning = true,
  className = "",
}: {
  size?: number;
  /** تشغيل دوران السطح والحلقة */
  spinning?: boolean;
  className?: string;
}) {
  const uid = "kkp";
  return (
    <span
      className={`kk-planet ${spinning ? "is-spinning" : ""} ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* الهالة الضوئية */}
      <span className="kk-planet-halo" />

      <svg viewBox="0 0 200 200" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id={`${uid}-body`} cx="38%" cy="32%" r="78%">
            <stop offset="0%" stopColor="#6ff0d2" />
            <stop offset="45%" stopColor="#1fa27c" />
            <stop offset="100%" stopColor="#0b5744" />
          </radialGradient>
          <linearGradient id={`${uid}-ring`} x1="10" y1="100" x2="190" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fbbf24" />
            <stop offset="0.5" stopColor="#f59e0b" />
            <stop offset="1" stopColor="#fb923c" />
          </linearGradient>
          <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.55" />
            <stop offset="70%" stopColor="#1fa27c" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#1fa27c" stopOpacity="0" />
          </radialGradient>
          <clipPath id={`${uid}-sphere`}>
            <circle cx="100" cy="100" r="58" />
          </clipPath>
        </defs>

        {/* توهج خارجي */}
        <circle cx="100" cy="100" r="96" fill={`url(#${uid}-glow)`} />

        {/* جسم الكوكب */}
        <circle cx="100" cy="100" r="58" fill={`url(#${uid}-body)`} />

        {/* سطح الكوكب الدوّار — قارات على شكل أوراق وبقع */}
        <g clipPath={`url(#${uid}-sphere)`}>
          <g className="kk-planet-surface">
            <path
              d="M104 56c-24 5-38 20-38 39 0 10 4 18 11 25 7-30 26-42 44-46-4-10-10-18-17-18z"
              fill="#eafff5"
              opacity="0.92"
            />
            <circle cx="70" cy="124" r="10" fill="#eafff5" opacity="0.75" />
            <circle cx="126" cy="120" r="7" fill="#eafff5" opacity="0.6" />
            <ellipse cx="150" cy="78" rx="16" ry="9" fill="#eafff5" opacity="0.45" />
            <path
              d="M44 92c10-6 22-6 30 2-10 6-22 7-30-2z"
              fill="#eafff5"
              opacity="0.5"
            />
            {/* نسخة مكررة لاستمرارية الدوران */}
            <circle cx="186" cy="108" r="9" fill="#eafff5" opacity="0.5" />
            <circle cx="18" cy="70" r="7" fill="#eafff5" opacity="0.45" />
          </g>
        </g>

        {/* لمعة الإضاءة على الكرة */}
        <ellipse cx="78" cy="74" rx="26" ry="18" fill="#ffffff" opacity="0.22" transform="rotate(-28 78 74)" />
        <circle cx="100" cy="100" r="58" fill="none" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="1.5" />

        {/* الحلقة المدارية الذهبية */}
        <g transform="rotate(-18 100 100)">
          <ellipse
            className="kk-planet-ring"
            cx="100"
            cy="100"
            rx="90"
            ry="29"
            stroke={`url(#${uid}-ring)`}
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            strokeDasharray="300 60"
          />
        </g>
      </svg>

      {/* شهاب يدور حول الكوكب في مدار ثلاثي الأبعاد */}
      <span className="kk-orbit">
        <span className="kk-orbit-star" />
      </span>
      <span className="kk-orbit kk-orbit-2">
        <span className="kk-orbit-star kk-orbit-star-2" />
      </span>
    </span>
  );
}
