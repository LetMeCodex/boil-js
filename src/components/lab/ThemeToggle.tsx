import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { getTheme, initTheme, subscribeTheme, toggleTheme, type LabTheme } from "../../lib/lab/theme";

export function ThemeToggle() {
  const [theme, setThemeState] = useState<LabTheme>("day");
  const discRef = useRef<SVGGElement>(null);
  const maskRef = useRef<SVGCircleElement>(null);
  const starsRef = useRef<SVGGElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    setThemeState(initTheme());
    const off = subscribeTheme(setThemeState);
    return () => { off(); };
  }, []);

  useEffect(() => {
    const night = theme === "night";
    tl.current?.kill();
    const stars = starsRef.current?.querySelectorAll("g > *") ?? [];
    const t = gsap.timeline({ defaults: { ease: "power3.inOut", duration: 0.8 } });
    t.to(discRef.current, { rotate: night ? 140 : 0, y: night ? -1.5 : 0, transformOrigin: "50% 50%" }, 0)
      .to(maskRef.current, { attr: { cx: night ? 15.5 : 30 }, duration: 0.85 }, 0)
      .to(stars, {
        opacity: night ? 1 : 0,
        scale: night ? 1 : 0.4,
        transformOrigin: "50% 50%",
        duration: 0.5,
        stagger: { each: 0.07, from: "random" },
      }, night ? 0.28 : 0);
    tl.current = t;
    return () => { t.kill(); };
  }, [theme]);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={theme === "night"}
      aria-label={theme === "night" ? "Switch the world to day" : "Switch the world to night"}
      title={theme === "night" ? "Daybreak" : "Nightfall"}
      className="group relative grid h-9 w-9 place-items-center rounded-full border border-border transition-colors hover:bg-secondary"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 overflow-visible" aria-hidden>
        <defs>
          <mask id="boil-moon-mask">
            <rect x="-4" y="-4" width="32" height="32" fill="#fff" />
            <circle ref={maskRef} cx="30" cy="7.5" r="6.6" fill="#000" />
          </mask>
        </defs>
        <g ref={starsRef} className="text-primary">
          <g opacity="0">
            <path d="M19.6 4.2v2.6M18.3 5.5h2.6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            <circle cx="4.4" cy="6.6" r="0.85" fill="currentColor" />
            <path d="M21 15.2v1.8M20.1 16.1h1.8" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
            <circle cx="3.3" cy="16.4" r="0.7" fill="currentColor" />
          </g>
        </g>
        <g ref={discRef} className="text-foreground">
          <circle cx="12" cy="12" r="5.1" fill="currentColor" mask="url(#boil-moon-mask)" />
          <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"
             opacity={theme === "night" ? 0 : 1} style={{ transition: "opacity 500ms ease" }}>
            <path d="M12 1.6v2.4M12 20v2.4M1.6 12h2.4M20 12h2.4M4.7 4.7l1.7 1.7M17.6 17.6l1.7 1.7M19.3 4.7l-1.7 1.7M6.4 17.6l-1.7 1.7" />
          </g>
        </g>
      </svg>
    </button>
  );
}
