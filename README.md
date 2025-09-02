# Dôzo Diet Planner — Prototipo Seguro (Chile)

Genera planes de comidas diarios/semanales con reglas claras:
- **No repetición** del mismo menú dentro de **7 días** y **máximo 3 veces en 30 días**.
- **Desayuno sin vegetales**.
- **Distribución calórica diaria** por bandas: 20–25% desayuno, 30–40% almuerzo, 20–30% cena, 5–10% snacks, 0–10% margen flexible.
- Catálogo de alimentos **comunes y asequibles en Chile** por ciudad (Santiago, Concepción, Viña del Mar, La Serena).

> El servidor no expone ninguna API Key. Todo corre localmente.

---

## 1) Requisitos

- **Node.js 18+**: https://nodejs.org/
- Windows (se incluye `run_dozo_simple.bat` para abrir con doble clic).

---

## 2) Ejecutar en local (dos opciones)

### Opción A — Doble clic (Windows)
1. Haz doble clic en **`run_dozo_simple.bat`** (abre una ventana “Dozo API” con el servidor).
2. Se abrirá el navegador en **http://localhost:8787/index.html**.
3. Para detenerlo, cierra la ventana “Dozo API”.

### Opción B — Terminal
```bash
# 1) Instalar dependencias (la primera vez)
npm install

# 2) Levantar el servidor
node server.js

# 3) Abrir el navegador en
# http://localhost:8787/index.html