/**
 * النسخة المتحركة من الشعار الرسمي.
 * تُستخدم في مقدمة الموقع والبطل مع الحفاظ على الهالة والمدارات والشهب.
 */
export default function PlanetMark({
  size = 220,
  spinning = true,
  className = "",
}: {
  size?: number;
  spinning?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`kk-planet ${spinning ? "is-spinning" : ""} ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span className="kk-planet-halo" />

      <svg viewBox="0 0 200 200" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="kk-new-logo-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#34d399" stopOpacity=".48" />
            <stop offset=".68" stopColor="#0f9f7a" stopOpacity=".12" />
            <stop offset="1" stopColor="#0f9f7a" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="kk-new-logo-green" x1="42" y1="35" x2="157" y2="165" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6ee7c3" />
            <stop offset=".42" stopColor="#10b981" />
            <stop offset="1" stopColor="#064e3b" />
          </linearGradient>
          <linearGradient id="kk-new-logo-gold" x1="145" y1="45" x2="165" y2="70" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fde68a" />
            <stop offset="1" stopColor="#c89d3d" />
          </linearGradient>
          <filter id="kk-new-logo-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#022c22" floodOpacity=".38" />
          </filter>
        </defs>

        <circle cx="100" cy="100" r="98" fill="url(#kk-new-logo-glow)" />

        {/* الشعار نفسه: نفس هندسة شعار الترويسة تمامًا */}
        <g className="kk-planet-logo-core" filter="url(#kk-new-logo-shadow)" transform="scale(2.77778)">
          <path d="M56.8 25.8A24 24 0 0 0 22.1 15.2 24 24 0 0 0 14.6 45.7" stroke="url(#kk-new-logo-green)" strokeWidth="8" strokeLinecap="square" />
          <path d="M19.1 53A24 24 0 0 0 58.4 35.2" stroke="url(#kk-new-logo-green)" strokeWidth="8" strokeLinecap="square" />
          <path d="M24 43h29V35.8c0-4.6-3.7-8.3-8.3-8.3H36l14.5-14.2" stroke="url(#kk-new-logo-green)" strokeWidth="7" strokeLinecap="square" strokeLinejoin="miter" />
          <circle cx="25" cy="31.5" r="3.2" fill="url(#kk-new-logo-gold)" />
          <path className="kk-planet-ring" d="M8.7 45.5C16.3 53 34.8 49.9 50.9 39.1 63 31 67.4 22.8 62 19.2" stroke="url(#kk-new-logo-green)" strokeWidth="3.3" strokeLinecap="round" />
          <path d="M55.2 17.8c3.2-.4 5.7.1 7.3 1.5" stroke="url(#kk-new-logo-gold)" strokeWidth="3.3" strokeLinecap="round" />
        </g>

        {/* بريق يمر على الشعار أثناء ظهوره */}
        <path className="kk-logo-spark" d="M42 49 50 31l7 18 18 7-18 7-7 18-8-18-18-7 18-7Z" fill="white" opacity="0" />
      </svg>

      <span className="kk-orbit">
        <span className="kk-orbit-star" />
      </span>
      <span className="kk-orbit kk-orbit-2">
        <span className="kk-orbit-star kk-orbit-star-2" />
      </span>
    </span>
  );
}
