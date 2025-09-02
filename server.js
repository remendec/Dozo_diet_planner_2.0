import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Load base catalog
const catalogPath = path.join(__dirname, "catalog_cl.json");
const baseCatalog = JSON.parse(fs.readFileSync(catalogPath, "utf-8"));

const normalizeCity = (loc) => (loc || "").toLowerCase().replace(/\s+/g, "-");

// Utility: simple shuffle
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Build working catalog respecting conditions/allergies/diet
function buildCatalog(cityKey, dietType, conditions, allergies) {
  const city = baseCatalog.cities[cityKey];
  if (!city) throw new Error("Ciudad no soportada");
  // Deep clone
  const clone = JSON.parse(JSON.stringify(city));

  // Rules: diabetes -> limitar simples (aquí ejemplo: evitar "Cuscús")
  if (conditions.includes("diabetes")) {
    clone.carbs.all = clone.carbs.all.filter((c) => !/cuscús/i.test(c));
    clone.carbs.breakfast = clone.carbs.breakfast.filter((c) => !/tortilla de avena/i.test(c)); // ejemplo
  }
  // Celíacos -> sin trigo/pan/pasta (ya usamos integral pero igual filtramos)
  if (conditions.includes("celiac")) {
    const gluten = /(trigo|pasta|pan|cuscús)/i;
    clone.carbs.all = clone.carbs.all.filter((c) => !gluten.test(c));
    clone.carbs.breakfast = clone.carbs.breakfast.filter((c) => !gluten.test(c));
  }
  // Lactosa -> quitar yogurt/quesillo de breakfasts/snacks
  if (conditions.includes("lactose")) {
    clone.proteins.breakfast = clone.proteins.breakfast.filter((p) => !/yogurt|quesillo/i.test(p));
    clone.snacks = clone.snacks.filter((s) => !/yogurt/i.test(s));
  }
  // Dieta
  if (dietType === "vegetarian") {
    clone.proteins.all = clone.proteins.all.filter((p) => !/(pollo|pavo|atún|jurel)/i.test(p));
  } else if (dietType === "vegan") {
    clone.proteins.all = clone.proteins.all.filter((p) => !/(pollo|pavo|atún|jurel|huevo|quesillo)/i.test(p));
    clone.proteins.breakfast = clone.proteins.breakfast.filter((p) => !/(huevo|quesillo|yogurt)/i.test(p));
  }

  // Alergias (búsqueda simple por substring)
  const allers = (allergies || []).map((a) => (a || "").toLowerCase());
  const filterAllergy = (s) => !allers.some((a) => s.toLowerCase().includes(a));
  ["vegetables", "fruits", "snacks"].forEach((k) => {
    clone[k] = (clone[k] || []).filter(filterAllergy);
  });
  Object.keys(clone.carbs).forEach((sub) => {
    clone.carbs[sub] = clone.carbs[sub].filter(filterAllergy);
  });
  Object.keys(clone.proteins).forEach((sub) => {
    clone.proteins[sub] = clone.proteins[sub].filter(filterAllergy);
  });

  // Excluir limón como fruta si existiera
  if (baseCatalog.common_rules?.exclude_fruits_as_lemons && clone.fruits) {
    clone.fruits = clone.fruits.filter((f) => !/lim[oó]n/i.test(f));
  }

  return clone;
}

// Signature helper for repetition tracking
function mealSignature(mealType, items) {
  // items: {carb, protein, veg, fruit, snack}
  const parts = [mealType, items.carb||"", items.protein||"", items.veg||"", items.fruit||"", items.snack||""];
  return parts.join("|").toLowerCase();
}

// Plan generator (no repeat within 7 days, max 3 in 30 days)
function generatePlan({ days, meals, cityKey, dietType, conditions, allergies }) {
  const cat = buildCatalog(cityKey, dietType, conditions, allergies);

  const dayPlans = [];
  const counts30 = new Map(); // signature -> count in 30-day window

  for (let d = 0; d < days; d++) {
    const day = {};
    for (const meal of meals) {
      const isBreakfast = meal === "breakfast";
      const isSnack = meal === "firstSnack" || meal === "secondSnack";

      let candidate = null;
      let attempts = 0;

      while (attempts < 200) {
        attempts++;
        if (isSnack) {
          const snack = cat.snacks?.length ? cat.snacks[Math.floor(Math.random() * cat.snacks.length)] : "Fruta fresca";
          candidate = { snack };
        } else {
          const carbsPool = isBreakfast ? (cat.carbs.breakfast || []) : (cat.carbs.all || []);
          const proteinsPool = isBreakfast ? (cat.proteins.breakfast || []) : (cat.proteins.all || []);
          const vegetablesPool = cat.vegetables || [];
          const fruitsPool = cat.fruits || [];

          const carb = carbsPool[Math.floor(Math.random() * Math.max(1, carbsPool.length))] || null;
          const protein = proteinsPool[Math.floor(Math.random() * Math.max(1, proteinsPool.length))] || null;

          // No vegetales en desayuno
          const veg = isBreakfast ? null : (vegetablesPool[Math.floor(Math.random() * Math.max(1, vegetablesPool.length))] || null);
          const fruit = fruitsPool[Math.floor(Math.random() * Math.max(1, fruitsPool.length))] || null;

          candidate = { carb, protein, veg, fruit };
        }

        const sig = mealSignature(meal, candidate);

        // Check 7-day no-repeat (look back over last 7 created days)
        let repeatedIn7 = false;
        for (let back = 1; back <= Math.min(7, dayPlans.length); back++) {
          const prev = dayPlans[dayPlans.length - back];
          if (prev && prev[meal] && mealSignature(meal, prev[meal]) === sig) {
            repeatedIn7 = true;
            break;
          }
        }

        const count30 = counts30.get(sig) || 0;
        if (!repeatedIn7 && count30 < 3) {
          // Accept
          counts30.set(sig, count30 + 1);
          break;
        }
        // else try again
        candidate = null;
      }

      // Fallback simple if we couldn't find a non-repeating candidate
      if (!candidate) {
        if (isSnack) candidate = { snack: (cat.snacks?.[0] || "Fruta fresca") };
        else candidate = { carb: cat.carbs.all?.[0] || null, protein: cat.proteins.all?.[0] || null, veg: isBreakfast ? null : (cat.vegetables?.[0] || null), fruit: cat.fruits?.[0] || null };
      }

      day[meal] = candidate;
    }
    dayPlans.push(day);
  }

  return { plans: dayPlans, catalog_used: cat };
}

app.post("/api/plan-dieta", async (req, res) => {
  try {
    const { days, meals, location, dietType, conditions = [], allergies = [] } = req.body || {};
    if (!days || !Array.isArray(meals) || !location) {
      return res.status(400).json({ error: "Parámetros inválidos" });
    }
    const cityKey = normalizeCity(location);

    const plan = generatePlan({ days: Math.min(30, Math.max(1, +days)), meals, cityKey, dietType, conditions, allergies });
    res.json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al generar el plan" });
  }
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => {
  console.log(`Dôzo API escuchando en http://localhost:${PORT}`);
});
// Servir archivos estáticos (index.html, script.js, styles.css)
app.use(express.static(__dirname));
