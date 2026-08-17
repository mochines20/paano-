/**
 * Curated terminal & route database — REAL routes, fares, at schedules
 * mula sa mga grand terminals sa Metro Manila.
 *
 * Terminals Covered:
 * - One Ayala Terminal (Makati)
 * - VTX / Starmall Alabang Terminal (Muntinlupa)
 * - Parañaque Integrated Terminal Exchange (PITX)
 * - Market! Market! & BGC Terminal (Taguig)
 * - Trinoma / SM North EDSA P2P Hub (Quezon City)
 * - Araneta City Cubao Bus Port (Quezon City)
 * - Gil Puyat / Buendia Bus Hub (Pasay/Makati)
 * - EDSA Carousel Stations
 *
 * Source: pitx.ph, oneayala.com, ph.commutetour.com, escapemanila.com (verified Aug 2026)
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

export const TERMINALS: Terminal[] = [
  {
    id: "one-ayala",
    name: "One Ayala Terminal",
    shortName: "One Ayala",
    location: "Ayala Avenue cor EDSA, Makati City (connected to MRT-3 Ayala)",
    routes: [
      {
        origin: "One Ayala",
        destination: "Alabang (VTX / Starmall)",
        operator: "RRCG P2P / City Bus",
        mode: "p2p",
        fare: 60,
        schedule: "5:30 AM - 10:00 PM (daily, every 15-20 min)",
        via: "via SLEX / Skyway",
        travelTimeMin: 35,
        travelTimeMax: 70,
        payment: "Beep / Tripko / Cash",
        notes: "Lower Level (Basement 1). Direct SLEX Express papuntang Alabang.",
      },
      {
        origin: "One Ayala",
        destination: "BGC (Market Market / Uptown)",
        operator: "BGC Bus (Telus Ayala Terminal)",
        mode: "bus",
        fare: 15,
        schedule: "5:00 AM - 12:00 AM",
        via: "via McKinley Road / 5th Ave",
        travelTimeMin: 15,
        travelTimeMax: 30,
        payment: "Beep RFID card only",
        notes: "Terminal sa tapat ng One Ayala (McKinley Exchange). East, West, at North Express routes.",
      },
      {
        origin: "One Ayala",
        destination: "Nuvali / Santa Rosa, Laguna",
        operator: "TAS Trans P2P",
        mode: "p2p",
        fare: 190,
        schedule: "6:00 AM - 9:00 PM",
        via: "via SLEX / CALAX",
        travelTimeMin: 60,
        travelTimeMax: 110,
        payment: "Beep / Cash",
        notes: "Direct P2P sa Nuvali Solenad / Balibago.",
      },
      {
        origin: "One Ayala",
        destination: "Pacita / San Pedro, Laguna",
        operator: "City Bus",
        mode: "bus",
        fare: 65,
        schedule: "5:00 AM - 10:00 PM",
        via: "via SLEX / Susana Heights",
        travelTimeMin: 45,
        travelTimeMax: 85,
      },
      {
        origin: "One Ayala",
        destination: "Antipolo / Masinag",
        operator: "P2P / UV Express",
        mode: "p2p",
        fare: 80,
        schedule: "6:00 AM - 9:00 PM",
        via: "via C5 / Marcos Highway",
        travelTimeMin: 50,
        travelTimeMax: 100,
      },
      {
        origin: "One Ayala",
        destination: "PITX",
        operator: "EDSA Carousel",
        mode: "bus",
        fare: 17,
        schedule: "24 Hours (EDSA Busway)",
        via: "via EDSA / Roxas Blvd",
        travelTimeMin: 20,
        travelTimeMax: 45,
        payment: "Beep / Cash",
        notes: "Ground floor EDSA Busway bay.",
      },
      {
        origin: "One Ayala",
        destination: "Trinoma / SM North EDSA",
        operator: "EDSA Carousel / MRT-3",
        mode: "bus",
        fare: 35,
        schedule: "4:00 AM - 11:00 PM",
        via: "via EDSA Dedicated Busway",
        travelTimeMin: 40,
        travelTimeMax: 75,
        payment: "Beep / Cash",
      },
    ],
  },
  {
    id: "vtx-alabang",
    name: "VTX Starmall Alabang Terminal",
    shortName: "VTX Alabang",
    location: "Starmall / Festival Mall, Alabang, Muntinlupa",
    routes: [
      {
        origin: "VTX Alabang",
        destination: "One Ayala / Makati",
        operator: "RRCG P2P / City Bus",
        mode: "p2p",
        fare: 60,
        schedule: "5:00 AM - 9:30 PM (every 15-20 min)",
        via: "via SLEX / Skyway Direct",
        travelTimeMin: 35,
        travelTimeMax: 70,
        payment: "Beep / Tripko / Cash",
        notes: "Northgate commuters: Sumakay ng e-jeep/tricycle mula Northgate Plaza papuntang VTX/Starmall (₱12–₱15, 5 min) bago sumakay ng P2P.",
      },
      {
        origin: "VTX Alabang",
        destination: "BGC (Market Market)",
        operator: "HM Transport / HM Worthy",
        mode: "p2p",
        fare: 52,
        schedule: "6:00 AM - 8:00 PM (Mon-Sat)",
        via: "via SLEX, C5 Road (Pinagsama, Diego Silang, Upper McKinley)",
        travelTimeMin: 45,
        travelTimeMax: 90,
        payment: "TRIPKO RFID Card",
        notes: "Northgate commuters: Sakay ng e-jeep sa Northgate papuntang VTX/Starmall, tapos direct P2P bus sa Market Market.",
      },
      {
        origin: "VTX Alabang",
        destination: "PITX",
        operator: "Funride / ATSC Bus",
        mode: "bus",
        fare: 46,
        schedule: "4:00 AM - 9:00 PM",
        via: "via Alabang-Zapote Rd, CAVITEX, Coastal",
        travelTimeMin: 45,
        travelTimeMax: 90,
        notes: "Dumadaan sa SM Southmall, Starmall Las Piñas, Zapote.",
      },
      {
        origin: "VTX Alabang",
        destination: "EDSA Shaw / Megamall",
        operator: "RRCG P2P",
        mode: "p2p",
        fare: 65,
        schedule: "6:00 AM - 7:00 PM",
        via: "via SLEX / C5 / EDSA",
        travelTimeMin: 45,
        travelTimeMax: 85,
      },
      {
        origin: "VTX Alabang",
        destination: "Calamba, Laguna",
        operator: "Calamba P2P / St Rose",
        mode: "p2p",
        fare: 100,
        schedule: "6:00 AM - 9:00 PM",
        via: "via SLEX",
        travelTimeMin: 50,
        travelTimeMax: 90,
      },
      {
        origin: "VTX Alabang",
        destination: "Batangas Grand Terminal",
        operator: "Jam Liner / Alps Bus",
        mode: "bus",
        fare: 210,
        schedule: "5:00 AM - 9:00 PM",
        via: "via SLEX / STAR Tollway",
        travelTimeMin: 90,
        travelTimeMax: 150,
      },
    ],
  },
  {
    id: "pitx",
    name: "Parañaque Integrated Terminal Exchange",
    shortName: "PITX",
    location: "Parañaque City (near NAIA / Macapagal Blvd)",
    routes: [
      {
        origin: "PITX",
        destination: "BGC (Uptown / Kalayaan)",
        operator: "Green Frog Hybrid Bus / City Express",
        mode: "bus",
        fare: 40,
        schedule: "5:30 AM - 10:00 PM",
        via: "via Buendia / Kalayaan Ave",
        travelTimeMin: 45,
        travelTimeMax: 90,
        notes: "Gate 8 (Ground Floor). Direct bus papuntang Uptown Mall BGC.",
      },
      {
        origin: "PITX",
        destination: "One Ayala / Makati",
        operator: "EDSA Carousel",
        mode: "bus",
        fare: 17,
        schedule: "24 Hours (Gate 10)",
        via: "via EDSA Dedicated Busway",
        travelTimeMin: 20,
        travelTimeMax: 45,
        payment: "Beep / Cash",
      },
      {
        origin: "PITX",
        destination: "Alabang (Starmall / VTX)",
        operator: "ATSC / Funride",
        mode: "bus",
        fare: 46,
        schedule: "4:00 AM - 9:00 PM (Gate 7)",
        via: "via CAVITEX / Alabang-Zapote Road",
        travelTimeMin: 45,
        travelTimeMax: 90,
      },
      {
        origin: "PITX",
        destination: "NAIA Terminals 1, 2, 3, 4",
        operator: "UBE Express Airport Bus",
        mode: "p2p",
        fare: 40,
        schedule: "6:00 AM - 9:00 PM (every 30-45 min)",
        via: "via NAIA Expressway / Airport Rd",
        travelTimeMin: 15,
        travelTimeMax: 35,
        notes: "Direct loop sa lahat ng 4 NAIA terminals.",
      },
      {
        origin: "PITX",
        destination: "Cubao / Araneta City",
        operator: "EDSA Carousel",
        mode: "bus",
        fare: 46,
        schedule: "24 Hours (Gate 10)",
        via: "via EDSA Busway (Main Ave / Nepa Q-Mart)",
        travelTimeMin: 50,
        travelTimeMax: 95,
      },
      {
        origin: "PITX",
        destination: "Monumento / Caloocan",
        operator: "EDSA Carousel",
        mode: "bus",
        fare: 76,
        schedule: "24 Hours (Gate 10)",
        via: "via EDSA Busway (North Ave / Balintawak / Monumento)",
        travelTimeMin: 75,
        travelTimeMax: 140,
      },
      {
        origin: "PITX",
        destination: "Tagaytay / Mendez",
        operator: "San Agustin / Erjohn",
        mode: "bus",
        fare: 120,
        schedule: "4:00 AM - 9:00 PM (Gate 2)",
        via: "via Emilio Aguinaldo Highway / Silang",
        travelTimeMin: 90,
        travelTimeMax: 160,
      },
    ],
  },
  {
    id: "bgc-terminal",
    name: "Market! Market! & BGC Terminal",
    shortName: "Market Market BGC",
    location: "Bonifacio Global City, Taguig City",
    routes: [
      {
        origin: "BGC (Market Market)",
        destination: "One Ayala / MRT Ayala",
        operator: "BGC Bus (East / West Route)",
        mode: "bus",
        fare: 15,
        schedule: "5:00 AM - 12:00 AM",
        via: "via McKinley Road / 5th Avenue",
        travelTimeMin: 15,
        travelTimeMax: 30,
        payment: "Beep Card only",
      },
      {
        origin: "BGC (Market Market)",
        destination: "Alabang (VTX / Starmall)",
        operator: "HM Transport P2P",
        mode: "p2p",
        fare: 52,
        schedule: "7:00 AM - 8:30 PM",
        via: "via C5 Road / SLEX",
        travelTimeMin: 45,
        travelTimeMax: 90,
        payment: "TRIPKO / Cash",
      },
      {
        origin: "BGC (Market Market)",
        destination: "PITX",
        operator: "Green Frog Hybrid Bus",
        mode: "bus",
        fare: 40,
        schedule: "5:30 AM - 8:00 PM",
        via: "via C5 / Kalayaan / Buendia",
        travelTimeMin: 45,
        travelTimeMax: 90,
      },
      {
        origin: "BGC (Market Market)",
        destination: "Antipolo / Tikling",
        operator: "UV Express / Modern Jeep",
        mode: "van",
        fare: 65,
        schedule: "6:00 AM - 9:00 PM",
        via: "via C5 / Ortigas Ave Extension",
        travelTimeMin: 55,
        travelTimeMax: 110,
      },
      {
        origin: "BGC (Market Market)",
        destination: "Calamba / Nuvali, Laguna",
        operator: "Saint Rose P2P",
        mode: "p2p",
        fare: 195,
        schedule: "6:00 AM - 8:30 PM",
        via: "via C5 / SLEX",
        travelTimeMin: 65,
        travelTimeMax: 120,
      },
    ],
  },
  {
    id: "trinoma-smnorth",
    name: "Trinoma & SM North EDSA P2P Hub",
    shortName: "Trinoma / SM North",
    location: "North Avenue cor EDSA, Quezon City (MRT-3 North Ave)",
    routes: [
      {
        origin: "Trinoma / SM North",
        destination: "One Ayala / Makati",
        operator: "Froehlich P2P / EDSA Carousel",
        mode: "p2p",
        fare: 100,
        schedule: "5:30 AM - 8:30 PM",
        via: "via EDSA / Skyway Stage 3",
        travelTimeMin: 40,
        travelTimeMax: 80,
        notes: "Mabilis kapag P2P Skyway; o Carousel busway for ₱35.",
      },
      {
        origin: "Trinoma / SM North",
        destination: "BGC (Market Market / Uptown)",
        operator: "Froehlich P2P",
        mode: "p2p",
        fare: 100,
        schedule: "6:00 AM - 8:00 PM",
        via: "via C5 / Kalayaan",
        travelTimeMin: 50,
        travelTimeMax: 95,
      },
      {
        origin: "Trinoma / SM North",
        destination: "Clark International Airport",
        operator: "Genesis JoyBus P2P",
        mode: "p2p",
        fare: 350,
        schedule: "3:00 AM - 9:00 PM (every 1-2 hrs)",
        via: "via NLEX / SCTEX",
        travelTimeMin: 90,
        travelTimeMax: 150,
        notes: "Direct airport express mula Trinoma P2P terminal.",
      },
      {
        origin: "Trinoma / SM North",
        destination: "PITX",
        operator: "EDSA Carousel",
        mode: "bus",
        fare: 60,
        schedule: "24 Hours (Dedicated Busway)",
        via: "via EDSA Busway (all stations)",
        travelTimeMin: 60,
        travelTimeMax: 110,
        payment: "Beep / Cash",
      },
    ],
  },
  {
    id: "cubao-araneta",
    name: "Araneta City Cubao Bus Port",
    shortName: "Cubao Terminal",
    location: "General Romulo Ave, Araneta City, Cubao, Quezon City",
    routes: [
      {
        origin: "Cubao",
        destination: "One Ayala / Makati",
        operator: "EDSA Carousel / MRT-3",
        mode: "bus",
        fare: 29,
        schedule: "24 Hours (Carousel) / 5AM-10PM (MRT)",
        via: "via EDSA Dedicated Busway",
        travelTimeMin: 25,
        travelTimeMax: 50,
      },
      {
        origin: "Cubao",
        destination: "BGC (Market Market)",
        operator: "City Bus / Metrolink",
        mode: "bus",
        fare: 45,
        schedule: "5:00 AM - 9:00 PM",
        via: "via C5 Road / Katipunan / Kalayaan",
        travelTimeMin: 40,
        travelTimeMax: 80,
      },
      {
        origin: "Cubao",
        destination: "PITX",
        operator: "EDSA Carousel",
        mode: "bus",
        fare: 46,
        schedule: "24 Hours",
        via: "via EDSA Busway",
        travelTimeMin: 50,
        travelTimeMax: 95,
      },
      {
        origin: "Cubao",
        destination: "Antipolo / Marikina",
        operator: "LRT-2 / Jeep / UV Express",
        mode: "modern_jeep",
        fare: 30,
        schedule: "5:00 AM - 10:00 PM",
        via: "via Aurora Blvd / Marcos Highway",
        travelTimeMin: 30,
        travelTimeMax: 60,
      },
    ],
  },
  {
    id: "buendia-lrt",
    name: "Gil Puyat / Buendia Bus Terminal",
    shortName: "Buendia Hub",
    location: "Taft Ave cor Gil Puyat Ave (LRT-1 Gil Puyat Station)",
    routes: [
      {
        origin: "Buendia (LRT-1)",
        destination: "BGC (Uptown / Market Market)",
        operator: "Green Frog Hybrid Bus / Jeep to Guadalupe",
        mode: "bus",
        fare: 30,
        schedule: "5:30 AM - 10:00 PM",
        via: "via Buendia / Kalayaan",
        travelTimeMin: 25,
        travelTimeMax: 55,
      },
      {
        origin: "Buendia (LRT-1)",
        destination: "PITX",
        operator: "City Bus / Modern Jeep",
        mode: "bus",
        fare: 22,
        schedule: "5:00 AM - 11:00 PM",
        via: "via Roxas Blvd / Macapagal",
        travelTimeMin: 20,
        travelTimeMax: 40,
      },
      {
        origin: "Buendia (LRT-1)",
        destination: "Batangas / Laguna / Quezon",
        operator: "DLTB Co / JAC Liner / JAM",
        mode: "bus",
        fare: 150,
        schedule: "4:00 AM - 11:00 PM",
        via: "via SLEX / ACTEX",
        travelTimeMin: 80,
        travelTimeMax: 180,
        notes: "Major southern provincial bus terminal hub.",
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Lookup & Multi-Hub Matching Helpers                                */
/* ------------------------------------------------------------------ */

