import { Camera, ClipboardList, Send, Inbox, Handshake } from "lucide-react";

const STEPS = [
  { icon: Camera, title: "صوّر الشيء الذي تريد بيعه", desc: "صور واضحة تبيع أسرع" },
  { icon: ClipboardList, title: "أضف التفاصيل والسعر", desc: "اسم، تصنيف، كمية وموقع" },
  { icon: Send, title: "انشر إعلانك", desc: "يظهر إعلانك في المتجر فورًا" },
  { icon: Inbox, title: "استقبل الطلبات", desc: "تصلك الطلبات وتصل للإدارة" },
  { icon: Handshake, title: "تواصل لإتمام البيع", desc: "اتفق على الاستلام والتسليم" },
];

/** قسم: كيف يعمل كوكب كراكيب؟ — 5 خطوات */
export default function HowItWorks({ dark = false }: { dark?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        return (
          <div
            key={i}
            className={`fade-up fade-up-${i + 1} relative flex flex-col items-center rounded-3xl p-5 text-center ${
              dark ? "glass-dark" : "glass"
            }`}
          >
            <span
              className={`absolute -top-3 start-4 flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${
                dark ? "bg-gold-500 text-white" : "bg-gradient-to-br from-planet-500 to-tealx-500 text-white shadow-glow"
              }`}
            >
              {i + 1}
            </span>
            <span
              className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl ${
                dark ? "bg-white/10 text-tealx-400" : "bg-gradient-to-br from-planet-100 to-tealx-500/20 text-planet-600"
              }`}
            >
              <Icon size={26} strokeWidth={1.8} />
            </span>
            <h3 className={`text-sm font-extrabold leading-6 ${dark ? "text-white" : "text-planet-900"}`}>
              {step.title}
            </h3>
            <p className={`mt-1 text-[11px] ${dark ? "text-white/60" : "text-planet-500"}`}>{step.desc}</p>
          </div>
        );
      })}
    </div>
  );
}
