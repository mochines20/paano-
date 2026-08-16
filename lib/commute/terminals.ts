/**
 * Curated terminal & route database — REAL routes, fares, at schedules
 * mula sa mga grand terminals sa Metro Manila.
 *
 * Source: pitx.ph, ph.commutetour.com, escapemanila.com (verified Aug 2026)
 *
 * Ito ang nag-a-address ng problema kung saan nag-i-invent ang LLM ng
 * mga route (hal. jeep → LRT → MRT) imbes na gamitin ang totoong
 * direct bus routes mula sa terminals.
 */

export interface TerminalRoute {
  /** Origin terminal name */
  origin: string;
  /** Destination terminal o stop */
  destination: string;
  /** Transport company o operator */
  operator: string;
  /** Mode ng transport */
  mode: "bus" | "p2p" | "modern_jeep" | "jeep" | "van";
  /** Fixed fare sa PHP (hindi per-km formula) */
  fare: number;
  /** Schedule (first trip - last trip) */
  schedule: string;
  /** Route description / via */
  via: string;
  /** Estimated travel time sa minutes */
  travelTimeMin: number;
  /** Travel time max (para sa traffic) */
  travelTimeMax: number;
  /** Payment method */
  payment?: string;
  /** Additional notes */
  notes?: string;
}

export interface Terminal {
  id: string;
  name: string;
  shortName: string;
  location: string;
  /** Mga routes mula sa terminal na ito */
  routes: TerminalRoute[];
}

/**
 * Mga pangunahing terminal sa Metro Manila at kanilang routes.
 * Ang fares ay FIXED per route — hindi per-km formula.
 */
