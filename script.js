// Esperar DOM
document.addEventListener('DOMContentLoaded', function () {
  const formElement = document.getElementById('dietForm');
  const resetButton = document.getElementById('reset');
  const resultDiv = document.getElementById('result');

  formElement.addEventListener('submit', async function (e) {
    e.preventDefault();
    await generateDiet();
  });

  resetButton.addEventListener('click', function () {
    try {
      formElement.reset();
      resultDiv.innerHTML = '';
    } catch (err) {
      const inputs = formElement.querySelectorAll('input, select');
      inputs.forEach((input) => {
        if (input.type === 'checkbox' || input.type === 'radio') input.checked = false;
        else input.value = '';
      });
      resultDiv.innerHTML = '';
    }
  });
});

function getSeason() {
  const month = new Date().getMonth() + 1;
  if ([12, 1, 2].includes(month)) return 'summer';
  if ([3, 4, 5].includes(month)) return 'autumn';
  if ([6, 7, 8].includes(month)) return 'winter';
  if ([9, 10, 11].includes(month)) return 'spring';
}

function titleCase(s) {
  return s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Calcular distribución calórica con las bandas exigidas
function computeCalorieDistribution(calories, selectedMeals) {
  const bands = {
    breakfast: { min: 0.20, max: 0.25 },
    lunch: { min: 0.30, max: 0.40 },
    dinner: { min: 0.20, max: 0.30 },
    firstSnack: { min: 0.05, max: 0.10 },
    secondSnack: { min: 0.00, max: 0.10 }
  };
  const adjusted = {};
  let remaining = 1.0;

  // Simple mid-point within bands constrained by remaining
  selectedMeals.forEach(meal => {
    const band = bands[meal];
    if (!band) return;
    const maxPossible = Math.min(band.max, remaining);
    const prop = Math.max(band.min, Math.min(maxPossible, (band.min + maxPossible) / 2));
    adjusted[meal] = prop;
    remaining -= prop;
  });

  // Resto es margen flexible (0–10%); si excede 10%, redistribuir a almuerzo/cena
  let flex = Math.max(0, remaining);
  const maxFlex = 0.10;
  if (flex > maxFlex) {
    const extra = flex - maxFlex;
    // Sumar proporcionalmente a lunch y dinner si están seleccionados
    const targets = ['lunch', 'dinner'].filter(m => adjusted[m] !== undefined);
    if (targets.length) {
      const per = extra / targets.length;
      targets.forEach(t => adjusted[t] += per);
      flex = maxFlex;
    }
  }
  return { adjusted, flex };
}

async function generateDiet() {
  const name = document.getElementById('name').value;
  const sex = document.getElementById('sex').value;
  const age = parseInt(document.getElementById('age').value);
  const weight = parseFloat(document.getElementById('weight').value);
  const height = parseFloat(document.getElementById('height').value);
  const activity = document.getElementById('activity').value;
  const goal = document.getElementById('goal').value;
  const conditions = Array.from(document.querySelectorAll('input[name="condition"]:checked')).map(cb => cb.value);
  const allergies = document.getElementById('allergies').value.split(',').map(a => a.trim()).filter(Boolean);
  const dietType = document.getElementById('dietType').value;
  const location = document.getElementById('location').value;
  const meals = Array.from(document.querySelectorAll('input[name="meal"]:checked')).map(cb => cb.value);
  const days = parseInt(document.getElementById('days').value);

  if (!name || !sex || !age || !weight || !height || !activity || !goal || meals.length === 0 || !dietType || !location || !days) {
    alert('Por favor, completa todos los campos obligatorios.');
    return;
  }

  // BMR (Mifflin-St Jeor)
  let bmr = (sex === 'male')
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;

  const activityMultipliers = {
    low: 1.2, light: 1.375, moderate: 1.55, high: 1.725, intense: 1.9
  };
  let tdee = bmr * activityMultipliers[activity];
  if (goal === 'lose') tdee -= 500;
  else if (goal === 'gain') tdee += 500;
  const calories = Math.max(1200, Math.round(tdee)); // piso simple

  const selectedMeals = meals;
  const { adjusted: proportions, flex } = computeCalorieDistribution(calories, selectedMeals);
  const snackProp = (proportions['firstSnack'] || 0) + (proportions['secondSnack'] || 0);
  const mainMeals = selectedMeals.filter(m => m !== 'firstSnack' && m !== 'secondSnack');
  const totalMainProp = mainMeals.reduce((s, m) => s + (proportions[m] || 0), 0);

  const season = getSeason();

  // Llamar al backend seguro (no se expone ninguna API Key en el cliente)
  const resp = await fetch("/api/plan-dieta", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      days, meals: selectedMeals, location, dietType, conditions, allergies
    })
  });
  const data = await resp.json();
  if (!resp.ok) {
    alert(data?.error || "Error al generar la dieta");
    return;
  }

  const plans = data.plans || [];
  let result = `
    <h2>Plan de Dieta para ${name}</h2>
    <p class="summary"><strong>Días Totales:</strong> ${days} | <strong>Calorías Diarias:</strong> ${calories} kcal | <strong>Temporada:</strong> ${season.charAt(0).toUpperCase() + season.slice(1)} | <strong>Ciudad:</strong> ${titleCase(location)}</p>
    <div class="diet-plan">
  `;

  for (let d = 0; d < days; d++) {
    const dayNumber = d + 1;
    const dayClass = dayNumber % 2 === 0 ? 'day-even' : 'day-odd';
    result += `<section class="day-section ${dayClass}"><h3>Día ${dayNumber}</h3><div class="meal-grid">`;

    for (const meal of selectedMeals) {
      const isBreakfast = meal === 'breakfast';
      const isSnack = meal === 'firstSnack' || meal === 'secondSnack';

      // Calorías por comida
      let mealCalories = 0;
      if (isSnack) {
        const snacksCount = ['firstSnack', 'secondSnack'].filter(m => proportions[m]).length || 1;
        mealCalories = Math.round(calories * snackProp / snacksCount);
      } else {
        const prop = proportions[meal] || 0;
        const base = Math.max(0, prop);
        mealCalories = Math.round(calories * base);
      }

      result += `<div class="meal-card ${isSnack ? 'snack-card' : ''}">`;
      result += `<h4>${meal.charAt(0).toUpperCase() + meal.slice(1)} (~${mealCalories} kcal)</h4>`;
      result += `<table class="meal-table">`;

      const sel = plans[d][meal];

      if (isSnack) {
        result += `<tr><td>Snack:</td><td>${sel.snack} - 30g</td></tr>`;
      } else {
        // Cantidades aproximadas (escala muy simple a partir de calorías)
        const scale = mealCalories / 600; // base
        const carbQty = Math.max(0, Math.round((isBreakfast ? 50 : 100) * scale));
        const proteinQty = Math.max(0, Math.round((isBreakfast ? 30 : 80) * scale));
        const vegQty = Math.max(0, Math.round(100 * scale));
        const fruitQty = Math.max(0, Math.round(150 * scale));

        // Filas (sin vegetales en desayuno)
        result += `<tr><td>Carbohidratos:</td><td>${sel.carb || '—'}${carbQty ? ' - ' + carbQty + 'g' : ''}</td></tr>`;
        result += `<tr><td>Proteínas:</td><td>${sel.protein || '—'}${proteinQty ? ' - ' + proteinQty + 'g' : ''}</td></tr>`;
        if (!isBreakfast) {
          result += `<tr><td>Vegetales:</td><td>${sel.veg || '—'}${vegQty ? ' - ' + vegQty + 'g' : ''}</td></tr>`;
        }
        result += `<tr><td>Frutas:</td><td>${sel.fruit || '—'}${fruitQty ? ' - ' + fruitQty + 'g' : ''}</td></tr>`;
      }

      result += `</table></div>`;
    }

    // Margen flexible
    const flexCalories = Math.round(calories * flex);
    if (flexCalories > 0) {
      result += `<div class="meal-card"><h4>Margen Flexible (~${flexCalories} kcal)</h4><table class="meal-table"><tr><td>Nota:</td><td>Calorías disponibles para ajustes y preferencia personal.</td></tr></table></div>`;
    }

    result += `</div></section>`;
  }

  result += `</div>`;
  document.getElementById('result').innerHTML = result;
}