const PLACE_ALIASES: Record<string, string[]> = {
  alabang: ["vtx alabang", "starmall alabang", "festival mall", "northgate alabang", "northgate", "alabang town center", "atc", "filinvest alabang"],
  northgate: ["northgate alabang", "northgate cyberzone", "filinvest alabang", "vtx alabang", "starmall alabang"],
  "one ayala": ["one ayala", "oneayala", "ayala terminal", "ayala mrt", "ayala station", "makati", "glorietta", "greenbelt", "ayala avenue"],
  makati: ["one ayala", "ayala mrt", "ayala", "buendia", "poblacion", "glorietta", "greenbelt"],
  bgc: ["market market", "market-market", "bonifacio global city", "uptown bgc", "uptown mall", "fort bonifacio", "high street", "serendra", "mckinley hill"],
  pitx: ["paranaque integrated terminal", "pitx terminal", "coastal terminal"],
  trinoma: ["trinoma", "sm north", "sm north edsa", "north ave", "north avenue", "vertis north", "project 6"],
  cubao: ["cubao", "araneta center", "araneta city", "farmers market", "farmers plaza", "ali mall", "gateway"],
  buendia: ["gil puyat", "buendia lrt", "taft buendia", "sen gil puyat"],
  naia: ["airport", "naia terminal", "ninoy aquino", "terminal 1", "terminal 2", "terminal 3", "terminal 4"],
  moa: ["mall of asia", "sm moa", "seaside boulevard", "pasay moa", "macapagal"],
  nuvali: ["nuvali", "solenad", "santa rosa", "sta rosa", "balibago"],
  clark: ["clark airport", "clark pampanga", "angeles pampanga"],
  tagaytay: ["tagaytay", "mendez", "silang", "nasugbu"],
  antipolo: ["antipolo", "masinag", "tikling", "marcos highway"],
};

