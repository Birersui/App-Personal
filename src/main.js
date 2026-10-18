import {
  initDb,
  persist,
  today,
  getSetting,
  setSetting,
  getSummary,
  monthlyTotals,
  upcomingDebts,
  expenseCategoryTotals,
  listIncomes,
  addIncome,
  updateIncome,
  deleteIncome,
  listExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  listDebts,
  addDebt,
  updateDebt,
  deleteDebt,
  addDebtPlan,
  updateDebtPlan,
  listPayments,
  addPayment,
  deletePayment,
  getPayment,
  listNotes,
  addNote,
  updateNote,
  deleteNote,
  listBudgets,
  setBudget,
  deleteBudget,
  budgetStatus,
  listIncomeCategories,
  addIncomeCategory,
  deleteIncomeCategory,
  listRecurring,
  addRecurring,
  updateRecurring,
  deleteRecurring,
  toggleRecurring,
  applyRecurring,
  scheduledOnOrAfter,
  currentMonthKey,
  listGoals,
  addGoal,
  updateGoal,
  contributeGoal,
  deleteGoal,
} from "./db.js";
import { drawBarChart, drawDonut } from "./charts.js";
import { exportSqlite, exportJson, exportCsv, importFile } from "./backup.js";
import { ensureNotificationPermission, refreshNotifications } from "./reminders.js";
import { isNative } from "./store.js";

const state = {
  tab: "summary",
  currency: "$",
  reminderDays: 7,
  debtFirstOnly: false,
  theme: "system",
  palette: "blue",
  installPrompt: null,
  savingsOpen: false,
  filters: {
    incomes: { q: "", month: "", cat: "" },
    expenses: { q: "", month: "", cat: "" },
    debts: { q: "", month: "" },
  },
  group: { incomes: true, expenses: true, debts: false },
};

const THEME_KEY = "mf-theme";
const PALETTE_KEY = "mf-palette";
const expandedPlans = new Set();
const savingsCalc = { method: "", income: "" };

const PALETTES = [
  { key: "blue", label: "Azul", color: "#5b8cff" },
  { key: "green", label: "Verde", color: "#34d399" },
  { key: "purple", label: "Morado", color: "#a78bfa" },
  { key: "yellow", label: "Amarillo", color: "#f5c451" },
  { key: "red", label: "Rojo", color: "#fb7185" },
];

const SAVINGS_METHODS = [
  { key: "50-30-20", name: "50/30/20", desc: "50% necesidades · 30% gustos · 20% ahorro", parts: [
    { label: "Necesidades", pct: 50 }, { label: "Gustos", pct: 30 }, { label: "Ahorro / deuda", pct: 20, save: true } ] },
  { key: "70-20-10", name: "70/20/10", desc: "70% gastos · 20% ahorro · 10% deuda extra", parts: [
    { label: "Gastos", pct: 70 }, { label: "Ahorro", pct: 20, save: true }, { label: "Deuda extra", pct: 10 } ] },
  { key: "80-20", name: "80/20 (págate primero)", desc: "80% gastos · 20% ahorro, primero págate a ti", parts: [
    { label: "Gastos", pct: 80 }, { label: "Ahorro", pct: 20, save: true } ] },
  { key: "60-40", name: "60/40", desc: "60% gastos fijos · 40% ahorro, deuda y ocio", parts: [
    { label: "Gastos fijos", pct: 60 }, { label: "Ahorro", pct: 20, save: true }, { label: "Deuda", pct: 10 }, { label: "Ocio", pct: 10 } ] },
  { key: "3-cuentas", name: "3 cuentas", desc: "Gastos, ahorro y gustos en cuentas separadas", parts: [
    { label: "Gastos", pct: 60 }, { label: "Ahorro", pct: 25, save: true }, { label: "Gustos", pct: 15 } ] },
  { key: "6-frascos", name: "6 frascos (Harvey)", desc: "Seis frascos: paga, ahorra, invierte, aprende, disfruta y dona", parts: [
    { label: "Necesidades", pct: 55 }, { label: "Ahorro", pct: 10, save: true }, { label: "Inversión", pct: 10, save: true }, { label: "Educación", pct: 10, save: true }, { label: "Ocio", pct: 10 }, { label: "Donaciones", pct: 5 } ] },
  { key: "sobres", name: "Método de sobres", desc: "Reparte tu ingreso en sobres por tipo de gasto", parts: [
    { label: "Vivienda", pct: 30 }, { label: "Comida", pct: 15 }, { label: "Transporte", pct: 10 }, { label: "Servicios", pct: 10 }, { label: "Deudas", pct: 15 }, { label: "Ahorro", pct: 20, save: true } ] },
  { key: "kakeibo", name: "Kakeibo", desc: "Supervivencia, ocio, cultura, extras y ahorro (japonés)", parts: [
    { label: "Supervivencia", pct: 55 }, { label: "Ocio", pct: 15 }, { label: "Cultura", pct: 10 }, { label: "Imprevistos", pct: 10 }, { label: "Ahorro", pct: 10, save: true } ] },
];

function prefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolvedTheme(pref) {
  return pref === "system" ? (prefersDark() ? "dark" : "light") : pref;
}

function applyPalette() {
  document.documentElement.dataset.palette = state.palette || "blue";
}

function applyTheme() {
  const t = resolvedTheme(state.theme);
  document.documentElement.dataset.theme = t;
  applyPalette();
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
    meta.setAttribute("content", bg || (t === "dark" ? "#0b0f16" : "#f3f5fa"));
  }
  const btn = document.getElementById("theme-toggle");
  if (btn) {
    btn.textContent = t === "dark" ? "🌙" : "☀️";
    btn.title = state.theme === "system" ? "Tema: sistema" : `Tema: ${state.theme === "dark" ? "oscuro" : "claro"}`;
  }
  const sel = document.getElementById("set-theme");
  if (sel) sel.value = state.theme;
}

function setThemePref(pref) {
  state.theme = pref;
  try {
    localStorage.setItem(THEME_KEY, pref);
  } catch (e) {}
  try {
    setSetting("theme", pref);
  } catch (e) {}
  applyTheme();
}

function setPalette(key) {
  state.palette = key || "blue";
  try {
    localStorage.setItem(PALETTE_KEY, state.palette);
  } catch (e) {}
  try {
    setSetting("palette", state.palette);
  } catch (e) {}
  applyPalette();
}

