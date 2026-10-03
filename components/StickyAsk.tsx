"use client";

import { useEffect, useState } from "react";
import { AskInput } from "@/components/AskInput";
import { useScrollDirection } from "@/components/useScrollDirection";

/**
 * Persistent ask bar: lalabas (fixed, sa ilalim ng header) kapag na-scroll
 * na palampas ang hero input — para laging maaabot ang nag-iisang CTA.
 */
export function StickyAsk() {
  const [visible, setVisible] = useState(false);
  const { isVisible: chromeVisible } = useScrollDirection();

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
    <div
      className={`animate-slide-down fixed inset-x-0 z-20 border-b border-line bg-deep/80 px-3 py-2 backdrop-blur-xl backdrop-saturate-150 transition-[top] duration-200 ease-out sm:px-4 sm:py-2.5 ${
        chromeVisible ? "top-[49px] sm:top-[57px]" : "top-0"
      }`}
    >
      <div className="mx-auto max-w-3xl">
        <AskInput compact />
      </div>
    </div>
  );
}
