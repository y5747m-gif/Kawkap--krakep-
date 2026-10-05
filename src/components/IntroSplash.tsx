"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Cog, Wrench, Cpu, WashingMachine, Sofa, Box, Newspaper,
  Droplets, Coins, Package, Recycle, Tv,
} from "lucide-react";
import PlanetMark from "./PlanetMark";

/**
 * ============================================================
 * مقدمة كوكب كراكيب (Intro Animation)
 * ============================================================
 * خلفية خضراء مرشوشة بالكراكيب والخردوات تطفو في الفضاء،
 * الكوكب يظهر ويدور، ثم تنزل منه حروف «كوكب كراكيب» حرفًا حرفًا
 * حتى تستقر مع لمعة ضوئية، ثم تنفتح الستارة على الموقع.
 *
 * تظهر مرة واحدة لكل جلسة (sessionStorage)، ويمكن إعادة تشغيلها
 * بإضافة ‎?intro=1‎ للرابط، وتُختصر تلقائيًا لمن يفضّل تقليل الحركة.
 */

const INTRO_KEY = "kk-intro-seen-v1";
/**
 * زمن العرض قبل بدء الخروج. كان 4.1 ثانية + 0.8 للخروج = خمس ثوانٍ كاملة
 * يقف فيها الزائر أمام شاشة لا يستطيع تجاوزها إلا بزر صغير — وهو أكبر سبب
 * للإحساس بأن «الموقع بطيء» رغم أن الصفحة نفسها جاهزة خلف المقدمة.
 * قُلِّص الزمن ويمكن تخطي المقدمة بالضغط في أي مكان.
 */
const PLAY_MS = 2400;
const LEAVE_MS = 550; // زمن حركة الخروج

/* ------------------------------------------------------------------
 * تشكيل الحروف العربية: كل حرف يُعرض بصورته المتصلة الصحيحة
 * (أول/وسط/آخر) باستخدام ZWJ حتى تبقى الكلمة متصلة أثناء تحرك الحروف.
 * ------------------------------------------------------------------ */
const ZWJ = "\u200d";
const NON_JOINERS = new Set(["ا", "أ", "إ", "آ", "ٱ", "د", "ذ", "ر", "ز", "و", "ؤ", "ة", "ى", "ء"]);

function shapeWord(word: string): string[] {
  const chars = Array.from(word);
  return chars.map((ch, i) => {
    const joinPrev = i > 0 && !NON_JOINERS.has(chars[i - 1]);
    const joinNext = i < chars.length - 1 && !NON_JOINERS.has(ch);
    return `${joinPrev ? ZWJ : ""}${ch}${joinNext ? ZWJ : ""}`;
  });
}

/** الكلمتان بحروفهما المشكّلة + زمن نزول كل حرف (يُحسب مرة واحدة) */
const WORDS: { letter: string; delay: number }[][] = (() => {
  let index = 0;
  return ["كوكب", "كراكيب"].map((word) =>
    shapeWord(word).map((letter) => {
      const delay = 0.72 + index * 0.062;
      index += 1;
      return { letter, delay };
    })
  );
})();

/* ------------------------------------------------------------------
 * الخردوات المتناثرة في الخلفية (مواضع ثابتة حتى لا يختلف SSR)
 * ------------------------------------------------------------------ */
type Scrap = {
  Icon: typeof Cog;
  top: number;
  left: number;
  size: number;
  delay: number;
  dur: number;
  rot: number;
  op: number;
  /** يظهر على الشاشات المتوسطة فأكبر فقط */
  lg?: boolean;
};

const SCRAPS: Scrap[] = [
  { Icon: Cog, top: 12, left: 8, size: 54, delay: 0.0, dur: 9, rot: -18, op: 0.22 },
  { Icon: Wrench, top: 26, left: 86, size: 46, delay: 0.6, dur: 11, rot: 24, op: 0.2 },
  { Icon: WashingMachine, top: 68, left: 12, size: 58, delay: 0.3, dur: 10, rot: 8, op: 0.18 },
  { Icon: Sofa, top: 80, left: 78, size: 62, delay: 1.1, dur: 12, rot: -12, op: 0.17 },
  { Icon: Cpu, top: 46, left: 4, size: 40, delay: 0.9, dur: 8, rot: 16, op: 0.2 },
  { Icon: Box, top: 58, left: 92, size: 42, delay: 0.2, dur: 9, rot: 14, op: 0.2 },
  // ما يلي يظهر على الشاشات المتوسطة فأكبر فقط — الهاتف لا يحتمل 28 أيقونة متحركة
  { Icon: Newspaper, top: 86, left: 40, size: 40, delay: 1.7, dur: 11, rot: -8, op: 0.16, lg: true },
  { Icon: Droplets, top: 74, left: 58, size: 34, delay: 1.2, dur: 9.5, rot: -16, op: 0.18, lg: true },
  { Icon: Coins, top: 54, left: 70, size: 36, delay: 1.9, dur: 8, rot: -20, op: 0.2, lg: true },
  { Icon: Package, top: 64, left: 34, size: 38, delay: 0.7, dur: 11.5, rot: -10, op: 0.15, lg: true },
  { Icon: Tv, top: 30, left: 70, size: 42, delay: 0.1, dur: 12, rot: 6, op: 0.14, lg: true },
  { Icon: Recycle, top: 16, left: 62, size: 32, delay: 1.45, dur: 10.5, rot: -24, op: 0.18, lg: true },
];

