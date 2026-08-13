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