export function expandTerminalQuery(query: string): string[] {
  const q = query.toLowerCase().trim();
  const results = [q];
  for (const [key, aliases] of Object.entries(PLACE_ALIASES)) {
    if (q.includes(key)) {
      results.push(...aliases);
    }
    for (const alias of aliases) {
      if (q.includes(alias)) {
        results.push(key, ...aliases.filter((a) => a !== alias));
      }
    }
  }
  return [...new Set(results)];
}

export function findTerminalRoutes(
  originQuery: string,
  destQuery: string,
): TerminalRoute[] {
  const originVariants = expandTerminalQuery(originQuery);
  const destVariants = expandTerminalQuery(destQuery);

  const results: TerminalRoute[] = [];

  for (const terminal of TERMINALS) {
    const terminalMatchesOrigin = originVariants.some(
      (v) =>
        terminal.name.toLowerCase().includes(v) ||
        terminal.shortName.toLowerCase().includes(v) ||
        terminal.location.toLowerCase().includes(v),
    );

    if (terminalMatchesOrigin) {
      for (const route of terminal.routes) {
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

  // Reverse check
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
        if (originMatches && !results.some((r) => r.destination === route.origin && r.origin === route.destination)) {
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

export function findMultiLegRoutes(
  originQuery: string,
  destQuery: string,
): TerminalRoute[][] {
  const direct = findTerminalRoutes(originQuery, destQuery);
  if (direct.length > 0) return [direct];

  const multiLeg: TerminalRoute[][] = [];

  for (const terminal of TERMINALS) {
    const routesToTerminal = findTerminalRoutes(originQuery, terminal.shortName);
    if (routesToTerminal.length === 0) continue;

    const routesFromTerminal = findTerminalRoutes(terminal.shortName, destQuery);
    if (routesFromTerminal.length === 0) continue;

    for (const leg1 of routesToTerminal.slice(0, 2)) {
      for (const leg2 of routesFromTerminal.slice(0, 2)) {
        multiLeg.push([leg1, leg2]);
      }
    }
  }

  return multiLeg.slice(0, 3);
}

export function buildTerminalContext(
  originQuery: string,
  destQuery: string,
): string | null {
  const direct = findTerminalRoutes(originQuery, destQuery);

  if (direct.length > 0) {
    const parts = direct.slice(0, 3).map((r) => {
      const time =
        r.travelTimeMin === r.travelTimeMax
          ? `${r.travelTimeMin} min`
          : `${r.travelTimeMin}–${r.travelTimeMax} min`;
      return `${r.operator}: ${r.origin} → ${r.destination}, ₱${r.fare}, ${time}, ${r.schedule}, ${r.via}${
        r.notes ? `. ${r.notes}` : ""
      }`;
    });
    return `[Terminal route data — REAL routes, gamitin ito: ${parts.join(
      " | ",
    )}. Source: One Ayala, PITX, VTX Alabang, ph.commutetour.com (verified Aug 2026). Huwag mag-suggest ng lumang jeep/MRT transfer kung may direct terminal route.]`;
  }

  const multiLeg = findMultiLegRoutes(originQuery, destQuery);
  if (multiLeg.length > 0) {
    const parts = multiLeg.slice(0, 2).map((legs) => {
      const legStr = legs
        .map((l) => `${l.origin}→${l.destination} (₱${l.fare}, ${l.operator})`)
        .join(" + ");
      const totalFare = legs.reduce((sum, l) => sum + l.fare, 0);
      return `${legStr} = ₱${totalFare} total, ~${timeRange(legs)} min`;
    });
    return `[Terminal route data (multi-leg) — REAL routes, gamitin ito: ${parts.join(
      " | ",
    )}. Source: One Ayala, PITX, VTX, ph.commutetour.com (verified Aug 2026).]`;
  }

  return null;
}

function timeRange(legs: TerminalRoute[]): string {
  const min = legs.reduce((sum, l) => sum + l.travelTimeMin, 0);
  const max = legs.reduce((sum, l) => sum + l.travelTimeMax, 0);
  return `${min}–${max}`;
}
