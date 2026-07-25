"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

const PLAYER_LINE = "I want all the CCTV footage of this area.";
const NARRATOR_LINE =
  "Two cameras cover this stretch — the dock-side unit above the bait shop, and a private feed from the marina office across the water. The dock camera's timestamp has been drifting for months, unreliable. The marina feed is intact, but the operator says anything older than thirty days gets overwritten automatically. If Tom was here that night, that window may already be gone.";

export default function LiveDemo() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [showThinking, setShowThinking] = useState(false);
  const [showResponse, setShowResponse] = useState(false);

  useEffect(() => {
    if (!inView) return;
    const t1 = setTimeout(() => setShowThinking(true), 500);
    const t2 = setTimeout(() => {
      setShowThinking(false);
      setShowResponse(true);
    }, 1600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [inView]);

  const words = NARRATOR_LINE.split(" ");

  return (
    <div ref={ref} className="border border-white/10 bg-charcoal rounded p-8 md:p-10">
      <p className="font-mono text-[11px] tracking-widest text-brass mb-6">
        A CASE FILE, IN ACTION
      </p>

      {/* player message */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4 }}
        className="flex justify-end mb-6"
      >
        <div className="bg-brass text-parchment rounded-lg rounded-br-sm px-4 py-2.5 max-w-md text-sm">
          {PLAYER_LINE}
        </div>
      </motion.div>

      {/* thinking indicator */}
      {showThinking && (
        <div className="flex items-center gap-1.5 mb-6 pl-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-fog"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      )}

      {/* narrator response — reveals word by word */}
      {showResponse && (
        <p className="text-parchment/90 leading-relaxed text-[15px]">
          {words.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15, delay: i * 0.035 }}
              className="inline-block mr-[0.3em]"
            >
              {word}
            </motion.span>
          ))}
        </p>
      )}
    </div>
  );
}