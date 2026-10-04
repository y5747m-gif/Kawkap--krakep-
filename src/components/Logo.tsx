/**
 * شعار كوكب كراكيب — حرف «ك» عربي هندسي داخل كوكب ومدار ذهبي.
 * SVG أصلي خفيف وواضح في المقاسات الصغيرة، بدون الاعتماد على صورة خارجية.
 *
 * `size` هو المقاس الافتراضي، ويمكن تجاوزه بمقاسات متجاوبة عبر `className`
 * (مثل "h-8 w-8 md:h-10 md:w-10") حتى يناسب الشعار شاشة الهاتف.
 */
export default function Logo({
  size = 40,
  withText = true,
  className = "",
  textClassName = "text-lg",
  taglineClassName = "block",
}: {
  size?: number;
  withText?: boolean;
  /** فئات إضافية للأيقونة (تتيح مقاسًا متجاوبًا) */
  className?: string;
  /** فئات إضافية لاسم المنصة */
  textClassName?: string;
  /** فئات إضافية للجملة التعريفية (تُخفى على الشاشات الصغيرة) */
  taglineClassName?: string;
}) {
  return (
    <span className="kk-logo inline-flex min-w-0 items-center gap-2 sm:gap-2.5" aria-label="كوكب كراكيب">
      <svg
        className={`kk-logo-svg shrink-0 ${className}`}
        width={size}
        height={size}
        viewBox="0 0 72 72"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* جسم الكوكب المفتوح حول المدار */}
        <path
          d="M56.8 25.8A24 24 0 0 0 22.1 15.2 24 24 0 0 0 14.6 45.7"
          stroke="#064E3B"
          strokeWidth="8"
          strokeLinecap="square"
        />
        <path
          d="M19.1 53A24 24 0 0 0 58.4 35.2"
          stroke="#064E3B"
          strokeWidth="8"
          strokeLinecap="square"
        />

        {/* حرف الكاف كعلامة هندسية */}
        <path
          d="M24 43h29V35.8c0-4.6-3.7-8.3-8.3-8.3H36l14.5-14.2"
          stroke="#064E3B"
          strokeWidth="7"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
        <circle cx="25" cy="31.5" r="3.2" fill="#C89D3D" />

        {/* المدار؛ جزؤه الأمامي يمر فوق الحرف */}
        <path
          d="M8.7 45.5C16.3 53 34.8 49.9 50.9 39.1 63 31 67.4 22.8 62 19.2"
          stroke="#064E3B"
          strokeWidth="3.3"
          strokeLinecap="round"
        />
        <path
          d="M55.2 17.8c3.2-.4 5.7.1 7.3 1.5"
          stroke="#C89D3D"
          strokeWidth="3.3"
          strokeLinecap="round"
        />
      </svg>

      {withText && (
        <span className="min-w-0 leading-tight">
          <span className={`block truncate font-black text-planet-950 ${textClassName}`}>
            كوكب <span className="text-planet-600">كراكيب</span>
          </span>
          <span className={`truncate text-[10px] font-bold tracking-wide text-planet-500 ${taglineClassName}`}>
            كل شيء يستحق فرصة ثانية
          </span>
        </span>
      )}
    </span>
  );
}
