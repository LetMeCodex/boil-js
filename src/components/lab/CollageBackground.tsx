import { useEffect, useRef } from "react";
import { KineticCollageScene } from "../../lib/lab/collage";
import { getTheme, initTheme, subscribeTheme } from "../../lib/lab/theme";

export function CollageBackground({ tier = "desktop" }: { tier?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<KineticCollageScene | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new KineticCollageScene(canvas, { quality: tier });
    scene.init();
    sceneRef.current = scene;

    initTheme();
    scene.setNight(getTheme() === "night");
    const offTheme = subscribeTheme((t) => scene.setNight(t === "night"));

    const onMove = (e: MouseEvent) => {
      scene.setMouse((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    };
    const onResize = () => scene.resize();
    const onVis = () => scene.setVisible(!document.hidden);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      offTheme();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
      scene.destroy();
    };
  }, [tier]);

  return <canvas ref={canvasRef} id="kinetic-collage-bg" className="kinetic-collage-canvas" aria-hidden="true" />;
}