export default function IntroSplash() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;
  const [phase, setPhase] = useState<"play" | "leave" | "done">("play");
  const [runId, setRunId] = useState(0); // لإعادة تشغيل الحركة من البداية
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const finish = useCallback(() => {
    clearTimers();
    document.documentElement.dataset.kkIntro = "done";
    document.body.classList.remove("kk-intro-lock");
    try {
      sessionStorage.setItem(INTRO_KEY, "1");
    } catch {
      /* الجلسة غير متاحة — لا مشكلة */
    }
    setPhase("done");
  }, [clearTimers]);

  /** تشغيل المقدمة من أولها */
  const play = useCallback(() => {
    clearTimers();
    document.documentElement.dataset.kkIntro = "play";
    document.body.classList.add("kk-intro-lock");
    setPhase("play");
    setRunId((n) => n + 1);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const playFor = reduced ? 1200 : PLAY_MS;

    timers.current.push(setTimeout(() => setPhase("leave"), playFor));
    timers.current.push(setTimeout(finish, playFor + LEAVE_MS));
  }, [clearTimers, finish]);

  const skip = useCallback(() => {
    clearTimers();
    setPhase("leave");
    timers.current.push(setTimeout(finish, 420));
  }, [clearTimers, finish]);

  useEffect(() => {
    const root = document.documentElement;

    // لا مقدمة داخل لوحة الإدارة
    if (isAdmin) {
      root.dataset.kkIntro = "done";
      setPhase("done");
      return;
    }

    const forced = new URLSearchParams(window.location.search).has("intro");
    let seen = false;
    try {
      seen = sessionStorage.getItem(INTRO_KEY) === "1";
    } catch {
      seen = false;
    }

    if (!forced && (seen || root.dataset.kkIntro === "done")) {
      root.dataset.kkIntro = "done";
      setPhase("done");
    } else {
      play();
    }

    const onReplay = () => play();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") skip();
    };
    window.addEventListener("kk:replay-intro", onReplay);
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("kk:replay-intro", onReplay);
      window.removeEventListener("keydown", onKey);
      clearTimers();
      document.body.classList.remove("kk-intro-lock");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === "done" || isAdmin) return null;

  return (
    <div
      key={runId}
      className={`kk-intro${phase === "leave" ? " is-leaving" : ""}`}
      role="dialog"
      aria-label="مقدمة كوكب كراكيب"
      /* الضغط في أي مكان يتخطى المقدمة — لا ينتظر الزائر انتهاءها */
      onClick={skip}
    >
      {/* ---------- خلفية خضراء + إضاءات ---------- */}
      <div className="kk-intro-bg" />
      <div className="kk-intro-aurora kk-intro-aurora-1" />
      <div className="kk-intro-aurora kk-intro-aurora-2" />
      <div className="kk-intro-aurora kk-intro-aurora-3" />
      <div className="kk-intro-grid" />
      <div className="kk-intro-beam" />

      {/* ---------- خردوات متناثرة ---------- */}
      <div className="kk-intro-scraps" aria-hidden="true">
        {SCRAPS.map((s, i) => {
          const Icon = s.Icon;
          return (
            <span
              key={i}
              className={`kk-scrap${s.lg ? " hidden sm:inline-flex" : ""}`}
              style={{
                top: `${s.top}%`,
                insetInlineStart: `${s.left}%`,
                animationDelay: `${s.delay}s`,
                animationDuration: `${s.dur}s`,
                opacity: s.op,
                ["--kk-rot" as string]: `${s.rot}deg`,
              }}
            >
              <Icon size={s.size} strokeWidth={1.5} />
            </span>
          );
        })}
      </div>

      {/* ---------- المسرح ---------- */}
      <div className="kk-intro-stage">
        <div className="kk-intro-planet">
          <PlanetMark size={190} />
          <span className="kk-intro-flash" />
        </div>

        <h1 className="kk-intro-title" aria-label="كوكب كراكيب">
          {WORDS.map((letters, w) => (
            <span key={w} className="kk-intro-word">
              {letters.map(({ letter, delay }, i) => (
                <span key={i} className="kk-letter" style={{ animationDelay: `${delay}s` }}>
                  {letter}
                </span>
              ))}
            </span>
          ))}
        </h1>

        <p className="kk-intro-tagline">حوّل كراكيبك إلى قيمة</p>

        <div className="kk-intro-bar" aria-hidden="true">
          <span />
        </div>
      </div>

      <button type="button" onClick={skip} className="kk-intro-skip">
        تخطي المقدمة
      </button>
    </div>
  );
}
