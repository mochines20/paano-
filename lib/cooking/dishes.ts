/**
 * Curated Filipino dish map — para sa image→recipe (Sprint 3).
 *
 * Hindi ito recipe database; ito ay "kung anong ulam ang kaya ng mga
 * sangkap na ito" — ang LLM ang gumagawa ng recipe steps, ang listahang
 * ito ang nagpapa-ground sa mga tunay na lutong bahay na ulam.
 */

export interface Dish {
  name: string;
  /** Mga pangunahing sangkap (para sa overlap matching). */
  keyIngredients: string[];
  notes?: string;
}

export const DISHES: Dish[] = [
  { name: "Chicken Adobo", keyIngredients: ["manok", "toyo", "suka", "bawang", "laurel", "paminta"] },
  { name: "Pork Adobo", keyIngredients: ["baboy", "toyo", "suka", "bawang", "laurel"] },
  { name: "Sinigang na Baboy", keyIngredients: ["baboy", "sampalok", "kangkong", "sitaw", "talong", "kamatis", "sibuyas"] },
  { name: "Sinigang na Manok", keyIngredients: ["manok", "sampalok", "kangkong", "kamatis", "sibuyas"] },
  { name: "Tinolang Manok", keyIngredients: ["manok", "luya", "sayote", "malunggay", "bawang", "sibuyas"] },
  { name: "Nilagang Baka", keyIngredients: ["baka", "patatas", "repolyo", "sibuyas", "saging na saba"] },
  { name: "Paksiw na Isda", keyIngredients: ["isda", "suka", "bawang", "luya", "siling pansigang"] },
  { name: "Pritong Galunggong", keyIngredients: ["galunggong", "mantika", "asin"] },
  { name: "Daing na Bangus", keyIngredients: ["bangus", "suka", "bawang", "asin"] },
  { name: "Pinakbet", keyIngredients: ["bagoong", "talong", "sitaw", "kalabasa", "okra", "kamatis", "baboy"] },
  { name: "Ginisang Kangkong", keyIngredients: ["kangkong", "bawang", "sibuyas", "toyo"] },
  { name: "Ginisang Munggo", keyIngredients: ["munggo", "bawang", "sibuyas", "kamatis", "chicharon", "kangkong"] },
  { name: "Tortang Talong", keyIngredients: ["talong", "itlog", "bawang", "sibuyas"] },
  { name: "Ginataang Gulay", keyIngredients: ["gata", "kalabasa", "sitaw", "sili"] },
  { name: "Ginataang Manok", keyIngredients: ["manok", "gata", "luya", "sili"] },
  { name: "Bicol Express", keyIngredients: ["baboy", "gata", "sili", "bagoong", "bawang", "sibuyas"] },
  { name: "Laing", keyIngredients: ["gabi", "gata", "sili", "bagoong"] },
  { name: "Kare-Kare", keyIngredients: ["baka", "bagoong", "peanut", "talong", "sitaw", "puso ng saging"] },
  { name: "Kaldereta", keyIngredients: ["baka", "kamatis", "sili", "patatas", "carrot", "atay"] },
  { name: "Menudo", keyIngredients: ["baboy", "atay", "patatas", "carrot", "kamatis", "sibuyas"] },
  { name: "Afritada", keyIngredients: ["manok", "kamatis", "patatas", "carrot", "sibuyas", "bell pepper"] },
  { name: "Giniling (Picadillo)", keyIngredients: ["giniling", "patatas", "carrot", "kamatis", "sibuyas", "toyo"] },
  { name: "Sisig", keyIngredients: ["baboy", "sibuyas", "sili", "calamansi", "itlog"] },
  { name: "Lechon Kawali", keyIngredients: ["baboy", "bawang", "laurel", "asin", "mantika"] },
  { name: "Inihaw na Liempo", keyIngredients: ["baboy", "toyo", "calamansi", "bawang"] },
  { name: "Tapsilog", keyIngredients: ["tapa", "itlog", "kanin", "bawang"] },
  { name: "Tosilog", keyIngredients: ["tocino", "itlog", "kanin", "bawang"] },
  { name: "Longsilog", keyIngredients: ["longganisa", "itlog", "kanin", "bawang"] },
  { name: "Arroz Caldo", keyIngredients: ["manok", "kanin", "luya", "bawang", "sibuyas"] },
  { name: "Goto", keyIngredients: ["goto", "kanin", "luya", "bawang"] },
  { name: "Champorado", keyIngredients: ["kanin", "tsokolate", "gatas"] },
  { name: "Pancit Bihon", keyIngredients: ["bihon", "manok", "baboy", "repolyo", "carrot", "toyo"] },
  { name: "Pancit Canton", keyIngredients: ["canton", "manok", "baboy", "repolyo", "carrot", "toyo"] },
  { name: "Dinuguan", keyIngredients: ["baboy", "dugo", "suka", "sili", "bawang", "sibuyas"] },
  { name: "Bulalo", keyIngredients: ["baka", "mais", "repolyo", "sibuyas"] },
  { name: "Sinampalukang Manok", keyIngredients: ["manok", "sampalok", "luya", "kangkong", "sili"] },
  { name: "Fried Rice (Sinangag)", keyIngredients: ["kanin", "bawang", "itlog"] },
  { name: "Itlog na Maalat at Kamatis", keyIngredients: ["itlog", "kamatis", "sibuyas"] },
];

/** Hanapin ang mga ulam na may pinakamaraming tugmang sangkap. */
export function matchDishes(ingredients: string[], limit = 5): Dish[] {
  const q = ingredients.map((i) => i.toLowerCase());
  const scored = DISHES.map((dish) => {
    const overlap = dish.keyIngredients.filter((k) =>
      q.some((item) => item.includes(k) || k.includes(item)),
    ).length;
    return { dish, overlap };
  })
    .filter((s) => s.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap);
  return scored.slice(0, limit).map((s) => s.dish);
}
