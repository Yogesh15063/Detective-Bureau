"use client";

import { useEffect, useState } from "react";

/**
 * Deliberately the simplest possible version of this idea: plain CSS
 * background-image divs, opacity driven by a basic scroll listener —
 * no next/image, no framer-motion. Fewer moving parts to debug.
 * Once this is confirmed working, we can layer optimization/animation
 * polish back on top.
 */

const SCENES = [
  "/scenes/scene-1.png",
  "/scenes/scene-2.png",
  "/scenes/scene-3.png",
  "/scenes/scene-4.png",
  "/scenes/scene-5.png",
  "/scenes/scene-6.png",
  "/scenes/scene-7.png",
];

export default function SceneBackground() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function handleScroll() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? scrollTop / docHeight : 0;
      setProgress(Math.min(1, Math.max(0, pct)));
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const bandSize = 1 / SCENES.length;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        overflow: "hidden",
        backgroundColor: "#0B0D10",
      }}
    >
      {SCENES.map((src, i) => {
        const bandStart = i * bandSize;
        const bandEnd = (i + 1) * bandSize;
        const fade = bandSize * 0.25;

        let opacity = 0;
        if (progress >= bandStart - fade && progress <= bandEnd + fade) {
          if (progress < bandStart) {
            opacity = (progress - (bandStart - fade)) / fade;
          } else if (progress > bandEnd) {
            opacity = 1 - (progress - bandEnd) / fade;
          } else {
            opacity = 1;
          }
        }
        // First scene fully visible at the very top; last scene stays
        // fully visible at the very bottom.
        if (i === 0 && progress <= bandStart) opacity = 1;
        if (i === SCENES.length - 1 && progress >= bandEnd) opacity = 1;

        return (
          <div
            key={src}
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${src})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity,
              transition: "opacity 0.1s linear",
            }}
          />
        );
      })}

      {/* Flat, unblurred dark scrim — just enough for foreground text
          to stay readable over any of the 7 scenes. Not a glass panel:
          no blur, no card behind it, just a light dimming layer. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(11, 13, 16, 0.32)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}