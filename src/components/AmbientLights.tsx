import { Cog, Wrench, Recycle, Box, Cpu } from "lucide-react";

/**
 * الإضاءة المحيطة للموقع — هالات ضوئية خضراء/تركوازية/ذهبية خلف كل الصفحات،
 * مع «خردوات» باهتة تعطي إحساس الكوكب. طبقة ثابتة خلف المحتوى ولا تستقبل نقرات.
 *
 * ملاحظة أداء: كانت الهالات ثلاث طبقات ضخمة عليها ‎blur(90px)‎ وحركة لا تتوقف،
 * وكانت الخردوات ثمانية عناصر متحركة على كل الشاشات. صارت الهالات تدرجات
 * ثابتة بلا مرشّحات، والخردوات خمسة فقط تتحرك على الشاشات الكبيرة (CSS).
 */
const FLOATING = [
  { Icon: Cog, top: "12%", start: "6%", size: 72, delay: "0s", dur: "15s" },
  { Icon: Wrench, top: "34%", start: "88%", size: 58, delay: "1.5s", dur: "17s" },
  { Icon: Recycle, top: "62%", start: "4%", size: 64, delay: "0.8s", dur: "16s" },
  { Icon: Box, top: "78%", start: "82%", size: 60, delay: "2.2s", dur: "18s" },
  { Icon: Cpu, top: "48%", start: "46%", size: 48, delay: "3s", dur: "14s" },
];

export default function AmbientLights() {
  return (
    <div className="kk-ambient" aria-hidden="true">
      <span className="kk-ambient-blob kk-ambient-1" />
      <span className="kk-ambient-blob kk-ambient-2" />
      <span className="kk-ambient-blob kk-ambient-3" />
      {FLOATING.map(({ Icon, top, start, size, delay, dur }, i) => (
        <span
          key={i}
          className="kk-ambient-scrap hidden lg:block"
          style={{ top, insetInlineStart: start, animationDelay: delay, animationDuration: dur }}
        >
          <Icon size={size} strokeWidth={1.2} />
        </span>
      ))}
    </div>
  );
}