export const TERMINALS: Terminal[] = [
  {
    id: "pitx",
    name: "Parañaque Integrated Terminal Exchange",
    shortName: "PITX",
    location: "Parañaque City (coastal road, near NAIA)",
    routes: [
      {
        origin: "PITX",
        destination: "BGC (Uptown)",
        operator: "Green Frog Hybrid Bus",
        mode: "bus",
        fare: 40,
        schedule: "5:30 AM - 10:00 PM (weekday), 6:30 AM - 10:00 AM + 4:00 PM - 10:00 PM (Sat)",
        via: "via Buendia, Makati",
        travelTimeMin: 45,
        travelTimeMax: 90,
        payment: "Cash/Beep",
        notes: "Gate 8 sa ground floor. Direct bus, walang transfer.",
      },
      {
        origin: "PITX",
        destination: "BGC (Kalayaan/Circuit Makati)",
        operator: "P2P Bus",
        mode: "p2p",
        fare: 45,
        schedule: "9:30 AM - 9:00 PM (hourly)",
        via: "via Buendia",
        travelTimeMin: 40,
        travelTimeMax: 80,
        notes: "Stops: Kalayaan Stop 1, Landmark Stop 2, Circuit Makati",
      },
      {
        origin: "PITX",
        destination: "Alabang (Starmall/VTX)",
        operator: "Multiple (ATSC, Funride)",
        mode: "bus",
        fare: 46,
        schedule: "4:00 AM - 9:00 PM",
        via: "via Coastal Road / CAVITEX",
        travelTimeMin: 45,
        travelTimeMax: 90,
        notes: "Gate 7. Dumadaan sa SM Southmall, Starmall Las Piñas, Zapote.",
      },
      {
        origin: "PITX",
        destination: "Ayala (MRT)",
        operator: "EDSA Carousel",
        mode: "bus",
        fare: 17,
        schedule: "4:00 AM - 10:00 PM",
        via: "via EDSA Busway",
        travelTimeMin: 30,
        travelTimeMax: 60,
        payment: "Beep RFID",
        notes: "Gate 10. EDSA Carousel — walang stop sa traffic, dedicated busway.",
      },
      {
        origin: "PITX",
        destination: "Buendia (Gil Puyat)",
        operator: "EDSA Carousel",
        mode: "bus",
        fare: 26,
        schedule: "4:00 AM - 10:00 PM",
        via: "via EDSA Busway",
        travelTimeMin: 25,
        travelTimeMax: 50,
        payment: "Beep RFID",
      },
      {
        origin: "PITX",
        destination: "Cubao",
        operator: "EDSA Carousel",
        mode: "bus",
        fare: 46,
        schedule: "4:00 AM - 10:00 PM",
        via: "via EDSA Busway",
        travelTimeMin: 50,
        travelTimeMax: 100,
        payment: "Beep RFID",
      },
      {
        origin: "PITX",
        destination: "Monumento",
        operator: "EDSA Carousel",
        mode: "bus",
        fare: 76,
        schedule: "4:00 AM - 10:00 PM",
        via: "via EDSA Busway (full length)",
        travelTimeMin: 80,
        travelTimeMax: 150,
        payment: "Beep RFID",
      },
      {
        origin: "PITX",
        destination: "NAIA Terminal 1/2/3/4",
        operator: "UBE Express",
        mode: "bus",
        fare: 40,
        schedule: "6:00 AM - 9:30 PM (multiple trips)",
        via: "via Airport Road",
        travelTimeMin: 20,
        travelTimeMax: 40,
        notes: "P2P airport bus. May specific schedule per terminal.",
      },
      {
        origin: "PITX",
        destination: "SM Mall of Asia",
        operator: "Green Frog / City Bus",
        mode: "bus",
        fare: 25,
        schedule: "5:30 AM - 8:00 PM",
        via: "via Macapagal Blvd",
        travelTimeMin: 20,
        travelTimeMax: 40,
      },
      {
        origin: "PITX",
        destination: "Quezon Avenue",
        operator: "EDSA Carousel / City Bus",
        mode: "bus",
        fare: 57,
        schedule: "4:00 AM - 10:00 PM",
        via: "via EDSA Busway",
        travelTimeMin: 60,
        travelTimeMax: 120,
        payment: "Beep RFID",
      },
    ],
  },
  {
    id: "vtx-alabang",
    name: "VTX Starmall Alabang Terminal",
    shortName: "VTX Alabang",
    location: "Festival Mall / Starmall Alabang, Muntinlupa",
    routes: [
      {
        origin: "VTX Alabang",
        destination: "BGC (Market Market)",
        operator: "HM Transport / HM Worthy",
        mode: "p2p",
        fare: 52,
        schedule: "6:00 AM - 8:00 PM (weekday), 6:00 AM - 7:00 PM (Sat)",
        via: "via SLEX, C5 Road",
        travelTimeMin: 45,
        travelTimeMax: 90,
        payment: "TRIPKO RFID Card",
        notes: "Direct P2P bus. Stops: Pinagsama, Diego Silang, Upper McKinley, Market Market.",
      },
      {
        origin: "VTX Alabang",
        destination: "PITX",
        operator: "Multiple (Funride, ATSC)",
        mode: "bus",
        fare: 46,
        schedule: "4:00 AM - 9:00 PM",
        via: "via Coastal Road / CAVITEX",
        travelTimeMin: 45,
        travelTimeMax: 90,
        notes: "Dumadaan sa SM Southmall, Starmall Las Piñas, Zapote.",
      },
      {
        origin: "VTX Alabang",
        destination: "Ayala / Makati",
        operator: "RRCG P2P",
        mode: "p2p",
        fare: 60,
        schedule: "5:30 AM - 7:30 PM",
        via: "via SLEX / EDSA",
        travelTimeMin: 40,
        travelTimeMax: 80,
        notes: "P2P bus, walang stop. Direct sa Glorietta/Ayala.",
      },
      {
        origin: "VTX Alabang",
        destination: "EDSA Shaw",
        operator: "RRCG P2P",
        mode: "p2p",
        fare: 55,
        schedule: "6:00 AM - 6:00 PM",
        via: "via SLEX / EDSA",
        travelTimeMin: 40,
        travelTimeMax: 75,
      },
      {
        origin: "VTX Alabang",
        destination: "Calamba, Laguna",
        operator: "Calamba P2P / St Rose",
        mode: "p2p",
        fare: 195,
        schedule: "6:00 AM - 9:00 PM (selected trips)",
        via: "via SLEX",
        travelTimeMin: 90,
        travelTimeMax: 150,
      },
      {
        origin: "VTX Alabang",
        destination: "Batangas City",
        operator: "Jam Liner / Alps",
        mode: "bus",
        fare: 250,
        schedule: "5:00 AM - 9:00 PM",
        via: "via SLEX / STAR Tollway",
        travelTimeMin: 120,
        travelTimeMax: 180,
      },
    ],
  },
  {
    id: "bgc-terminal",
    name: "Market Market BGC Terminal",
    shortName: "Market Market BGC",
    location: "Market Market mall, Bonifacio Global City, Taguig",
    routes: [
      {
        origin: "BGC (Market Market)",
        destination: "Alabang (VTX/Starmall)",
        operator: "HM Transport",
        mode: "p2p",
        fare: 46,
        schedule: "7:00 AM - 7:30 PM",
        via: "via C5 / SLEX",
        travelTimeMin: 45,
        travelTimeMax: 90,
        notes: "Direct P2P bus back to Alabang.",
      },
      {
        origin: "BGC (Market Market)",
        destination: "Ayala MRT",
        operator: "BGC Bus (East/West Route)",
        mode: "bus",
        fare: 15,
        schedule: "5:00 AM - 12:00 AM",
        via: "via 5th Avenue / McKinley",
        travelTimeMin: 15,
        travelTimeMax: 30,
        payment: "Beep RFID",
        notes: "BGC Bus — East, West, at Central routes. Frequent trips.",
      },
      {
        origin: "BGC (Market Market)",
        destination: "PITX",
        operator: "Green Frog Hybrid Bus",
        mode: "bus",
        fare: 40,
        schedule: "5:30 AM - 8:00 PM",
        via: "via C5 / Buendia",
        travelTimeMin: 45,
        travelTimeMax: 90,
      },
      {
        origin: "BGC (Market Market)",
        destination: "Antipolo",
        operator: "Van",
        mode: "van",
        fare: 60,
        schedule: "1:00 PM - 9:00 PM",
        via: "via C5 / Marcos Highway",
        travelTimeMin: 60,
        travelTimeMax: 120,
      },
      {
        origin: "BGC (Market Market)",
        destination: "Dasmariñas, Cavite",
        operator: "Alabang Metrolink",
        mode: "bus",
        fare: 110,
        schedule: "7:00 AM - 10:00 PM",
        via: "via SLEX / Aguinaldo Highway",
        travelTimeMin: 90,
        travelTimeMax: 150,
      },
    ],
  },
  {
    id: "ayala-busway",
    name: "EDSA Busway Stations",
    shortName: "EDSA Carousel",
    location: "EDSA Busway (dedicated lane, entire EDSA)",
    routes: [
      {
        origin: "PITX",
        destination: "Heritage Hotel",
        operator: "EDSA Carousel",
        mode: "bus",
        fare: 15,
        schedule: "4:00 AM - 10:00 PM",
        via: "via Macapagal Blvd",
        travelTimeMin: 15,
        travelTimeMax: 30,
        payment: "Beep RFID",
      },
      {
        origin: "PITX",
        destination: "MRT Taft",
        operator: "EDSA Carousel",
        mode: "bus",
        fare: 15,
        schedule: "4:00 AM - 10:00 PM",
        via: "via Macapagal Blvd",
        travelTimeMin: 15,
        travelTimeMax: 30,
        payment: "Beep RFID",
      },
      {
        origin: "Ayala (EDSA)",
        destination: "Buendia",
        operator: "EDSA Carousel",
        mode: "bus",
        fare: 13,
        schedule: "4:00 AM - 10:00 PM",
        via: "via EDSA Busway",
        travelTimeMin: 10,
        travelTimeMax: 25,
        payment: "Beep RFID",
      },
      {
        origin: "Ayala (EDSA)",
        destination: "Ortigas",
        operator: "EDSA Carousel",
        mode: "bus",
        fare: 16,
        schedule: "4:00 AM - 10:00 PM",
        via: "via EDSA Busway",
        travelTimeMin: 15,
        travelTimeMax: 35,
        payment: "Beep RFID",
      },
      {
        origin: "Ayala (EDSA)",
        destination: "Cubao",
        operator: "EDSA Carousel",
        mode: "bus",
        fare: 29,
        schedule: "4:00 AM - 10:00 PM",
        via: "via EDSA Busway",
        travelTimeMin: 25,
        travelTimeMax: 50,
        payment: "Beep RFID",
      },
    ],
  },
  {
    id: "c5-bus",
    name: "C5 / BGC Bus Routes",
    shortName: "BGC Bus",
    location: "BGC area, Taguig",
    routes: [
      {
        origin: "BGC (Market Market)",
        destination: "Ayala MRT / McKinley Exchange",
        operator: "BGC Bus (East Route)",
        mode: "bus",
        fare: 15,
        schedule: "5:00 AM - 12:00 AM",
        via: "via 5th Avenue, 11th Avenue",
        travelTimeMin: 15,
        travelTimeMax: 30,
        payment: "Beep RFID",
        notes: "East Route — via 5th Ave, 11th Ave, 32nd St, McKinley",
      },
      {
        origin: "BGC (Market Market)",
        destination: "Ayala MRT / McKinley Exchange",
        operator: "BGC Bus (West Route)",
        mode: "bus",
        fare: 15,
        schedule: "5:00 AM - 11:00 PM",
        via: "via 26th Street, Rizal Drive",
        travelTimeMin: 15,
        travelTimeMax: 30,
        payment: "Beep RFID",
        notes: "West Route — via 26th St, Rizal Dr, 5th Ave",
      },
      {
        origin: "BGC (Market Market)",
        destination: "BGC Loop",
        operator: "BGC Bus (Central Route)",
        mode: "bus",
        fare: 15,
        schedule: "5:00 AM - 12:00 AM",
        via: "BGC internal loop",
        travelTimeMin: 10,
        travelTimeMax: 20,
        payment: "Beep RFID",
        notes: "Central Route — loop around BGC",
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Lookup helpers                                                      */
/* ------------------------------------------------------------------ */

/** Place aliases — para sa matching ng user query sa terminal names */
const PLACE_ALIASES: Record<string, string[]> = {
  alabang: ["vtx alabang", "starmall alabang", "festival mall", "northgate alabang", "alabang town center", "atc"],
  bgc: ["market market", "market-market", "bonifacio global city", "uptown bgc", "fort bonifacio", "bgc terminal"],
  pitx: ["paranaque integrated terminal", "pitx terminal"],
  ayala: ["ayala mrt", "ayala station", "glorietta", "makati", "ayala avenue"],
  cubao: ["cubao", "araneta center", "farmers"],
  "edsa shaw": ["shaw boulevard", "edsa shaw", "shangri la"],
  "naia": ["airport", "naia terminal", "ninoy aquino", "airport terminal"],
  "moa": ["mall of asia", "sm moa", "seaside boulevard"],
  "monumento": ["monumento", "caloocan"],
};

/** I-expand ang query kasama ang aliases */
export function expandTerminalQuery(query: string): string[] {
  const q = query.toLowerCase().trim();
  const results = [q];
  for (const [key, aliases] of Object.entries(PLACE_ALIASES)) {
    if (q.includes(key)) {
      results.push(...aliases);
    }
    // Check kung ang query ay alias mismo
    for (const alias of aliases) {
      if (q.includes(alias)) {
        results.push(key, ...aliases.filter((a) => a !== alias));
      }
    }
  }
  return [...new Set(results)];
}

/**
 * Hanapin ang direct routes mula sa origin papuntang destination.
 * Gumagamit ng fuzzy matching para sa place names.
 */
export function findTerminalRoutes(
  originQuery: string,
  destQuery: string,
): TerminalRoute[] {
  const originVariants = expandTerminalQuery(originQuery);
  const destVariants = expandTerminalQuery(destQuery);

  const results: TerminalRoute[] = [];

  for (const terminal of TERMINALS) {
    // Check kung ang terminal ay match sa origin
    const terminalMatchesOrigin = originVariants.some(
      (v) =>
        terminal.name.toLowerCase().includes(v) ||
        terminal.shortName.toLowerCase().includes(v) ||
        terminal.location.toLowerCase().includes(v),
    );

    if (terminalMatchesOrigin) {
      for (const route of terminal.routes) {
        // Check kung ang route destination ay match sa dest query
        const destMatches = destVariants.some(
          (v) =>
            route.destination.toLowerCase().includes(v) ||
            v.includes(route.destination.toLowerCase()),
        );
        if (destMatches) {
          results.push(route);
        }
      }
    }
  }

  // Also check reverse routes (dest → origin)
  for (const terminal of TERMINALS) {
    const terminalMatchesDest = destVariants.some(
      (v) =>
        terminal.name.toLowerCase().includes(v) ||
        terminal.shortName.toLowerCase().includes(v),
    );

    if (terminalMatchesDest) {
      for (const route of terminal.routes) {
        const originMatches = originVariants.some(
          (v) =>
            route.destination.toLowerCase().includes(v) ||
            v.includes(route.destination.toLowerCase()),
        );
        if (originMatches && !results.some((r) => r === route)) {
          // Reverse route — mark it
          results.push({
            ...route,
            origin: route.destination,
            destination: route.origin,
            notes: `${route.notes ?? ""} (Return trip available)`.trim(),
          });
        }
      }
    }
  }

  return results;
}

/**
 * Hanapin ang lahat ng routes mula sa isang lugar (origin only).
 * Para sa "paano magcommute mula sa Alabang" na walang specific dest.
 */
export function findRoutesFromOrigin(originQuery: string): TerminalRoute[] {
  const originVariants = expandTerminalQuery(originQuery);
  const results: TerminalRoute[] = [];

  for (const terminal of TERMINALS) {
    const terminalMatchesOrigin = originVariants.some(
      (v) =>
        terminal.name.toLowerCase().includes(v) ||
        terminal.shortName.toLowerCase().includes(v) ||
        terminal.location.toLowerCase().includes(v),
    );

    if (terminalMatchesOrigin) {
      results.push(...terminal.routes);
    }
  }

  return results;
}

/**
 * Hanapin ang multi-leg routes (origin → transfer → destination).
 * Hal. Alabang → PITX → BGC
 */
export function findMultiLegRoutes(
  originQuery: string,
  destQuery: string,
): TerminalRoute[][] {
  const direct = findTerminalRoutes(originQuery, destQuery);
  if (direct.length > 0) return [direct];

  // Try 1-transfer routes: origin → X → dest
  const multiLeg: TerminalRoute[][] = [];

  for (const terminal of TERMINALS) {
    // Check kung may route mula sa origin papuntang sa terminal na ito
    const routesToTerminal = findTerminalRoutes(originQuery, terminal.shortName);
    if (routesToTerminal.length === 0) continue;

    // Check kung may route mula sa terminal na ito papuntang dest
    const routesFromTerminal = findTerminalRoutes(terminal.shortName, destQuery);
    if (routesFromTerminal.length === 0) continue;

    // Combine: origin → terminal → dest
    for (const leg1 of routesToTerminal.slice(0, 2)) {
      for (const leg2 of routesFromTerminal.slice(0, 2)) {
        multiLeg.push([leg1, leg2]);
      }
    }
  }

  return multiLeg.slice(0, 3); // Top 3 options
}

/**
 * Build ng context string para sa LLM grounding.
 * Ito ang nagdidikit ng real terminal data sa user question.
 */
export function buildTerminalContext(
  originQuery: string,
  destQuery: string,
): string | null {
  const direct = findTerminalRoutes(originQuery, destQuery);

  if (direct.length > 0) {
    const parts = direct.slice(0, 3).map((r) => {
      const time = r.travelTimeMin === r.travelTimeMax
        ? `${r.travelTimeMin} min`
        : `${r.travelTimeMin}–${r.travelTimeMax} min`;
      return `${r.operator}: ${r.origin} → ${r.destination}, ₱${r.fare}, ${time}, ${r.schedule}, ${r.via}${r.notes ? `. ${r.notes}` : ""}`;
    });
    return `[Terminal route data — REAL routes, gamitin ito: ${parts.join(" | ")}. Source: pitx.ph, ph.commutetour.com (verified Aug 2026). Huwag mag-suggest ng ibang route kung hindi ito ang actual.]`;
  }

  // Try multi-leg
  const multiLeg = findMultiLegRoutes(originQuery, destQuery);
  if (multiLeg.length > 0) {
    const parts = multiLeg.slice(0, 2).map((legs) => {
      const legStr = legs.map((l) => `${l.origin}→${l.destination} (₱${l.fare}, ${l.operator})`).join(" + ");
      const totalFare = legs.reduce((sum, l) => sum + l.fare, 0);
      return `${legStr} = ₱${totalFare} total, ~${timeRange(legs)} min`;
    });
    return `[Terminal route data (multi-leg) — REAL routes, gamitin ito: ${parts.join(" | ")}. Source: pitx.ph, ph.commutetour.com (verified Aug 2026). Huwag mag-suggest ng ibang route kung hindi ito ang actual.]`;
  }

  return null;
}

function timeRange(legs: TerminalRoute[]): string {
  const min = legs.reduce((sum, l) => sum + l.travelTimeMin, 0);
  const max = legs.reduce((sum, l) => sum + l.travelTimeMax, 0);
  return `${min}–${max}`;
}
