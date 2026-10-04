import { Cog, Wrench, Recycle, Box, Cpu, Coins, Sofa, Hammer } from "lucide-react";

/**
 * الإضاءة المحيطة للموقع — هالات ضوئية خضراء/تركوازية/ذهبية تتحرك ببطء
 * خلف كل الصفحات، مع «خردوات» باهتة تطفو في الخلفية لتعطي إحساس الكوكب.
 * طبقة ثابتة خلف المحتوى ولا تستقبل أي نقرات.
 */
const FLOATING = [
  { Icon: Cog, top: "12%", start: "6%", size: 72, delay: "0s", dur: "13s" },
  { Icon: Wrench, top: "34%", start: "88%", size: 58, delay: "1.5s", dur: "15s" },
  { Icon: Recycle, top: "62%", start: "4%", size: 64, delay: "0.8s", dur: "14s" },
  { Icon: Box, top: "78%", start: "82%", size: 60, delay: "2.2s", dur: "16s" },
  { Icon: Cpu, top: "48%", start: "46%", size: 48, delay: "3s", dur: "12s" },
  { Icon: Coins, top: "88%", start: "38%", size: 46, delay: "1.1s", dur: "17s" },
  { Icon: Sofa, top: "22%", start: "66%", size: 54, delay: "2.6s", dur: "15s" },
  { Icon: Hammer, top: "70%", start: "60%", size: 44, delay: "0.4s", dur: "13s" },
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
          className="kk-ambient-scrap hidden sm:block"
          style={{ top, insetInlineStart: start, animationDelay: delay, animationDuration: dur }}
        >
          <Icon size={size} strokeWidth={1.2} />
        </span>
      ))}
    </div>
  );
}
