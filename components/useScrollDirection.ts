"use client";

import { useEffect, useState } from "react";

type ScrollDirection = "top" | "up" | "down";

type ScrollDirectionOptions = {
  threshold?: number;
  revealAtTop?: number;
  revealAtBottom?: number;
};

/**
 * Shared scroll behavior for chrome that should get out of the way while the
 * user reads, then return as soon as they scroll back up.
 */
export function useScrollDirection({
  threshold = 8,
  revealAtTop = 32,
  revealAtBottom,
}: ScrollDirectionOptions = {}) {
  const [direction, setDirection] = useState<ScrollDirection>("top");

  useEffect(() => {
    let previousY = window.scrollY;
    let frame = 0;

    const update = () => {
      const currentY = Math.max(window.scrollY, 0);
      const distanceFromBottom =
        document.documentElement.scrollHeight -
        (currentY + window.innerHeight);

      if (currentY <= revealAtTop) {
        setDirection("top");
      } else if (
        revealAtBottom !== undefined &&
        distanceFromBottom <= revealAtBottom
      ) {
        setDirection("up");
      } else if (Math.abs(currentY - previousY) >= threshold) {
        setDirection(currentY > previousY ? "down" : "up");
        previousY = currentY;
      }

      frame = 0;
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [revealAtBottom, revealAtTop, threshold]);

  return {
    direction,
    isVisible: direction !== "down",
  };
}
