"use client";

import { useScrollDirection } from "@/components/useScrollDirection";

export function DirectionalFooter() {
  const { direction, isVisible } = useScrollDirection({ revealAtBottom: 160 });

  return (
    <footer
      data-scroll-direction={direction}
      data-scroll-visible={isVisible}
      className={`mt-auto border-t border-line px-4 py-5 text-center text-xs leading-relaxed text-muted backdrop-blur-sm transition-transform duration-200 ease-out sm:py-6 sm:text-[13px] ${
        isVisible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      PAANO — impormasyon lamang. Hindi ito opisyal na source ng gobyerno,
      doktor, o abogado.
    </footer>
  );
}
