"use client";

import { useEffect, useState } from "react";
import { AskInput } from "@/components/AskInput";

/**
 * Persistent ask bar: lalabas (fixed, sa ilalim ng header) kapag na-scroll
 * na palampas ang hero input — para laging maaabot ang nag-iisang CTA.
 */
export function StickyAsk() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sentinel = document.getElementById("hero-ask");
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  if (!visible) return null;

  return (
    <div className="animate-slide-down fixed inset-x-0 top-[53px] z-20 border-b border-zinc-900/80 bg-[#050507]/90 px-4 py-2.5 backdrop-blur">
      <div className="mx-auto max-w-3xl">
        <AskInput compact />
      </div>
    </div>
  );
}
