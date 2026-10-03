/** Thin-stroke line icons para sa feature cards (24x24, stroke-based). */

interface IconProps {
  className?: string;
}

function base(className?: string) {
  return {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
}

/** Commute — ruta na may dalawang stop at dashed line. */
export function IconCommute({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <circle cx="5" cy="18" r="1.6" />
      <circle cx="19" cy="6" r="1.6" />
      <path d="M6.4 17.2c3.6-1.6 6-4 7.8-8.4" strokeDasharray="2 2.5" />
      <path d="M2.5 18h5M16.5 6h5" />
    </svg>
  );
}

/** Lutong bahay — kaldero na may singaw. */
export function IconCooking({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M4 10.5h16v3.5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3.5z" />
      <path d="M2.5 10.5h19" />
      <path d="M10.5 10.5V7.5M13.5 10.5V7.5" />
      <path d="M8 4.5l.8 1.6M16 4.5l-.8 1.6" />
    </svg>
  );
}

/** Gawa-bahay — wrench. */
export function IconDiy({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M14.5 6.7a4.3 4.3 0 0 0-5.8 5.8L3.5 17.7a1.9 1.9 0 0 0 2.8 2.8l5.2-5.2a4.3 4.3 0 0 0 5.8-5.8l-2.6 2.6-2.9-2.9 2.7-2.5z" />
      <path d="M17.5 2.5l1.5 1.5" />
    </svg>
  );
}

/** First aid — krus sa rounded square. */
export function IconFirstAid({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <rect x="4.5" y="4.5" width="15" height="15" rx="3.5" />
      <path d="M12 8.5v7M8.5 12h7" />
    </svg>
  );
}

/** Docs — papel na may linya. */
export function IconDocs({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M6.5 3.5h7l4 4v13h-11v-17z" />
      <path d="M13.5 3.5v4h4" />
      <path d="M9 13h6M9 16.5h6" />
    </svg>
  );
}

/* ── UI icons (pumalit sa mga emoji) ─────────────────────────────── */

/** Trending — apoy. */
export function IconFlame({ className }: IconProps) {
  return (
    <svg {...base(className)} strokeWidth={1.8}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

/** Peso sign — para sa budget/cost sections. */
export function IconPeso({ className }: IconProps) {
  return (
    <svg {...base(className)} strokeWidth={1.8}>
      <path d="M8 20V4" />
      <path d="M8 4h4.5a4 4 0 0 1 0 8H8" />
      <path d="M4.5 7.5h11M4.5 10.5h11" />
    </svg>
  );
}

/** Swap/substitute — umiikot na arrows. */
export function IconSwap({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="m17 2.5 3.5 3.5-3.5 3.5" />
      <path d="M3.5 11v-1a4 4 0 0 1 4-4h13" />
      <path d="m7 21.5-3.5-3.5L7 14.5" />
      <path d="M20.5 13v1a4 4 0 0 1-4 4h-13" />
    </svg>
  );
}

/** Checklist na may check — docs requirements. */
export function IconClipboardCheck({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <rect x="9" y="2.5" width="6" height="3.5" rx="1" />
      <path d="M9 4.25H6.5a2 2 0 0 0-2 2v12.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V6.25a2 2 0 0 0-2-2H15" />
      <path d="m9 13.5 2.2 2.2L15.5 11" />
    </svg>
  );
}

/** Warning triangle. */
export function IconAlert({ className }: IconProps) {
  return (
    <svg {...base(className)} strokeWidth={1.8}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

/** Timer/stopwatch. */
export function IconTimer({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <circle cx="12" cy="13.5" r="7" />
      <path d="M12 13.5V10" />
      <path d="M9.5 2.5h5" />
      <path d="M12 2.5V6" />
    </svg>
  );
}

/** Check circle — success/completion. */
export function IconCheckCircle({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12.5 2.5 2.5 4.8-5.5" />
    </svg>
  );
}

/** Arrow right (maliit, para sa lists). */
export function IconArrowRight({ className }: IconProps) {
  return (
    <svg {...base(className)} strokeWidth={2}>
      <path d="M4.5 12h15" />
      <path d="m13.5 6 6 6-6 6" />
    </svg>
  );
}

/* ── Commute mode icons (para sa CommuteForm mode selector) ──────── */

/** Jeepney — classic PUJ body. */
export function IconJeepney({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M3 18.5V9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9.5" />
      <path d="M3 12.5h18" />
      <path d="M12 7v5.5" />
      <circle cx="7.5" cy="19.5" r="1.5" />
      <circle cx="16.5" cy="19.5" r="1.5" />
    </svg>
  );
}

/** Bus — mas malaking sasakyan na may apat na bintana. */
export function IconBus({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <rect x="3.5" y="4.5" width="17" height="14" rx="2.5" />
      <path d="M3.5 12h17" />
      <path d="M8 4.5V12M16 4.5V12" />
      <path d="M7 21.5l1-3M17 21.5l-1-3" />
    </svg>
  );
}

/** Train/LRT/MRT — bintana at riles. */
export function IconTrain({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <rect x="5.5" y="3" width="13" height="14.5" rx="3" />
      <path d="M5.5 10.5h13" />
      <path d="M9.5 20.5 8 17.5M14.5 20.5l1.5-3" />
      <path d="M12 13.75h.01" />
    </svg>
  );
}

/** Van/UV Express. */
export function IconVan({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M2.5 16.5v-7A1.5 1.5 0 0 1 4 8h8.5l4.5 4.5h2.5a1.5 1.5 0 0 1 1.5 1.5v2.5h-2" />
      <path d="M9 16.5h5.5" />
      <circle cx="6.5" cy="17.5" r="1.7" />
      <circle cx="17.5" cy="17.5" r="1.7" />
    </svg>
  );
}

/** Tricycle — motor na may sidecar. */
export function IconTricycle({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <circle cx="17" cy="17.5" r="2.5" />
      <circle cx="6.5" cy="17.5" r="2.5" />
      <path d="M6.5 15V9h7l3.5 6" />
      <path d="M6.5 9 5 6.5h2.5" />
      <path d="M13.5 15H14.5" />
    </svg>
  );
}

/** Walk — taong naglalakad. */
export function IconWalk({ className }: IconProps) {
  return (
    <svg {...base(className)} strokeWidth={1.8}>
      <circle cx="13" cy="4.5" r="1.9" />
      <path d="M12.7 8.5 11 13l2.5 2.5 1 5.5" />
      <path d="M11 13l-2.5 1.5L7 19" />
      <path d="m12.7 8.5 3 .5 2 2.5" />
    </svg>
  );
}

/** Siren/emergency. */
export function IconSiren({ className }: IconProps) {
  return (
    <svg {...base(className)} strokeWidth={1.8}>
      <path d="M7 12a5 5 0 0 1 10 0v6H7v-6z" />
      <path d="M5 20.5h14" />
      <path d="M12 2.5V4M4.3 5.3l1.1 1.1M19.7 5.3l-1.1 1.1" />
    </svg>
  );
}

/** Phone handset (para sa hotlines). */
export function IconPhone({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
