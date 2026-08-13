/**
 * Palengke prices — para sa budget/pantry cooking questions.
 *
 * Primary source: DA "Bantay Presyo" daily price bulletin (NCR wet markets,
 * inilalathala bilang PDF — wala pang malinis na API). Para sa MVP:
 *  - kung naka-set ang DA_PRICE_URL (JSON array [{item, pricePerKg}]),
 *    i-fetch na may 12-hour cache;
 *  - kung hindi, gamitin ang FALLBACK_PRICES na malinaw na naka-label na
 *    "tantiya — maaaring magbago".
 *
 * NOTE: hindi naka-freeze ang mga presyo — laging may "i-verify sa palengke"
 * sa sagot (trust rule).
 */

export interface PalengkePrice {
  item: string;
  pricePerKg: number;
  unit?: string;
}

/** Karaniwang presyo sa NCR palengke (tantiya, Aug 2026). */
const FALLBACK_PRICES: PalengkePrice[] = [
  { item: "manok (buo)", pricePerKg: 180 },
  { item: "baboy (liempo)", pricePerKg: 350 },
  { item: "baboy (kasim)", pricePerKg: 300 },
  { item: "baka (karneng baka)", pricePerKg: 480 },
  { item: "galunggong", pricePerKg: 220 },
  { item: "tilapia", pricePerKg: 160 },
  { item: "itlog", pricePerKg: 190, unit: "per tray (30 pcs)" },
  { item: "bigas (regular)", pricePerKg: 52 },
  { item: "sibuyas", pricePerKg: 120 },
  { item: "bawang", pricePerKg: 110 },
  { item: "kamatis", pricePerKg: 60 },
  { item: "patatas", pricePerKg: 95 },
  { item: "repolyo", pricePerKg: 70 },
  { item: "kangkong", pricePerKg: 45 },
  { item: "sitaw", pricePerKg: 80 },
  { item: "talong", pricePerKg: 70 },
  { item: "mantika", pricePerKg: 105, unit: "per litro" },
];

export const PRICE_SOURCE_NOTE =
  "Palengke prices (NCR, tantiya batay sa DA Bantay Presyo) — maaaring magbago; i-verify sa inyong palengke.";

const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
let cache: { at: number; prices: PalengkePrice[] } | null = null;

/** Kunin ang presyo — DA fetch (kung naka-configure) o fallback table. */
export async function getPalengkePrices(): Promise<PalengkePrice[]> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.prices;

  const url = process.env.DA_PRICE_URL;
  if (url) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const data = (await res.json()) as { item?: string; pricePerKg?: number }[];
        const prices = (Array.isArray(data) ? data : [])
          .filter((d) => typeof d?.item === "string" && typeof d?.pricePerKg === "number")
          .map((d) => ({ item: d.item!, pricePerKg: d.pricePerKg! }))
          .slice(0, 60);
        if (prices.length > 0) {
          cache = { at: Date.now(), prices };
          return prices;
        }
      }
    } catch {
      /* fallback sa table */
    }
  }

  cache = { at: Date.now(), prices: FALLBACK_PRICES };
  return FALLBACK_PRICES;
}

/** Hanapin ang presyo para sa isang item (substring match). */
export function findPrice(prices: PalengkePrice[], item: string): PalengkePrice | undefined {
  const q = item.toLowerCase();
  return prices.find(
    (p) => p.item.toLowerCase().includes(q) || q.includes(p.item.toLowerCase()),
  );
}