function runRipple(apply, x, y) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !document.startViewTransition) {
    apply();
    return;
  }
  const root = document.documentElement;
  const W = window.innerWidth;
  const H = window.innerHeight;
  const feather = Math.max(120, Math.min(W, H) * 0.32);
  const corner = Math.hypot(Math.max(x, W - x), Math.max(y, H - y));
  const endRadius = corner + feather + 48;

  root.style.setProperty("--mf-x", `${x}px`);
  root.style.setProperty("--mf-y", `${y}px`);
  root.style.setProperty("--mf-feather", `${feather}px`);

  const transition = document.startViewTransition(() => apply());
  transition.ready
    .then(() => {
      root.animate(
        { "--mf-r": ["0px", `${endRadius}px`] },
        {
          duration: 950,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "forwards",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    })
    .catch(() => {});
}

function themeRipple(pref, x, y) {
  runRipple(() => setThemePref(pref), x, y);
}

function toggleTheme(sourceEl, x, y) {
  const pref = resolvedTheme(state.theme) === "dark" ? "light" : "dark";
  let px = x;
  let py = y;
  if ((!px || !py) && sourceEl) {
    const r = sourceEl.getBoundingClientRect();
    px = r.left + r.width / 2;
    py = r.top + r.height / 2;
  }
  if (sourceEl) {
    sourceEl.classList.remove("pulse");
    void sourceEl.offsetWidth;
    sourceEl.classList.add("pulse");
    setTimeout(() => sourceEl.classList.remove("pulse"), 900);
  }
  themeRipple(pref, px || window.innerWidth / 2, py || 60);
}

const view = document.getElementById("view");
const headerBalance = document.getElementById("header-balance");
const title = document.getElementById("header-title");

function currency() {
  return state.currency || "$";
}

function fmt(n) {
  const num = Number(n) || 0;
  return (
    currency() +
    num.toLocaleString("es", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}

function parseAmount(v) {
  if (v == null) return NaN;
  return parseFloat(String(v).replace(/\s/g, "").replace(",", "."));
}

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

function fmtDate(d) {
  if (!d) return "Sin fecha";
  const dt = new Date(d + "T00:00:00");
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" });
}

function daysUntil(d) {
  const a = new Date(d + "T00:00:00");
  const b = new Date(today() + "T00:00:00");
  return Math.round((a - b) / 86400000);
}

function addDaysISO(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  const p = (x) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// ---------------- bottom sheet / modal ----------------
const sheet = document.getElementById("sheet");
const sheetTitle = document.getElementById("sheet-title");
const sheetBody = document.getElementById("sheet-body");
const sheetForm = document.getElementById("sheet-form");

function openSheet({ title: t, fields, submitLabel = "Guardar", onSubmit, extraHtml = "" }) {
  sheetTitle.textContent = t;
  sheetBody.innerHTML = fields.map(renderField).join("") + extraHtml;
  sheetForm.querySelector(".sheet-submit").textContent = submitLabel;
  sheet.classList.add("open");
  let busy = false;
  sheetForm.onsubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    busy = true;
    const submitBtn = sheetForm.querySelector(".sheet-submit");
    if (submitBtn) submitBtn.disabled = true;
    try {
      const data = {};
      for (const f of fields) {
        const el = sheetForm.querySelector(`[name="${f.name}"]`);
        data[f.name] = el ? el.value : "";
      }
      await onSubmit(data);
      closeSheet();
      await rerender();
    } finally {
      busy = false;
      if (submitBtn) submitBtn.disabled = false;
    }
  };
  const first = sheetForm.querySelector("input, textarea, select");
  if (first && !isNative) setTimeout(() => first.focus(), 200);
}

function renderField(f) {
  const val = f.value == null ? "" : f.value;
  if (f.type === "textarea") {
    return `<label class="field"><span>${esc(f.label)}</span><textarea name="${f.name}" rows="${f.rows || 3}" placeholder="${esc(f.placeholder || "")}">${esc(val)}</textarea></label>`;
  }
  if (f.type === "select") {
    return `<label class="field"><span>${esc(f.label)}</span><select name="${f.name}">${f.options
      .map((o) => `<option value="${esc(o.value)}" ${String(o.value) === String(val) ? "selected" : ""}>${esc(o.label)}</option>`)
      .join("")}</select></label>`;
  }
  return `<label class="field"><span>${esc(f.label)}</span><input type="${f.type}" name="${f.name}" value="${esc(val)}" ${f.required ? "required" : ""} ${f.step ? `step="${f.step}"` : ""} ${f.placeholder ? `placeholder="${esc(f.placeholder)}"` : ""} inputmode="${f.type === "number" ? "decimal" : "text"}" /></label>`;
}

function closeSheet() {
  sheet.classList.remove("open");
}

sheet.addEventListener("click", (e) => {
  if (e.target === sheet || e.target.dataset.close !== undefined) closeSheet();
});

// ---------------- toast / undo ----------------
let toastTimer = null;
let recurringCtx = null;

function hideToast() {
  const t = document.getElementById("toast");
  if (t) t.classList.remove("show");
}

function showToast(message, actionLabel, onAction, duration = 5000) {
  let t = document.getElementById("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    document.body.appendChild(t);
  }
  t.innerHTML = "";
  const span = document.createElement("span");
  span.textContent = message;
  t.appendChild(span);
  if (actionLabel) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "toast-action";
    b.textContent = actionLabel;
    b.addEventListener("click", () => {
      hideToast();
      if (onAction) onAction();
    });
    t.appendChild(b);
  }
  requestAnimationFrame(() => t.classList.add("show"));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, duration);
}

// ---------------- render engine ----------------
let notifTimer = null;
function scheduleNotifs() {
  if (!isNative) return;
  clearTimeout(notifTimer);
  notifTimer = setTimeout(
    () => refreshNotifications({ reminderDays: state.reminderDays }),
    400
  );
}

async function rerender() {
  headerBalance.textContent = fmt(getSummary().balance);
  if (state.tab === "summary") await renderSummary();
  else if (state.tab === "incomes") renderIncomes();
  else if (state.tab === "expenses") renderExpenses();
  else if (state.tab === "debts") renderDebts();
  else if (state.tab === "goals") renderGoals();
  else if (state.tab === "notes") renderNotes();
  else if (state.tab === "settings") renderSettings();
  document.querySelectorAll(".nav-btn").forEach((b) =>
    b.classList.toggle("active", b.dataset.tab === state.tab)
  );
  document.getElementById("tabbar").dataset.tab = state.tab;
  scheduleNotifs();
}

function setTab(tab) {
  state.tab = tab;
  rerender();
}

// ---------------- summary ----------------
async function renderSummary() {
  const s = getSummary();
  const upcoming = upcomingDebts(state.reminderDays);
  const cats = expenseCategoryTotals();
  title.textContent = "Resumen";

  view.innerHTML = `
    <section class="hero ${s.balance < 0 ? "neg" : "pos"}">
      <span class="hero-label">Disponible</span>
      <strong class="hero-value">${fmt(s.balance)}</strong>
      <div class="hero-split">
        <div><span>Ingresos</span><b class="green">${fmt(s.totalIncome)}</b></div>
        <div><span>Gastos</span><b class="red">${fmt(s.totalExpenses)}</b></div>
        <div><span>Deuda total</span><b class="orange">${fmt(s.totalDebt)}</b></div>
      </div>
    </section>

    <section class="cards">
      <div class="stat"><span>Deuda pendiente</span><b class="red">${fmt(s.pending)}</b></div>
      <div class="stat"><span>Deuda total</span><b>${fmt(s.totalDebt)}</b></div>
      <div class="stat"><span>Gastos totales</span><b class="orange">${fmt(s.totalExpenses)}</b></div>
      <div class="stat"><span>Registros</span><b>${s.countIncome + s.countExpenses + s.countDebts}</b></div>
    </section>

    <section class="panel">
      <h3>Ingresos vs salidas (6 meses)</h3>
      <div class="legend"><i class="dot green"></i>Ingresos <i class="dot orange"></i>Gastos <i class="dot red"></i>Pagos</div>
      <canvas id="chart-months" class="chart" height="180"></canvas>
    </section>

    <section class="panel two">
      <div>
        <h3>Estado de deudas</h3>
        <canvas id="chart-donut" class="donut" height="170"></canvas>
      </div>
      <div>
        <h3>¿En qué gasté?</h3>
        <ul class="cat-list">
          ${
            cats.length
              ? cats
                  .slice(0, 6)
                  .map(
                    (c) =>
                      `<li><span>${esc(c.category)}</span><b>${fmt(c.total)}</b></li>`
                  )
                  .join("")
              : '<li class="muted">Sin gastos aún</li>'
          }
        </ul>
      </div>
    </section>

    <section class="panel">
      <h3>Próximos vencimientos</h3>
      ${
        upcoming.length
          ? `<ul class="reminders">${upcoming
              .map((d) => {
                const du = daysUntil(d.due_date);
                const label = d.overdue ? "Vencida" : du === 0 ? "Hoy" : `En ${du} d`;
                return `<li class="${d.overdue ? "overdue" : ""}">
                  <div><b>${esc(d.name)}</b><span>${fmtDate(d.due_date)}</span></div>
                  <div class="right"><b>${fmt(d.remaining)}</b><span class="pill">${label}</span></div>
                </li>`;
              })
              .join("")}</ul>`
          : '<p class="muted">Sin pagos próximos. 🎉</p>'
      }
    </section>
  `;

  requestAnimationFrame(() => {
    const mc = document.getElementById("chart-months");
    if (mc) drawBarChart(mc, monthlyTotals(6));
    const dc = document.getElementById("chart-donut");
    if (dc) drawDonut(dc, { paid: s.totalPaid, pending: s.pending });
  });
}

// ---------------- expenses ----------------
function renderExpenses() {
  title.textContent = "Gastos";
  const budgets = budgetStatus(currentMonthKey());
  const monthName = new Date().toLocaleDateString("es", { month: "long" });
  view.innerHTML = `
    <div class="toolbar">
      <div class="total-box"><span>Total gastado</span><b class="red" id="list-total">${fmt(0)}</b></div>
      <div class="toolbar-actions">
        <button class="btn ghost" data-action="budgets-open">Presupuestos</button>
        <button class="btn primary" data-action="expense-new">+ Gasto</button>
      </div>
    </div>

    ${
      budgets.length
        ? `<section class="panel">
            <h3>Presupuestos · ${monthName}</h3>
            <ul class="budget-list">
              ${budgets
                .map((b) => {
                  const cls = b.pct >= 100 ? "danger" : b.pct >= 80 ? "warn" : "";
                  const label = b.remaining >= 0 ? `Quedan ${fmt(b.remaining)}` : `Excedido ${fmt(-b.remaining)}`;
                  return `<li>
                    <div class="budget-top">
                      <span>${esc(b.category)}</span>
                      <b class="${b.pct >= 100 ? "red" : ""}">${fmt(b.spent)} <i class="muted">/ ${fmt(b.budget)}</i></b>
                    </div>
                    <div class="progress small-progress"><i class="${cls}" style="width:${b.pct}%"></i></div>
                    <span class="budget-note ${b.pct >= 100 ? "red" : "muted"}">${label}</span>
                  </li>`;
                })
                .join("")}
            </ul>
          </section>`
        : ""
    }

    ${filterBar("expenses", true)}
    <div id="list-area"></div>
  `;
  wireFilters("expenses");
  renderExpenseList();
}

function expenseItem(r) {
  return `<li>
    <div class="li-main">
      <b>${esc(r.description || "Gasto")}</b>
      <span>${r.category ? esc(r.category) + " · " : ""}${fmtDate(r.date)}</span>
    </div>
    <div class="li-right">
      <b class="red">-${fmt(r.amount)}</b>
      <div class="row-actions">
        <button data-action="expense-clone" data-id="${r.id}">Clonar</button>
        <button data-action="expense-edit" data-id="${r.id}">Editar</button>
        <button data-action="expense-del" data-id="${r.id}" class="danger">Borrar</button>
      </div>
    </div>
  </li>`;
}

function renderExpenseList() {
  const rows = applyFilters("expenses", listExpenses());
  setListTotal(rows.reduce((a, r) => a + Number(r.amount), 0), "red");
  const area = document.getElementById("list-area");
  if (area) area.innerHTML = listHtml("expenses", rows, expenseItem, (r) => Number(r.amount), "Aún no registras gastos.");
}


function openBudgetsSheet() {
  const existing = listBudgets();
  const spent = listExpenses().reduce((acc, e) => {
    const k = e.category || "Sin categoría";
    acc[k] = acc[k] || 0;
    return acc;
  }, {});
  const cats = Array.from(
    new Set([...existing.map((b) => b.category), ...Object.keys(spent)])
  ).sort((a, b) => a.localeCompare(b));
  const budgetMap = {};
  existing.forEach((b) => (budgetMap[b.category] = b.amount));

  const html = `
    <p class="muted small">Límite mensual por categoría. Déjalo vacío o en 0 para quitarlo.</p>
    <div class="budget-form">
      ${
        cats.length
          ? cats
              .map(
                (c) => `<label class="budget-row"><span>${esc(c)}</span>
          <input type="number" step="0.01" data-cat="${esc(c)}" value="${budgetMap[c] || ""}" placeholder="0" /></label>`
              )
              .join("")
          : '<p class="muted small">Aún no hay categorías de gasto.</p>'
      }
      <div class="budget-row new">
        <input type="text" id="new-budget-cat" placeholder="Nueva categoría" />
        <input type="number" step="0.01" id="new-budget-amt" placeholder="Límite" />
      </div>
    </div>
  `;

  openSheet({
    title: "Presupuestos",
    fields: [],
    extraHtml: html,
    submitLabel: "Guardar",
    onSubmit: () => {
      sheetForm.querySelectorAll("[data-cat]").forEach((input) => {
        setBudget(input.dataset.cat, parseAmount(input.value) || 0);
      });
      const nc = (document.getElementById("new-budget-cat").value || "").trim();
      const na = parseAmount(document.getElementById("new-budget-amt").value) || 0;
      if (nc && na > 0) setBudget(nc, na);
    },
  });
}

function expenseCategoryOptions() {
  const set = new Set();
  listBudgets().forEach((b) => b.category && set.add(b.category));
  listExpenses().forEach((e) => e.category && set.add(e.category));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function expenseFields(row = {}) {
  const cats = expenseCategoryOptions();
  const categoryField = cats.length
    ? {
        name: "category",
        label: "Categoría",
        type: "select",
        value: row.category || "",
        options: [{ value: "", label: "Sin categoría" }, ...cats.map((c) => ({ value: c, label: c }))],
      }
    : {
        name: "category",
        label: "Categoría (crea presupuestos para poder elegirla)",
        type: "text",
        value: row.category,
        placeholder: "Comida, transporte...",
      };
  return [
    { name: "amount", label: `Monto (${currency()})`, type: "number", step: "0.01", value: row.amount, required: true },
    { name: "description", label: "Descripción", type: "text", value: row.description, placeholder: "Supermercado, gasolina..." },
    categoryField,
    { name: "date", label: "Fecha", type: "date", value: row.date || today(), required: true },
  ];
}

// ---------------- recurring ----------------
function openRecurringList() {
  const rows = listRecurring();
  const html = `
    <button type="button" class="btn primary full" data-action="recurring-new">+ Recurrente</button>
    ${
      rows.length
        ? `<ul class="list compact recurring-list">${rows
            .map(
              (r) => `<li class="${r.active ? "" : "inactive"}">
          <div class="li-main">
            <b>${r.type === "income" ? "+" : "-"}${fmt(r.amount)} · ${esc(r.description || (r.type === "income" ? "Ingreso" : "Gasto"))}</b>
            <span>${r.type === "income" ? "Ingreso" : "Gasto"}${r.category ? " · " + esc(r.category) : ""} · ${recurringScheduleLabel(r)}</span>
            <span class="muted small">Próximo: ${fmtDate(r.next_date)}${r.active ? "" : " · pausado"}</span>
          </div>
          <div class="row-actions">
            <button data-action="recurring-toggle" data-id="${r.id}">${r.active ? "Pausar" : "Activar"}</button>
            <button data-action="recurring-edit" data-id="${r.id}">Editar</button>
            <button data-action="recurring-del" data-id="${r.id}" class="danger">Borrar</button>
          </div>
        </li>`
            )
            .join("")}</ul>`
        : '<p class="muted small">Sin movimientos recurrentes.</p>'
    }
  `;
  openSheet({ title: "Recurrentes", fields: [], extraHtml: html, submitLabel: "Cerrar", onSubmit: () => {} });
}

function recurringScheduleLabel(r) {
  if (r.schedule === "day_last") return `Día ${r.day_of_month} y último del mes`;
  const n = r.interval_days;
  if (n === 1) return "Diario";
  if (n === 7) return "Semanal";
  if (n === 15) return "Quincenal";
  if (n === 30) return "Mensual";
  return `Cada ${n} días`;
}

function openRecurringForm(row = null) {
  const editing = !!row;
  const model = {
    type: editing ? row.type : "expense",
    amount: editing ? row.amount : "",
    description: editing ? row.description : "",
    category: editing ? row.category : "",
    schedule: editing ? row.schedule || "interval" : "interval",
    interval_days: editing ? row.interval_days : 30,
    day_of_month: editing && row.day_of_month ? row.day_of_month : 15,
    next_date: editing ? addDaysISO(row.next_date, -row.interval_days) : today(),
  };

  const fieldsFor = () => {
    const f = [
      {
        name: "type",
        label: "Tipo",
        type: "select",
        value: model.type,
        options: [
          { value: "expense", label: "Gasto" },
          { value: "income", label: "Ingreso" },
        ],
      },
      { name: "amount", label: `Monto (${currency()})`, type: "number", step: "0.01", value: model.amount, required: true },
      { name: "description", label: "Descripción", type: "text", value: model.description, placeholder: "Renta, sueldo..." },
      { name: "category", label: "Categoría", type: "text", value: model.category },
    ];
    if (model.schedule === "day_last") {
      f.push({
        name: "day_of_month",
        label: "Día del mes (además del último día)",
        type: "number",
        value: model.day_of_month,
        required: true,
      });
    } else {
      f.push({ name: "interval_days", label: "Cada (días)", type: "number", value: model.interval_days, required: true });
      f.push({ name: "next_date", label: "Inicio", type: "date", value: model.next_date, required: true });
    }
    return f;
  };

  const qbtn = (mode, days, label) => {
    const active =
      model.schedule === mode &&
      (mode !== "interval" || String(model.interval_days) === String(days));
    return `<button type="button" class="btn ghost${active ? " active" : ""}" data-action="recurring-preset" data-mode="${mode}"${days ? ` data-days="${days}"` : ""}>${label}</button>`;
  };

  const extrasHtml = () => `
    <div class="quick-days">
      ${qbtn("interval", 7, "Semanal")}
      ${qbtn("interval", 15, "Quincenal")}
      ${qbtn("interval", 30, "Mensual")}
      ${qbtn("day_last", null, "15 y último")}
    </div>`;

  const capture = () => {
    const g = (n) => {
      const el = sheetForm.querySelector(`[name="${n}"]`);
      return el ? el.value : undefined;
    };
    const map = ["type", "amount", "description", "category", "interval_days", "day_of_month", "next_date"];
    for (const k of map) {
      const v = g(k);
      if (v !== undefined) model[k] = v;
    }
  };

  const render = () => {
    sheetBody.innerHTML = fieldsFor().map(renderField).join("") + extrasHtml();
  };

  recurringCtx = {
    setSchedule: (mode, days, day) => {
      capture();
      model.schedule = mode;
      if (mode === "interval") {
        if (days) model.interval_days = days;
        if (!model.next_date) model.next_date = today();
      } else {
        model.day_of_month = day || 15;
        model.next_date = scheduledOnOrAfter(today(), model.day_of_month);
      }
      render();
    },
  };

  sheetTitle.textContent = editing ? "Editar recurrente" : "Nuevo recurrente";
  sheetForm.querySelector(".sheet-submit").textContent = editing ? "Guardar" : "Crear";
  sheet.classList.add("open");
  render();

  sheetForm.onsubmit = async (e) => {
    e.preventDefault();
    capture();
    const day = Math.max(1, Math.min(parseInt(model.day_of_month, 10) || 15, 31));
    const interval = Math.max(1, parseInt(model.interval_days, 10) || 30);
    const payload = {
      type: model.type,
      amount: parseAmount(model.amount),
      description: model.description,
      category: model.category,
      schedule: model.schedule,
      interval_days: model.schedule === "day_last" ? 30 : interval,
      day_of_month: model.schedule === "day_last" ? day : null,
      next_date:
        model.schedule === "day_last"
          ? scheduledOnOrAfter(today(), day)
          : addDaysISO(model.next_date || today(), interval),
    };
    if (!(payload.amount > 0)) return;
    if (editing) updateRecurring(row.id, { ...payload, active: row.active });
    else addRecurring(payload);
    closeSheet();
    await rerender();
  };
}

// ---------------- filtros / agrupar por mes ----------------
function monthLabel(key) {
  if (!key || key === "0000-00") return "Sin fecha";
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  const s = d.toLocaleDateString("es", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function dateKeyOf(r) {
  return (r.date || r.due_date || "").slice(0, 7);
}

function applyFilters(kind, rows) {
  const f = state.filters[kind];
  const q = (f.q || "").trim().toLowerCase();
  return rows.filter((r) => {
    if (q) {
      const hay = `${r.description || ""} ${r.name || ""} ${r.category || ""} ${r.notes || ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (f.month && dateKeyOf(r) !== f.month) return false;
    if (f.cat) {
      const rc = r.category || "Sin categoría";
      if (rc !== f.cat) return false;
    }
    return true;
  });
}

function filterBar(kind, withCategory) {
  const f = state.filters[kind];
  const rows = kind === "incomes" ? listIncomes() : kind === "expenses" ? listExpenses() : listDebts();
  const months = [...new Set(rows.map(dateKeyOf).filter(Boolean))].sort().reverse();
  const cats = withCategory
    ? [...new Set(rows.map((r) => r.category || "Sin categoría"))].sort((a, b) => a.localeCompare(b))
    : [];
  return `<div class="filter-bar">
    <input type="search" id="f-q" placeholder="Buscar..." value="${esc(f.q)}" />
    <div class="filter-row">
      <select id="f-month">
        <option value="">Todos los meses</option>
        ${months.map((m) => `<option value="${m}" ${f.month === m ? "selected" : ""}>${monthLabel(m)}</option>`).join("")}
      </select>
      ${
        withCategory
          ? `<select id="f-cat">
               <option value="">Todas las categorías</option>
               ${cats.map((c) => `<option value="${esc(c)}" ${f.cat === c ? "selected" : ""}>${esc(c)}</option>`).join("")}
             </select>`
          : ""
      }
    </div>
    ${
      kind === "debts"
        ? ""
        : `<button type="button" class="btn ghost group-btn" data-action="list-group-toggle" data-kind="${kind}">
             ${state.group[kind] ? "Vista: por mes" : "Vista: lista"}
           </button>`
    }
  </div>`;
}

function wireFilters(kind) {
  const q = document.getElementById("f-q");
  if (q) q.addEventListener("input", () => { state.filters[kind].q = q.value; renderListFor(kind); });
  const m = document.getElementById("f-month");
  if (m) m.addEventListener("change", () => { state.filters[kind].month = m.value; renderListFor(kind); });
  const c = document.getElementById("f-cat");
  if (c) c.addEventListener("change", () => { state.filters[kind].cat = c.value; renderListFor(kind); });
}

function renderListFor(kind) {
  if (kind === "incomes") renderIncomeList();
  else if (kind === "expenses") renderExpenseList();
  else if (kind === "debts") renderDebtList();
}

function listHtml(kind, rows, renderItem, amountOf, emptyMsg) {
  if (!rows.length) return empty(emptyMsg);
  if (!state.group[kind]) return `<ul class="list">${rows.map(renderItem).join("")}</ul>`;
  const groups = new Map();
  for (const r of rows) {
    const k = dateKeyOf(r) || "0000-00";
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  }
  return [...groups.keys()]
    .sort()
    .reverse()
    .map((k) => {
      const items = groups.get(k);
      const sub = items.reduce((a, r) => a + amountOf(r), 0);
      return `<section class="month-group">
        <div class="month-head"><span>${monthLabel(k)}</span><b>${fmt(sub)}</b></div>
        <ul class="list">${items.map(renderItem).join("")}</ul>
      </section>`;
    })
    .join("");
}

function setListTotal(v, cls) {
  const t = document.getElementById("list-total");
  if (t) {
    t.textContent = fmt(v);
    if (cls) t.className = cls;
  }
}

// ---------------- incomes ----------------
function renderIncomes() {
  title.textContent = "Ingresos";
  view.innerHTML = `
    <div class="toolbar">
      <div class="total-box"><span>Total</span><b class="green" id="list-total">${fmt(0)}</b></div>
      <div class="toolbar-actions">
        <button class="btn ghost" data-action="income-categories-open">Categorías</button>
        <button class="btn primary" data-action="income-new">+ Ingreso</button>
      </div>
    </div>
    ${filterBar("incomes", true)}
    <div id="list-area"></div>
  `;
  wireFilters("incomes");
  renderIncomeList();
}

function incomeItem(r) {
  return `<li>
    <div class="li-main">
      <b>${esc(r.description || "Ingreso")}</b>
      <span>${r.category ? esc(r.category) + " · " : ""}${fmtDate(r.date)}</span>
    </div>
    <div class="li-right">
      <b class="green">+${fmt(r.amount)}</b>
      <div class="row-actions">
        <button data-action="income-edit" data-id="${r.id}">Editar</button>
        <button data-action="income-del" data-id="${r.id}" class="danger">Borrar</button>
      </div>
    </div>
  </li>`;
}

function renderIncomeList() {
  const rows = applyFilters("incomes", listIncomes());
  setListTotal(rows.reduce((a, r) => a + Number(r.amount), 0), "green");
  const area = document.getElementById("list-area");
  if (area) area.innerHTML = listHtml("incomes", rows, incomeItem, (r) => Number(r.amount), "Aún no registras ingresos.");
}


function incomeCategoryOptions() {
  const set = new Set();
  listIncomeCategories().forEach((c) => set.add(c.name));
  listIncomes().forEach((i) => i.category && set.add(i.category));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function incomeFields(row = {}) {
  const cats = incomeCategoryOptions();
  const categoryField = cats.length
    ? {
        name: "category",
        label: "Categoría",
        type: "select",
        value: row.category || "",
        options: [{ value: "", label: "Sin categoría" }, ...cats.map((c) => ({ value: c, label: c }))],
      }
    : {
        name: "category",
        label: "Categoría (crea categorías para poder elegirla)",
        type: "text",
        value: row.category,
        placeholder: "Trabajo, extra...",
      };
  return [
    { name: "amount", label: `Monto (${currency()})`, type: "number", step: "0.01", value: row.amount, required: true },
    { name: "description", label: "Descripción", type: "text", value: row.description, placeholder: "Salario, venta..." },
    categoryField,
    { name: "date", label: "Fecha", type: "date", value: row.date || today(), required: true },
  ];
}

function openIncomeCategoriesSheet() {
  const cats = listIncomeCategories();
  const html = `
    <p class="muted small">Categorías disponibles al registrar un ingreso.</p>
    <div class="budget-form">
      ${
        cats.length
          ? cats
              .map(
                (c) => `<div class="budget-row"><span>${esc(c.name)}</span>
        <button type="button" class="btn ghost danger" data-action="income-cat-del" data-name="${esc(c.name)}">Quitar</button></div>`
              )
              .join("")
          : '<p class="muted small">Aún no hay categorías.</p>'
      }
      <div class="budget-row new">
        <input type="text" id="new-income-cat" placeholder="Nueva categoría" />
      </div>
    </div>
  `;
  openSheet({
    title: "Categorías de ingresos",
    fields: [],
    extraHtml: html,
    submitLabel: "Agregar",
    onSubmit: () => {
      const name = (document.getElementById("new-income-cat").value || "").trim();
      if (name) addIncomeCategory(name);
    },
  });
}

// ---------------- debts ----------------
function debtRemaining(d) {
  return Math.max(Number(d.amount) - Number(d.paid), 0);
}

function debtDone(d) {
  return debtRemaining(d) <= 0.0001;
}

function debtPill(d) {
  if (debtDone(d)) return `<span class="pill ok">Pagada</span>`;
  if (!d.due_date) return "";
  const du = daysUntil(d.due_date);
  if (du < 0) return `<span class="pill danger">Vencida ${fmtDate(d.due_date)}</span>`;
  if (du <= state.reminderDays) return `<span class="pill warn">En ${du} d</span>`;
  return `<span class="pill">${fmtDate(d.due_date)}</span>`;
}

function dueSortKey(d) {
  return !debtDone(d) && d.due_date ? d.due_date : "9999-99-99";
}

function debtSingleCard(d) {
  const paid = Number(d.paid);
  const pct = d.amount > 0 ? Math.min(100, (paid / d.amount) * 100) : 0;
  const remaining = debtRemaining(d);
  const done = debtDone(d);
  return `<article class="debt ${done ? "done" : ""}">
    <div class="debt-top">
      <div><b>${esc(d.name)}</b> ${debtPill(d)}</div>
      <b class="red">${fmt(remaining)}</b>
    </div>
    <div class="progress"><i style="width:${pct}%"></i></div>
    <div class="debt-meta"><span>${fmt(paid)} de ${fmt(d.amount)}</span><span>${pct.toFixed(0)}%</span></div>
    <div class="debt-actions">
      <button class="btn ghost" data-action="debt-pay" data-id="${d.id}">+ Pago</button>
      ${!done ? `<button class="btn ghost" data-action="debt-settle" data-id="${d.id}">Liquidar</button>` : ""}
      <button class="btn ghost" data-action="debt-clone" data-id="${d.id}">Clonar</button>
      <button class="btn ghost" data-action="debt-history" data-id="${d.id}">Historial</button>
      <button class="btn ghost" data-action="debt-edit" data-id="${d.id}">Editar</button>
      <button class="btn ghost danger" data-action="debt-del" data-id="${d.id}">Borrar</button>
    </div>
  </article>`;
}

function debtCuotaRow(c) {
  const paid = Number(c.paid);
  const pct = c.amount > 0 ? Math.min(100, (paid / c.amount) * 100) : 0;
  const remaining = debtRemaining(c);
  const done = debtDone(c);
  return `<div class="plan-cuota ${done ? "done" : ""}">
    <div class="debt-top">
      <div><b>Cuota ${c.installment_no}/${c.installments}</b> ${debtPill(c)}</div>
      <b class="red">${fmt(remaining)}</b>
    </div>
    <div class="progress"><i style="width:${pct}%"></i></div>
    <div class="debt-meta"><span>${fmt(paid)} de ${fmt(c.amount)}</span></div>
    <div class="debt-actions">
      <button class="btn ghost" data-action="debt-pay" data-id="${c.id}">+ Pago</button>
      ${!done ? `<button class="btn ghost" data-action="debt-settle" data-id="${c.id}">Liquidar</button>` : ""}
      <button class="btn ghost" data-action="debt-history" data-id="${c.id}">Historial</button>
      <button class="btn ghost" data-action="debt-edit" data-id="${c.id}">Editar</button>
      <button class="btn ghost danger" data-action="debt-del" data-id="${c.id}">Borrar</button>
    </div>
  </div>`;
}

function debtPlanCard(item) {
  const { planId, cuotas, next, filtered } = item;
  const totalAmount = cuotas.reduce((a, c) => a + Number(c.amount), 0);
  const totalPaid = cuotas.reduce((a, c) => a + Number(c.paid), 0);
  const pct = totalAmount > 0 ? Math.min(100, (totalPaid / totalAmount) * 100) : 0;
  const remaining = Math.max(totalAmount - totalPaid, 0);
  const doneCount = cuotas.filter(debtDone).length;
  const allDone = doneCount === cuotas.length;
  const overdue = cuotas.some((c) => !debtDone(c) && c.due_date && daysUntil(c.due_date) < 0);
  const expanded = expandedPlans.has(planId);
  return `<article class="debt plan ${allDone ? "done" : ""}">
    <div class="debt-top">
      <div><b>${esc(cuotas[0].name)}</b> <span class="pill">${cuotas.length} cuota${cuotas.length === 1 ? "" : "s"}${filtered ? " · mes" : ""}</span> ${
        overdue ? `<span class="pill danger">Vencida</span>` : next ? debtPill(next) : `<span class="pill ok">Pagada</span>`
      }</div>
      <b class="red">${fmt(remaining)}</b>
    </div>
    <div class="progress"><i style="width:${pct}%"></i></div>
    <div class="debt-meta">
      <span>${next ? `Próxima: cuota ${next.installment_no} · ${fmt(next.amount)}${next.due_date ? " · " + fmtDate(next.due_date) : ""}` : "Plan completado"}</span>
      <span>${doneCount}/${cuotas.length}</span>
    </div>
    <div class="debt-meta"><span>${fmt(totalPaid)} de ${fmt(totalAmount)}</span><span>${pct.toFixed(0)}%</span></div>
    <div class="debt-actions">
      ${next ? `<button class="btn ghost" data-action="debt-pay" data-id="${next.id}">+ Pago</button>` : ""}
      <button class="btn ghost" data-action="plan-toggle" data-plan="${esc(planId)}">${expanded ? "Ocultar cuotas" : `Ver cuotas (${cuotas.length})`}</button>
      <button class="btn ghost" data-action="plan-edit" data-plan="${esc(planId)}">Editar plan</button>
      <button class="btn ghost danger" data-action="plan-del" data-plan="${esc(planId)}">Borrar plan</button>
    </div>
    ${expanded ? `<div class="plan-cuotas">${cuotas.map(debtCuotaRow).join("")}</div>` : ""}
  </article>`;
}

function debtItems() {
  const rows = listDebts();
  const singles = [];
  const plansMap = new Map();
  for (const d of rows) {
    if (d.plan_id) {
      if (!plansMap.has(d.plan_id)) plansMap.set(d.plan_id, []);
      plansMap.get(d.plan_id).push(d);
    } else {
      singles.push(d);
    }
  }
  const items = singles.map((d) => ({ kind: "single", d, key: dueSortKey(d) }));
  for (const [planId, cuotas] of plansMap) {
    cuotas.sort((a, b) => a.installment_no - b.installment_no);
    const next = cuotas.filter((c) => !debtDone(c)).sort((a, b) => (a.due_date < b.due_date ? -1 : 1))[0] || null;
    items.push({ kind: "plan", planId, cuotas, next, key: next ? dueSortKey(next) : "9999-99-99" });
  }
  return items.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
}

function itemRemaining(item) {
  if (item.kind === "single") return debtRemaining(item.d);
  return item.cuotas.reduce((a, c) => a + debtRemaining(c), 0);
}

function filterDebtItems(items) {
  const f = state.filters.debts;
  const q = (f.q || "").trim().toLowerCase();
  const out = [];
  for (const item of items) {
    if (item.kind === "single") {
      const d = item.d;
      if (q && !`${d.name || ""} ${d.notes || ""}`.toLowerCase().includes(q)) continue;
      if (f.month && (d.due_date || "").slice(0, 7) !== f.month) continue;
      out.push(item);
    } else {
      if (q && !item.cuotas.some((d) => `${d.name || ""} ${d.notes || ""}`.toLowerCase().includes(q))) continue;
      let cuotas = item.cuotas;
      if (f.month) {
        cuotas = cuotas.filter((c) => (c.due_date || "").slice(0, 7) === f.month);
        if (!cuotas.length) continue;
      }
      const next =
        cuotas.filter((c) => !debtDone(c)).sort((a, b) => (a.due_date < b.due_date ? -1 : 1))[0] || null;
      out.push({ ...item, cuotas, next, filtered: !!f.month });
    }
  }
  return out;
}

function renderDebts() {
  title.textContent = "Deudas";
  view.innerHTML = `
    <div class="toolbar">
      <div class="total-box"><span>Pendiente</span><b class="red" id="list-total">${fmt(0)}</b></div>
      <button class="btn primary" data-action="debt-new">+ Deuda</button>
    </div>
    ${filterBar("debts", false)}
    <div id="list-area"></div>
  `;
  wireFilters("debts");
  renderDebtList();
}

function renderDebtList() {
  const items = filterDebtItems(debtItems());
  setListTotal(items.reduce((a, it) => a + itemRemaining(it), 0), "red");
  const area = document.getElementById("list-area");
  if (!area) return;
  area.innerHTML = items.length
    ? `<div class="debt-list">${items
        .map((it) => (it.kind === "plan" ? debtPlanCard(it) : debtSingleCard(it.d)))
        .join("")}</div>`
    : empty("Sin deudas registradas. ¡Bien ahí!");
}


function debtFields(row = {}) {
  return [
    { name: "name", label: "Nombre / Acreedor", type: "text", value: row.name, required: true, placeholder: "Tarjeta, préstamo..." },
    { name: "amount", label: `Monto total (${currency()})`, type: "number", step: "0.01", value: row.amount, required: true },
    { name: "due_date", label: "Fecha de vencimiento", type: "date", value: row.due_date || "" },
    { name: "notes", label: "Notas", type: "textarea", value: row.notes, placeholder: "Interés, condiciones..." },
  ];
}

function openDebtForm() {
  const model = {
    name: "",
    amount: "",
    due_date: "",
    notes: "",
    cuotas: false,
    count: 6,
    every_days: 14,
  };

  const fieldsFor = () => [
    { name: "name", label: "Nombre / Acreedor", type: "text", value: model.name, required: true, placeholder: "Tarjeta, préstamo..." },
    { name: "amount", label: model.cuotas ? `Monto por cuota (${currency()})` : `Monto total (${currency()})`, type: "number", step: "0.01", value: model.amount, required: true },
    { name: "due_date", label: model.cuotas ? "Fecha de la primera cuota" : "Fecha de vencimiento", type: "date", value: model.due_date, required: model.cuotas },
    { name: "notes", label: "Notas", type: "textarea", value: model.notes, placeholder: "Interés, condiciones..." },
  ];

  const extrasHtml = () => `
    <label class="switch-row">
      <input type="checkbox" id="debt-cuotas" ${model.cuotas ? "checked" : ""} />
      <span>Deuda en cuotas</span>
    </label>
    ${
      model.cuotas
        ? `<div class="grid-2">
             <label class="field"><span>Número de cuotas</span><input type="number" id="debt-count" min="1" value="${esc(model.count)}" inputmode="numeric" /></label>
             <label class="field"><span>Cada (días)</span><input type="number" id="debt-every" min="1" value="${esc(model.every_days)}" inputmode="numeric" /></label>
           </div>
           <div class="quick-days">
             <button type="button" class="btn ghost" data-debt-every="7">Semanal</button>
             <button type="button" class="btn ghost" data-debt-every="14">Cada 14 días</button>
             <button type="button" class="btn ghost" data-debt-every="15">Quincenal</button>
             <button type="button" class="btn ghost" data-debt-every="30">Mensual</button>
           </div>`
        : ""
    }`;

  const capture = () => {
    const gn = (n) => {
      const el = sheetForm.querySelector(`[name="${n}"]`);
      return el ? el.value : undefined;
    };
    for (const k of ["name", "amount", "due_date", "notes"]) {
      const v = gn(k);
      if (v !== undefined) model[k] = v;
    }
    const count = document.getElementById("debt-count");
    if (count) model.count = count.value;
    const every = document.getElementById("debt-every");
    if (every) model.every_days = every.value;
  };

  const render = () => {
    sheetBody.innerHTML = fieldsFor().map(renderField).join("") + extrasHtml();
    const chk = document.getElementById("debt-cuotas");
    if (chk)
      chk.addEventListener("change", (e) => {
        capture();
        model.cuotas = e.target.checked;
        render();
      });
    sheetBody.querySelectorAll("[data-debt-every]").forEach((b) =>
      b.addEventListener("click", () => {
        capture();
        model.every_days = b.dataset.debtEvery;
        render();
      })
    );
  };

  sheetTitle.textContent = "Nueva deuda";
  sheetForm.querySelector(".sheet-submit").textContent = "Crear";
  sheet.classList.add("open");
  render();

  sheetForm.onsubmit = async (e) => {
    e.preventDefault();
    capture();
    const amount = parseAmount(model.amount);
    if (!(amount > 0) || !String(model.name).trim()) return;
    if (model.cuotas) {
      if (!model.due_date) return;
      addDebtPlan({
        name: model.name.trim(),
        amount,
        count: parseInt(model.count, 10) || 1,
        every_days: parseInt(model.every_days, 10) || 30,
        due_date: model.due_date,
        notes: model.notes,
      });
    } else {
      addDebt({ name: model.name.trim(), amount, due_date: model.due_date || null, notes: model.notes });
    }
    closeSheet();
    await rerender();
  };
}

function daysBetween(a, b) {
  const da = new Date(a + "T00:00:00");
  const db2 = new Date(b + "T00:00:00");
  return Math.round((db2 - da) / 86400000);
}

function openPlanForm(planId) {
  const cuotas = listDebts()
    .filter((d) => d.plan_id === planId)
    .sort((a, b) => a.installment_no - b.installment_no);
  if (!cuotas.length) return;
  const first = cuotas[0];
  let gap = 30;
  if (cuotas.length > 1 && cuotas[1].due_date && first.due_date) {
    const g = daysBetween(first.due_date, cuotas[1].due_date);
    if (g > 0) gap = g;
  }
  const model = {
    name: first.name || "",
    amount: first.amount || "",
    due_date: first.due_date || "",
    notes: first.notes || "",
    count: cuotas.length,
    every_days: gap,
  };

  const fieldsFor = () => [
    { name: "name", label: "Nombre / Acreedor", type: "text", value: model.name, required: true },
    { name: "amount", label: `Monto por cuota (${currency()})`, type: "number", step: "0.01", value: model.amount, required: true },
    { name: "due_date", label: "Fecha de la primera cuota", type: "date", value: model.due_date, required: true },
    { name: "notes", label: "Notas", type: "textarea", value: model.notes },
  ];

  const extrasHtml = () => `
    <div class="grid-2">
      <label class="field"><span>Número de cuotas</span><input type="number" id="debt-count" min="1" value="${esc(model.count)}" inputmode="numeric" /></label>
      <label class="field"><span>Cada (días)</span><input type="number" id="debt-every" min="1" value="${esc(model.every_days)}" inputmode="numeric" /></label>
    </div>
    <div class="quick-days">
      <button type="button" class="btn ghost" data-debt-every="7">Semanal</button>
      <button type="button" class="btn ghost" data-debt-every="14">Cada 14 días</button>
      <button type="button" class="btn ghost" data-debt-every="15">Quincenal</button>
      <button type="button" class="btn ghost" data-debt-every="30">Mensual</button>
    </div>
    <p class="muted small">Se recalcularán las cuotas (fechas). Los pagos se conservan por número de cuota.</p>`;

  const capture = () => {
    const gn = (n) => {
      const el = sheetForm.querySelector(`[name="${n}"]`);
      return el ? el.value : undefined;
    };
    for (const k of ["name", "amount", "due_date", "notes"]) {
      const v = gn(k);
      if (v !== undefined) model[k] = v;
    }
    const count = document.getElementById("debt-count");
    if (count) model.count = count.value;
    const every = document.getElementById("debt-every");
    if (every) model.every_days = every.value;
  };

  const render = () => {
    sheetBody.innerHTML = fieldsFor().map(renderField).join("") + extrasHtml();
    sheetBody.querySelectorAll("[data-debt-every]").forEach((b) =>
      b.addEventListener("click", () => {
        capture();
        model.every_days = b.dataset.debtEvery;
        render();
      })
    );
  };

  sheetTitle.textContent = "Editar plan de cuotas";
  sheetForm.querySelector(".sheet-submit").textContent = "Guardar";
  sheet.classList.add("open");
  render();

  sheetForm.onsubmit = async (e) => {
    e.preventDefault();
    capture();
    const amount = parseAmount(model.amount);
    if (!(amount > 0) || !String(model.name).trim() || !model.due_date) return;
    updateDebtPlan(planId, {
      name: model.name.trim(),
      amount,
      count: parseInt(model.count, 10) || 1,
      every_days: parseInt(model.every_days, 10) || 30,
      due_date: model.due_date,
      notes: model.notes,
    });
    closeSheet();
    await rerender();
  };
}

// ---------------- goals ----------------
function goalPill(g) {
  const target = Number(g.target);
  const saved = Number(g.saved);
  if (target > 0 && saved >= target) return `<span class="pill ok">Completada</span>`;
  if (!g.due_date) return "";
  const du = daysUntil(g.due_date);
  if (du < 0) return `<span class="pill danger">Vencida ${fmtDate(g.due_date)}</span>`;
  if (du <= state.reminderDays) return `<span class="pill warn">En ${du} d</span>`;
  return `<span class="pill">${fmtDate(g.due_date)}</span>`;
}

function goalCard(g) {
  const target = Number(g.target);
  const saved = Number(g.saved);
  const pct = target > 0 ? Math.min(100, (saved / target) * 100) : 0;
  const remaining = Math.max(target - saved, 0);
  const done = remaining <= 0.0001 && target > 0;
  return `<article class="debt goal ${done ? "done" : ""}">
    <div class="debt-top">
      <div><b>${esc(g.name)}</b> ${goalPill(g)}</div>
      <b class="green">${fmt(saved)}</b>
    </div>
    <div class="progress"><i style="width:${pct}%"></i></div>
    <div class="debt-meta"><span>${fmt(saved)} de ${fmt(target)}</span><span>${pct.toFixed(0)}%</span></div>
    <div class="debt-meta"><span>${done ? "¡Meta alcanzada!" : "Faltan " + fmt(remaining)}</span></div>
    <div class="debt-actions">
      <button class="btn ghost" data-action="goal-add" data-id="${g.id}">+ Abonar</button>
      <button class="btn ghost" data-action="goal-edit" data-id="${g.id}">Editar</button>
      <button class="btn ghost danger" data-action="goal-del" data-id="${g.id}">Borrar</button>
    </div>
  </article>`;
}

function renderGoals() {
  title.textContent = "Metas";
  const rows = listGoals();
  const totalSaved = rows.reduce((a, g) => a + Number(g.saved), 0);
  const totalTarget = rows.reduce((a, g) => a + Number(g.target), 0);
  view.innerHTML = `
    <div class="toolbar">
      <div class="total-box"><span>Ahorrado</span><b class="green">${fmt(totalSaved)}</b></div>
      <button class="btn primary" data-action="goal-new">+ Meta</button>
    </div>
    <details class="panel calc-panel" id="calc-panel" ${state.savingsOpen ? "open" : ""}>
      <summary>Métodos de ahorro</summary>
      <div class="calc-body">
        <label class="field"><span>Método</span>
          <select id="sc-method">
            <option value="">Elige un método...</option>
            ${SAVINGS_METHODS.map(
              (m) => `<option value="${m.key}" ${savingsCalc.method === m.key ? "selected" : ""}>${esc(m.name)}</option>`
            ).join("")}
          </select>
        </label>
        <label class="field"><span>Ingreso mensual (${currency()})</span>
          <input type="number" id="sc-income" step="0.01" inputmode="decimal" placeholder="0.00" value="${esc(savingsCalc.income)}" />
        </label>
        <div id="sc-result"></div>
      </div>
    </details>
    ${
      rows.length
        ? `<div class="goal-summary muted small">Meta total: ${fmt(totalTarget)}</div>
           <div class="debt-list">${rows.map(goalCard).join("")}</div>`
        : empty("Sin metas. Crea una para empezar a ahorrar.")
    }
  `;
  wireSavingsCalc();
  renderSavingsResult();
}

function renderSavingsResult() {
  const box = document.getElementById("sc-result");
  if (!box) return;
  const method = SAVINGS_METHODS.find((m) => m.key === savingsCalc.method);
  if (!method) {
    box.innerHTML = `<p class="muted small">Elige un método y escribe tu ingreso para ver el reparto.</p>`;
    return;
  }
  const income = parseAmount(savingsCalc.income);
  const valid = Number.isFinite(income) && income > 0;
  const rows = method.parts
    .map((p) => {
      const amount = valid ? (income * p.pct) / 100 : 0;
      return `<li class="sc-row">
        <span class="sc-label">${esc(p.label)} <i class="muted">${p.pct}%</i></span>
        <b class="${p.save ? "green" : ""}">${fmt(amount)}</b>
      </li>`;
    })
    .join("");
  const savCount = method.parts.filter((p) => p.save).length;
  box.innerHTML = `
    <p class="muted small">${esc(method.desc)}</p>
    <ul class="sc-list">${rows}</ul>
    ${
      valid && savCount
        ? `<button class="btn primary sc-create" data-action="savings-create">${
            savCount > 1 ? `Crear ${savCount} metas de ahorro` : "Crear meta de ahorro"
          }</button>`
        : ""
    }
  `;
}

function wireSavingsCalc() {
  const panel = document.getElementById("calc-panel");
  if (panel) panel.addEventListener("toggle", () => { state.savingsOpen = panel.open; });
  const m = document.getElementById("sc-method");
  if (m) m.addEventListener("change", () => { savingsCalc.method = m.value; renderSavingsResult(); });
  const i = document.getElementById("sc-income");
  if (i) i.addEventListener("input", () => { savingsCalc.income = i.value; renderSavingsResult(); });
}

function goalFields(row = {}) {
  return [
    { name: "name", label: "Nombre de la meta", type: "text", value: row.name, required: true, placeholder: "Vacaciones, fondo de emergencia..." },
    { name: "target", label: `Meta (${currency()})`, type: "number", step: "0.01", value: row.target, required: true },
    { name: "saved", label: `Ahorrado (${currency()})`, type: "number", step: "0.01", value: row.saved != null ? row.saved : 0 },
    { name: "due_date", label: "Fecha objetivo (opcional)", type: "date", value: row.due_date || "" },
  ];
}

// ---------------- notes ----------------
function renderNotes() {
  title.textContent = "Notas";
  const rows = listNotes();
  view.innerHTML = `
    <div class="toolbar">
      <div class="total-box"><span>Notas</span><b>${rows.length}</b></div>
      <button class="btn primary" data-action="note-new">+ Nota</button>
    </div>
    ${
      rows.length
        ? `<div class="notes-grid">${rows
            .map(
              (n) => `<article class="note note-c-${esc(n.color || "default")}" data-action="note-edit" data-id="${n.id}">
          <b>${esc(n.title || "Sin título")}</b>
          <p>${esc(n.body || "")}</p>
          <span class="note-date">${fmtDate((n.updated_at || "").slice(0, 10))}</span>
        </article>`
            )
            .join("")}</div>`
        : empty("Sin notas. Crea la primera.")
    }
  `;
}

function noteFields(row = {}) {
  return [
    { name: "title", label: "Título", type: "text", value: row.title },
    { name: "body", label: "Contenido", type: "textarea", value: row.body, rows: 6 },
    {
      name: "color",
      label: "Color",
      type: "select",
      value: row.color || "default",
      options: [
        { value: "default", label: "Gris" },
        { value: "yellow", label: "Amarillo" },
        { value: "green", label: "Verde" },
        { value: "red", label: "Rojo" },
        { value: "blue", label: "Azul" },
        { value: "purple", label: "Morado" },
      ],
    },
  ];
}

// ---------------- settings ----------------
function renderSettings() {
  title.textContent = "Ajustes";
  view.innerHTML = `
    <section class="panel">
      <h3>Apariencia</h3>
      <label class="field"><span>Tema</span>
        <select id="set-theme">
          <option value="system" ${state.theme === "system" ? "selected" : ""}>Según el sistema</option>
          <option value="light" ${state.theme === "light" ? "selected" : ""}>Claro</option>
          <option value="dark" ${state.theme === "dark" ? "selected" : ""}>Oscuro</option>
        </select>
      </label>
      <div class="field">
        <span>Paleta de color</span>
        <div class="palette-grid">
          ${PALETTES.map(
            (p) =>
              `<button type="button" class="palette-swatch ${state.palette === p.key ? "active" : ""}" data-action="palette-set" data-palette="${p.key}" title="Paleta ${esc(p.label)}"><i style="background:${p.color}"></i>${esc(p.label)}</button>`
          ).join("")}
        </div>
      </div>
      <p class="muted small">También puedes alternar claro/oscuro con el botón de la cabecera.</p>
    </section>

    <section class="panel">
      <h3>Preferencias</h3>
      <label class="field"><span>Símbolo de moneda</span><input id="set-currency" value="${esc(state.currency)}" /></label>
      <label class="field"><span>Días de aviso antes de vencimiento</span><input id="set-days" type="number" min="1" max="60" value="${state.reminderDays}" /></label>
      <label class="field"><span>Deudas en cuotas en el balance</span>
        <select id="set-debt-first">
          <option value="0" ${state.debtFirstOnly ? "" : "selected"}>Contar todas las cuotas</option>
          <option value="1" ${state.debtFirstOnly ? "selected" : ""}>Contar solo la primera cuota</option>
        </select>
      </label>
      <button class="btn primary" data-action="save-settings">Guardar preferencias</button>
    </section>

    <section class="panel">
      <h3>Respaldo</h3>
      <p class="muted small">Tus datos viven en SQLite en este dispositivo. Exporta seguido.</p>
      <div class="grid-2">
        <button class="btn ghost" data-action="export-sqlite">Exportar SQLite</button>
        <button class="btn ghost" data-action="export-json">Exportar JSON</button>
        <button class="btn ghost" data-action="export-csv">Exportar CSV</button>
      </div>
      <label class="btn ghost file-btn">
        Importar respaldo
        <input type="file" id="import-input" accept=".sqlite,.db,.json" hidden />
      </label>
      <p class="muted small">Acepta archivos .sqlite o .json exportados por la app.</p>
    </section>

    <section class="panel">
      <h3>Movimientos recurrentes</h3>
      <p class="muted small">Se registran solos según su intervalo (sueldo, renta, suscripciones...).</p>
      <button class="btn ghost" data-action="recurring-open">Gestionar recurrentes</button>
    </section>

    <section class="panel">
      <h3>Recordatorios</h3>
      <p class="muted small">${
        isNative
          ? "Se programan notificaciones locales en el teléfono."
          : "En la versión web se muestran dentro de la app. Instala como PWA o usa el APK para notificaciones."
      }</p>
      <button class="btn ghost" data-action="enable-notifs">Activar notificaciones</button>
    </section>

    ${
      state.installPrompt
        ? `<section class="panel"><h3>Instalar</h3><button class="btn primary" data-action="install">Instalar app</button></section>`
        : ""
    }

    <section class="panel danger-zone">
      <h3>Zona de riesgo</h3>
      <button class="btn danger" data-action="wipe">Borrar todos los datos</button>
    </section>

    <p class="muted small center">Mis Finanzas · v1.0 · datos 100% locales</p>
  `;
  document.getElementById("import-input").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const kind = await importFile(file);
      await loadSettings();
      applyTheme();
      alert("Respaldo importado (" + kind + ").");
      await rerender();
    } catch (err) {
      alert("No se pudo importar: " + err.message);
    }
    e.target.value = "";
  });
  const themeSel = document.getElementById("set-theme");
  if (themeSel) themeSel.addEventListener("change", (e) => {
    const r = e.target.getBoundingClientRect();
    themeRipple(e.target.value, r.left + r.width / 2, r.top + r.height / 2);
  });
}

function empty(msg) {
  return `<div class="empty"><p>${msg}</p></div>`;
}

// ---------------- events ----------------
document.getElementById("tabbar").addEventListener("click", (e) => {
  const btn = e.target.closest(".nav-btn");
  if (btn) setTab(btn.dataset.tab);
});

document.getElementById("theme-toggle").addEventListener("click", (e) => {
  toggleTheme(e.currentTarget, e.clientX, e.clientY);
});

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if (state.theme === "system") applyTheme();
});

document.addEventListener("click", async (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const id = Number(el.dataset.id);
  const action = el.dataset.action;

  switch (action) {
    case "income-new":
      openSheet({ title: "Nuevo ingreso", fields: incomeFields(), onSubmit: (d) => addIncome(d) });
      break;
    case "income-edit": {
      const row = listIncomes().find((r) => r.id === id);
      openSheet({ title: "Editar ingreso", fields: incomeFields(row), onSubmit: (d) => updateIncome(id, d) });
      break;
    }
    case "income-del": {
      const row = listIncomes().find((r) => r.id === id);
      if (!row) break;
      deleteIncome(id);
      await rerender();
      showToast("Ingreso borrado", "Deshacer", async () => {
        addIncome({ amount: row.amount, description: row.description, category: row.category, date: row.date });
        await rerender();
      });
      break;
    }
    case "income-categories-open":
      openIncomeCategoriesSheet();
      break;
    case "list-group-toggle": {
      const kind = el.dataset.kind;
      state.group[kind] = !state.group[kind];
      renderListFor(kind);
      el.textContent = state.group[kind] ? "Vista: por mes" : "Vista: lista";
      break;
    }
    case "goal-new":
      openSheet({ title: "Nueva meta", fields: goalFields(), submitLabel: "Crear", onSubmit: (d) => addGoal(d) });
      break;
    case "goal-edit": {
      const row = listGoals().find((g) => g.id === id);
      if (!row) break;
      openSheet({ title: "Editar meta", fields: goalFields(row), onSubmit: (d) => updateGoal(id, d) });
      break;
    }
    case "goal-add": {
      const g = listGoals().find((x) => x.id === id);
      if (!g) break;
      openSheet({
        title: "Abonar a " + g.name,
        fields: [{ name: "amount", label: `Monto (${currency()})`, type: "number", step: "0.01", required: true }],
        submitLabel: "Abonar",
        onSubmit: (d) => {
          if (parseAmount(d.amount) > 0) contributeGoal(g.id, parseAmount(d.amount));
        },
      });
      break;
    }
    case "goal-del": {
      const g = listGoals().find((x) => x.id === id);
      if (!g) break;
      deleteGoal(id);
      await rerender();
      showToast("Meta borrada", "Deshacer", async () => {
        addGoal({ name: g.name, target: g.target, saved: g.saved, due_date: g.due_date });
        await rerender();
      });
      break;
    }
    case "savings-create": {
      const method = SAVINGS_METHODS.find((m) => m.key === savingsCalc.method);
      const income = parseAmount(savingsCalc.income);
      if (!method || !Number.isFinite(income) || income <= 0) break;
      const parts = method.parts.filter((p) => p.save);
      for (const p of parts) {
        addGoal({ name: `${p.label} (${method.name})`, target: (income * p.pct) / 100, saved: 0, due_date: "" });
      }
      await rerender();
      showToast(parts.length > 1 ? `${parts.length} metas creadas` : "Meta creada");
      break;
    }
    case "income-cat-del":
      deleteIncomeCategory(el.dataset.name);
      openIncomeCategoriesSheet();
      await rerender();
      break;
    case "expense-new":
      openSheet({ title: "Nuevo gasto", fields: expenseFields(), onSubmit: (d) => addExpense(d) });
      break;
    case "expense-edit": {
      const row = listExpenses().find((r) => r.id === id);
      openSheet({ title: "Editar gasto", fields: expenseFields(row), onSubmit: (d) => updateExpense(id, d) });
      break;
    }
    case "expense-del": {
      const row = listExpenses().find((r) => r.id === id);
      if (!row) break;
      deleteExpense(id);
      await rerender();
      showToast("Gasto borrado", "Deshacer", async () => {
        addExpense({ amount: row.amount, description: row.description, category: row.category, date: row.date });
        await rerender();
      });
      break;
    }
    case "expense-clone": {
      const row = listExpenses().find((r) => r.id === id);
      if (row) {
        addExpense({
          amount: row.amount,
          description: row.description,
          category: row.category,
          date: row.date,
        });
        await rerender();
      }
      break;
    }
    case "debt-clone": {
      const d = listDebts().find((r) => r.id === id);
      if (!d) break;
      const hasDate = !!d.due_date;
      openSheet({
        title: "Clonar deuda · " + d.name,
        fields: hasDate
          ? [{ name: "days", label: "Días a sumar a la fecha de vencimiento", type: "number", value: 14 }]
          : [],
        extraHtml:
          (hasDate
            ? `<div class="clone-info">Vencimiento original: <b>${fmtDate(d.due_date)}</b></div>
               <div class="quick-days">
                 <button type="button" class="btn ghost" data-action="preset" data-target="days" data-value="14">+14 días</button>
                 <button type="button" class="btn ghost" data-action="preset" data-target="days" data-value="15">+15 días</button>
                 <button type="button" class="btn ghost" data-action="preset" data-target="days" data-value="0">Misma fecha</button>
               </div>`
            : "") +
          `<div class="clone-info">Se creará una deuda nueva (sin pagos) con el mismo nombre y monto.</div>`,
        submitLabel: "Clonar",
        onSubmit: (data) => {
          const days = parseInt(data.days, 10) || 0;
          const due = d.due_date ? addDaysISO(d.due_date, days) : null;
          addDebt({ name: d.name, amount: d.amount, due_date: due, notes: d.notes });
        },
      });
      break;
    }
    case "preset": {
      const input = sheetForm.querySelector(`[name="${el.dataset.target}"]`);
      if (input) input.value = el.dataset.value;
      break;
    }
    case "recurring-preset": {
      if (recurringCtx) {
        const days = parseInt(el.dataset.days, 10) || null;
        recurringCtx.setSchedule(el.dataset.mode, days, 15);
      }
      break;
    }
    case "debt-new":
      openDebtForm();
      break;
    case "debt-edit": {
      const row = listDebts().find((r) => r.id === id);
      openSheet({ title: "Editar deuda", fields: debtFields(row), onSubmit: (d) => updateDebt(id, d) });
      break;
    }
    case "debt-del": {
      const d = listDebts().find((r) => r.id === id);
      if (!d) break;
      const pays = listPayments(id);
      deleteDebt(id);
      if (d.plan_id) expandedPlans.delete(d.plan_id);
      await rerender();
      showToast("Deuda borrada", "Deshacer", async () => {
        addDebt({ name: d.name, amount: d.amount, due_date: d.due_date, notes: d.notes, plan_id: d.plan_id, installment_no: d.installment_no, installments: d.installments });
        const nd = d.plan_id
          ? listDebts().find((r) => r.plan_id === d.plan_id && r.installment_no === d.installment_no)
          : listDebts().find((r) => r.name === d.name && Number(r.amount) === Number(d.amount));
        if (nd) pays.forEach((p) => addPayment(nd.id, { amount: p.amount, date: p.date }));
        await rerender();
      });
      break;
    }
    case "plan-toggle": {
      const planId = el.dataset.plan;
      if (expandedPlans.has(planId)) expandedPlans.delete(planId);
      else expandedPlans.add(planId);
      renderDebts();
      break;
    }
    case "plan-edit":
      openPlanForm(el.dataset.plan);
      break;
    case "plan-del": {
      const planId = el.dataset.plan;
      const cuotas = listDebts().filter((r) => r.plan_id === planId);
      if (!cuotas.length) break;
      const snapshot = cuotas.map((c) => ({ ...c, pays: listPayments(c.id) }));
      cuotas.forEach((c) => deleteDebt(c.id));
      expandedPlans.delete(planId);
      await rerender();
      showToast("Plan borrado", "Deshacer", async () => {
        for (const c of snapshot) {
          addDebt({ name: c.name, amount: c.amount, due_date: c.due_date, notes: c.notes, plan_id: c.plan_id, installment_no: c.installment_no, installments: c.installments });
          const nd = listDebts().find((r) => r.plan_id === planId && r.installment_no === c.installment_no);
          if (nd) c.pays.forEach((p) => addPayment(nd.id, { amount: p.amount, date: p.date }));
        }
        await rerender();
      });
      break;
    }
    case "debt-settle": {
      const d = listDebts().find((r) => r.id === id);
      if (!d) break;
      const remaining = Math.max(d.amount - d.paid, 0);
      if (remaining <= 0.0001) break;
      openSheet({
        title: "Liquidar deuda · " + d.name,
        fields: [
          { name: "amount", label: `Monto a liquidar (${currency()})`, type: "number", step: "0.01", value: remaining.toFixed(2), required: true },
          { name: "date", label: "Fecha", type: "date", value: today(), required: true },
        ],
        submitLabel: "Liquidar",
        onSubmit: async (data) => {
          const amt = parseAmount(data.amount);
          if (!(amt > 0)) return;
          addPayment(id, { amount: amt, date: data.date });
        },
      });
      break;
    }
    case "debt-pay": {
      const d = listDebts().find((r) => r.id === id);
      if (!d) break;
      const remaining = Math.max(d.amount - d.paid, 0);
      openSheet({
        title: "Registrar pago · " + d.name,
        fields: [
          { name: "amount", label: `Monto (${currency()})`, type: "number", step: "0.01", value: remaining.toFixed(2), required: true },
          { name: "date", label: "Fecha", type: "date", value: today(), required: true },
        ],
        onSubmit: async (data) => {
          const amt = parseAmount(data.amount);
          if (!(amt > 0)) return;
          addPayment(id, { amount: amt, date: data.date });
        },
      });
      break;
    }
    case "debt-history": {
      const d = listDebts().find((r) => r.id === id);
      const pays = listPayments(id);
      const html = pays.length
        ? `<ul class="list compact">${pays
            .map(
              (p) => `<li><div class="li-main"><b>${fmt(p.amount)}</b><span>${fmtDate(p.date)}</span></div>
              <div class="li-right"><button class="btn ghost danger" data-action="pay-del" data-id="${p.id}" data-debt="${id}">Borrar</button></div></li>`
            )
            .join("")}</ul>`
        : '<p class="muted">Sin pagos registrados.</p>';
      openSheet({
        title: "Pagos · " + d.name,
        fields: [],
        extraHtml: html,
        submitLabel: "Cerrar",
        onSubmit: () => {},
      });
      break;
    }
    case "pay-del": {
      const pay = getPayment(id);
      if (!pay) break;
      deletePayment(id);
      closeSheet();
      await rerender();
      showToast("Pago borrado", "Deshacer", async () => {
        addPayment(pay.debt_id, { amount: pay.amount, date: pay.date });
        await rerender();
      });
      break;
    }
    case "budgets-open":
      openBudgetsSheet();
      break;
    case "recurring-open":
      openRecurringList();
      break;
    case "recurring-new":
      openRecurringForm();
      break;
    case "recurring-edit": {
      const row = listRecurring().find((r) => r.id === id);
      if (row) openRecurringForm(row);
      break;
    }
    case "recurring-toggle":
      toggleRecurring(id);
      await rerender();
      openRecurringList();
      break;
    case "recurring-del": {
      const row = listRecurring().find((r) => r.id === id);
      if (!row) break;
      deleteRecurring(id);
      openRecurringList();
      await rerender();
      showToast("Recurrente borrado", "Deshacer", async () => {
        addRecurring({
          type: row.type,
          amount: row.amount,
          description: row.description,
          category: row.category,
          interval_days: row.interval_days,
          schedule: row.schedule,
          day_of_month: row.day_of_month,
          next_date: row.next_date,
        });
        await rerender();
      });
      break;
    }
    case "note-new":
      openSheet({ title: "Nueva nota", fields: noteFields(), onSubmit: (d) => addNote(d) });
      break;
    case "note-edit": {
      const row = listNotes().find((r) => r.id === id);
      openSheet({
        title: "Editar nota",
        fields: noteFields(row),
        submitLabel: "Guardar",
        extraHtml: `<button type="button" class="btn ghost danger full" data-action="note-del" data-id="${id}">Borrar nota</button>`,
        onSubmit: (d) => updateNote(id, d),
      });
      break;
    }
    case "note-del": {
      const row = listNotes().find((r) => r.id === id);
      if (!row) break;
      deleteNote(id);
      closeSheet();
      await rerender();
      showToast("Nota borrada", "Deshacer", async () => {
        addNote({ title: row.title, body: row.body, color: row.color });
        await rerender();
      });
      break;
    }
    case "palette-set": {
      const key = el.dataset.palette;
      runRipple(async () => {
        setPalette(key);
        await rerender();
      }, e.clientX, e.clientY);
      break;
    }
    case "save-settings": {
      const cur = document.getElementById("set-currency").value.trim() || "$";
      const days = Math.max(1, Math.min(60, parseInt(document.getElementById("set-days").value, 10) || 7));
      const debtFirst = document.getElementById("set-debt-first").value === "1";
      setSetting("currency", cur);
      setSetting("reminderDays", days);
      setSetting("debt_first_only", debtFirst ? "1" : "0");
      state.currency = cur;
      state.reminderDays = days;
      state.debtFirstOnly = debtFirst;
      await persist();
      alert("Preferencias guardadas.");
      await rerender();
      break;
    }
    case "export-sqlite":
      await exportSqlite();
      alert(isNative ? "Listo para compartir." : "Archivo descargado.");
      break;
    case "export-json":
      await exportJson();
      alert(isNative ? "Listo para compartir." : "Archivo descargado.");
      break;
    case "export-csv":
      await exportCsv();
      alert(isNative ? "Listo para compartir." : "Archivo descargado.");
      break;
    case "enable-notifs": {
      const ok = await ensureNotificationPermission();
      if (ok) {
        await refreshNotifications({ reminderDays: state.reminderDays });
        alert("Notificaciones activadas.");
      } else {
        alert("Permiso de notificaciones no concedido (o no disponible en web).");
      }
      break;
    }
    case "install":
      if (state.installPrompt) {
        state.installPrompt.prompt();
        state.installPrompt = null;
      }
      break;
    case "wipe":
      if (confirm("Esto borrará TODO. ¿Continuar?") && confirm("¿Seguro? No se puede deshacer.")) {
        localStorage.clear();
        const { replaceWithBytes } = await import("./db.js");
        replaceWithBytes(new Uint8Array(0));
        await persist();
        location.reload();
      }
      break;
  }
});

async function loadSettings() {
  state.currency = getSetting("currency", "$");
  state.reminderDays = parseInt(getSetting("reminderDays", "7"), 10) || 7;
  state.debtFirstOnly = String(getSetting("debt_first_only", "0")) === "1";
  let theme = "system";
  try {
    theme = localStorage.getItem(THEME_KEY) || getSetting("theme", "system");
  } catch (e) {
    theme = getSetting("theme", "system");
  }
  state.theme = theme || "system";
  let palette = "blue";
  try {
    palette = localStorage.getItem(PALETTE_KEY) || getSetting("palette", "blue");
  } catch (e) {
    palette = getSetting("palette", "blue");
  }
  state.palette = PALETTES.some((p) => p.key === palette) ? palette : "blue";
}

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  state.installPrompt = e;
  if (state.tab === "settings") rerender();
});

// ---------------- boot ----------------
async function boot() {
  view.innerHTML = '<div class="empty"><p>Cargando…</p></div>';
  try {
    await initDb();
    await loadSettings();
    applyTheme();
    const created = applyRecurring();
    await rerender();
    if (created > 0) {
      showToast(`Se registraron ${created} movimiento${created > 1 ? "s" : ""} recurrente${created > 1 ? "s" : ""}`, "Ver", () => setTab("expenses"));
    }
    if (isNative) refreshNotifications({ reminderDays: state.reminderDays });
  } catch (err) {
    view.innerHTML = `<div class="empty"><p>Error al iniciar: ${esc(err.message)}</p></div>`;
    console.error(err);
  }
}

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    if (navigator.serviceWorker.controller) location.reload();
  });
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").then((reg) => reg.update()).catch(() => {});
  });
}

boot();
