import type { PaanoAnswer } from "@/lib/answers";

/**
 * Shared category metadata para sa answer sections.
 * Ang mga kulay ay Tailwind palette classes na may dark: variants para
 * hindi naaasar ang contrast sa light mode (walang !important overrides).
 */

export interface CategoryMeta {
  label: string;
  badge: string;
  bar: string;
  tint: string;
  border: string;
  accentText: string;
}

export const CATEGORY_META = {
  cooking: {
    label: "Lutong Bahay",
    badge: "bg-blue-500/15 text-blue-700 ring-blue-500/30 dark:text-blue-300",
    bar: "bg-blue-600",
    tint: "bg-blue-500/5",
    border: "border-blue-500/20",
    accentText: "text-blue-700 dark:text-blue-300",
  },
  commute: {
    label: "Commute",
    badge: "bg-sky-500/15 text-sky-700 ring-sky-500/30 dark:text-sky-300",
    bar: "bg-sky-500",
    tint: "bg-sky-500/5",
    border: "border-sky-500/20",
    accentText: "text-sky-600 dark:text-sky-400",
  },
  diy: {
    label: "Gawaing Bahay",
    badge: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300",
    bar: "bg-emerald-500",
    tint: "bg-emerald-500/5",
    border: "border-emerald-500/20",
    accentText: "text-emerald-600 dark:text-emerald-400",
  },
  first_aid: {
    label: "First Aid",
    badge: "bg-rose-500/15 text-rose-700 ring-rose-500/30 dark:text-rose-300",
    bar: "bg-rose-500",
    tint: "bg-rose-500/5",
    border: "border-rose-500/20",
    accentText: "text-rose-600 dark:text-rose-400",
  },
  docs: {
    label: "Docs Guide",
    badge: "bg-blue-500/15 text-blue-700 ring-blue-500/30 dark:text-blue-300",
    bar: "bg-blue-600",
    tint: "bg-blue-500/5",
    border: "border-blue-500/20",
    accentText: "text-blue-700 dark:text-blue-300",
  },
  generic: {
    label: "Gabay",
    badge: "bg-panel text-body ring-line-strong",
    bar: "bg-accent",
    tint: "bg-panel",
    border: "border-line",
    accentText: "text-accent",
  },
} as const satisfies Record<PaanoAnswer["category"], CategoryMeta>;

export const CONFIDENCE_LABEL = {
  high: "Mataas ang kumpiyansa — na-cross-check o official process",
  medium: "Katamtaman — tantiya o maaaring magbago",
  low: "Mababa — i-verify sa opisyal na source",
} as const;

export const MODE_LABELS: Record<string, string> = {
  jeepney: "Jeepney",
  bus: "Bus",
  p2p: "P2P Bus",
  lrt: "LRT",
  mrt: "MRT",
  tricycle: "Tricycle",
  uv: "UV Express",
  ferry: "Pasig Ferry",
  walk: "Lakad",
};
