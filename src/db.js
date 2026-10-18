import { readDbBytes, writeDbBytes } from "./store.js";

let SQL = null;
let db = null;
let dirty = false;
let saveTimer = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS incomes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  amount REAL NOT NULL,
  description TEXT,
  category TEXT,
  date TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  amount REAL NOT NULL,
  description TEXT,
  category TEXT,
  date TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS debts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  due_date TEXT,
  notes TEXT,
  plan_id TEXT,
  installment_no INTEGER,
  installments INTEGER,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  debt_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  body TEXT,
  color TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS budgets (
  category TEXT PRIMARY KEY,
  amount REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS income_categories (
  name TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS recurring (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  category TEXT,
  interval_days INTEGER NOT NULL,
  next_date TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  schedule TEXT NOT NULL DEFAULT 'interval',
  day_of_month INTEGER,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  target REAL NOT NULL,
  saved REAL NOT NULL DEFAULT 0,
  due_date TEXT,
  created_at TEXT NOT NULL
);
`;

function nowISO() {
  return new Date().toISOString();
}

export function today() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function currentMonthKey() {
  return today().slice(0, 7);
}

function addDaysStr(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  const p = (x) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function monthScheduleDates(y, m, day) {
  const last = new Date(y, m, 0).getDate();
  const d = Math.max(1, Math.min(parseInt(day, 10) || 15, 31));
  const set = new Set();
  set.add(Math.min(d, last));
  set.add(last);
  const p = (x) => String(x).padStart(2, "0");
  return [...set].sort((a, b) => a - b).map((dd) => `${y}-${p(m)}-${p(dd)}`);
}

function scheduledOnOrAfter(fromStr, day) {
  let [y, m] = fromStr.split("-").map(Number);
  for (let i = 0; i < 120; i++) {
    for (const ds of monthScheduleDates(y, m, day)) if (ds >= fromStr) return ds;
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return fromStr;
}

function scheduledAfter(fromStr, day) {
  let [y, m] = fromStr.split("-").map(Number);
  for (let i = 0; i < 120; i++) {
    for (const ds of monthScheduleDates(y, m, day)) if (ds > fromStr) return ds;
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return fromStr;
}

export { scheduledOnOrAfter, scheduledAfter };

function ensureColumn(table, col, def) {
  const info = all(`PRAGMA table_info(${table})`);
  if (!info.some((c) => c.name === col)) db.run(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
}

export async function initDb() {
  const initSqlJs = window.initSqlJs;
  if (!initSqlJs) throw new Error("sql.js no cargado");
  SQL = await initSqlJs({ locateFile: () => "vendor/sql-wasm.wasm" });
  const bytes = await readDbBytes();
  db = bytes && bytes.length ? new SQL.Database(bytes) : new SQL.Database();
  db.run("PRAGMA foreign_keys = ON;");
  db.run(SCHEMA);
  ensureColumn("recurring", "schedule", "TEXT NOT NULL DEFAULT 'interval'");
  ensureColumn("recurring", "day_of_month", "INTEGER");
  ensureColumn("debts", "plan_id", "TEXT");
  ensureColumn("debts", "installment_no", "INTEGER");
  ensureColumn("debts", "installments", "INTEGER");
  await persist();
  return db;
}

export function exportBytes() {
  return safeExport();
}

function safeExport() {
  const bytes = db.export();
  db.run("PRAGMA foreign_keys = ON;");
  return bytes;
}

export function replaceWithBytes(bytes) {
  if (db) db.close();
  db = new SQL.Database(bytes);
  db.run("PRAGMA foreign_keys = ON;");
  db.run(SCHEMA);
  markDirty();
}

function markDirty() {
  dirty = true;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => persist(), 300);
}

export async function persist() {
  if (!db) return;
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  dirty = false;
  await writeDbBytes(safeExport());
}

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function one(sql, params = []) {
  return all(sql, params)[0] || null;
}

function run(sql, params = []) {
  db.run(sql, params);
  markDirty();
}

// ---------- settings ----------
export function getSetting(key, fallback = null) {
  const row = one("SELECT value FROM settings WHERE key = ?", [key]);
  return row ? row.value : fallback;
}

export function setSetting(key, value) {
  run(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    [key, String(value)]
  );
}

// ---------- goals ----------
export function listGoals() {
  return all("SELECT * FROM goals ORDER BY (due_date IS NULL), due_date ASC, id DESC");
}

export function addGoal({ name, target, saved, due_date }) {
  run(
    "INSERT INTO goals (name, target, saved, due_date, created_at) VALUES (?, ?, ?, ?, ?)",
    [name, Number(target) || 0, Number(saved) || 0, due_date || null, nowISO()]
  );
}

export function updateGoal(id, { name, target, saved, due_date }) {
  run("UPDATE goals SET name = ?, target = ?, saved = ?, due_date = ? WHERE id = ?", [
    name,
    Number(target) || 0,
    Number(saved) || 0,
    due_date || null,
    id,
  ]);
}

export function contributeGoal(id, amount) {
  run("UPDATE goals SET saved = saved + ? WHERE id = ?", [Number(amount) || 0, id]);
}

export function deleteGoal(id) {
  run("DELETE FROM goals WHERE id = ?", [id]);
}

// ---------- incomes ----------
export function listIncomes() {
  return all("SELECT * FROM incomes ORDER BY date DESC, id DESC");
}

export function addIncome({ amount, description, category, date }) {
  run(
    "INSERT INTO incomes (amount, description, category, date, created_at) VALUES (?, ?, ?, ?, ?)",
    [Number(amount), description || "", category || "", date || today(), nowISO()]
  );
}

export function updateIncome(id, { amount, description, category, date }) {
  run(
    "UPDATE incomes SET amount = ?, description = ?, category = ?, date = ? WHERE id = ?",
    [Number(amount), description || "", category || "", date || today(), id]
  );
}

export function deleteIncome(id) {
  run("DELETE FROM incomes WHERE id = ?", [id]);
}

// ---------- expenses ----------
export function listExpenses() {
  return all("SELECT * FROM expenses ORDER BY date DESC, id DESC");
}

export function addExpense({ amount, description, category, date }) {
  run(
    "INSERT INTO expenses (amount, description, category, date, created_at) VALUES (?, ?, ?, ?, ?)",
    [Number(amount), description || "", category || "", date || today(), nowISO()]
  );
}

export function updateExpense(id, { amount, description, category, date }) {
  run(
    "UPDATE expenses SET amount = ?, description = ?, category = ?, date = ? WHERE id = ?",
    [Number(amount), description || "", category || "", date || today(), id]
  );
}

export function deleteExpense(id) {
  run("DELETE FROM expenses WHERE id = ?", [id]);
}

// ---------- debts ----------
export function listDebts() {
  return all(`
    SELECT d.*, COALESCE(SUM(p.amount), 0) AS paid
    FROM debts d
    LEFT JOIN payments p ON p.debt_id = d.id
    GROUP BY d.id
    ORDER BY (d.due_date IS NULL), d.due_date ASC, d.id DESC
  `);
}

export function addDebt({ name, amount, due_date, notes, plan_id = null, installment_no = null, installments = null }) {
  run(
    "INSERT INTO debts (name, amount, due_date, notes, plan_id, installment_no, installments, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [name, Number(amount), due_date || null, notes || "", plan_id, installment_no, installments, nowISO()]
  );
}

export function addDebtPlan({ name, amount, count, every_days, due_date, notes }) {
  const n = Math.max(1, parseInt(count, 10) || 1);
  const gap = Math.max(1, parseInt(every_days, 10) || 30);
  const start = due_date || today();
  const planId = "plan-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
  for (let i = 0; i < n; i++) {
    addDebt({
      name,
      amount,
      due_date: addDaysStr(start, i * gap),
      notes,
      plan_id: planId,
      installment_no: i + 1,
      installments: n,
    });
  }
  return planId;
}

export function updateDebtPlan(planId, { name, amount, count, every_days, due_date, notes }) {
  const n = Math.max(1, parseInt(count, 10) || 1);
  const gap = Math.max(1, parseInt(every_days, 10) || 30);
  const start = due_date || today();
  const old = all("SELECT * FROM debts WHERE plan_id = ? ORDER BY installment_no ASC", [planId]);
  const paysByNo = new Map();
  for (const o of old) paysByNo.set(o.installment_no, all("SELECT * FROM payments WHERE debt_id = ?", [o.id]));
  for (const o of old) run("DELETE FROM debts WHERE id = ?", [o.id]);
  for (let i = 0; i < n; i++) {
    const no = i + 1;
    run(
      "INSERT INTO debts (name, amount, due_date, notes, plan_id, installment_no, installments, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [name, Number(amount), addDaysStr(start, i * gap), notes || "", planId, no, n, nowISO()]
    );
    const newId = db.exec("SELECT last_insert_rowid() AS id")[0].values[0][0];
    for (const p of paysByNo.get(no) || []) {
      run("INSERT INTO payments (debt_id, amount, date, created_at) VALUES (?, ?, ?, ?)", [newId, p.amount, p.date, p.created_at || nowISO()]);
    }
  }
}

export function updateDebt(id, { name, amount, due_date, notes }) {
  run("UPDATE debts SET name = ?, amount = ?, due_date = ?, notes = ? WHERE id = ?", [
    name,
    Number(amount),
    due_date || null,
    notes || "",
    id,
  ]);
}

export function deleteDebt(id) {
  run("DELETE FROM debts WHERE id = ?", [id]);
}

export function listPayments(debtId) {
  return all("SELECT * FROM payments WHERE debt_id = ? ORDER BY date DESC, id DESC", [debtId]);
}

export function addPayment(debtId, { amount, date }) {
  run("INSERT INTO payments (debt_id, amount, date, created_at) VALUES (?, ?, ?, ?)", [
    debtId,
    Number(amount),
    date || today(),
    nowISO(),
  ]);
}

export function deletePayment(id) {
  run("DELETE FROM payments WHERE id = ?", [id]);
}

export function getPayment(id) {
  return one("SELECT * FROM payments WHERE id = ?", [id]);
}

// ---------- notes ----------
export function listNotes() {
  return all("SELECT * FROM notes ORDER BY updated_at DESC, id DESC");
}

export function addNote({ title, body, color }) {
  const t = nowISO();
  run("INSERT INTO notes (title, body, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?)", [
    title || "",
    body || "",
    color || "default",
    t,
    t,
  ]);
}

export function updateNote(id, { title, body, color }) {
  run("UPDATE notes SET title = ?, body = ?, color = ?, updated_at = ? WHERE id = ?", [
    title || "",
    body || "",
    color || "default",
    nowISO(),
    id,
  ]);
}

export function deleteNote(id) {
  run("DELETE FROM notes WHERE id = ?", [id]);
}

// ---------- aggregates ----------
export function getSummary() {
  const inc = one("SELECT COALESCE(SUM(amount),0) AS t FROM incomes");
  const exp = one("SELECT COALESCE(SUM(amount),0) AS t FROM expenses");
  const debt = one("SELECT COALESCE(SUM(amount),0) AS t FROM debts");
  const firstOnly = String(getSetting("debt_first_only", "0")) === "1";
  const debtForBalance = firstOnly
    ? one("SELECT COALESCE(SUM(amount),0) AS t FROM debts WHERE plan_id IS NULL OR installment_no = 1")
    : debt;
  const paid = one("SELECT COALESCE(SUM(amount),0) AS t FROM payments");
  const totalIncome = inc ? inc.t : 0;
  const totalExpenses = exp ? exp.t : 0;
  const totalDebt = debt ? debt.t : 0;
  const totalPaid = paid ? paid.t : 0;
  const pending = Math.max(totalDebt - totalPaid, 0);
  const outflow = totalExpenses + totalPaid;
  const debtInBalance = debtForBalance ? debtForBalance.t : 0;
  return {
    totalIncome,
    totalExpenses,
    totalDebt,
    totalPaid,
    debtInBalance,
    firstOnly,
    pending,
    outflow,
    balance: totalIncome - totalExpenses - debtInBalance,
    netWorth: totalIncome - totalExpenses - pending,
    countDebts: (one("SELECT COUNT(*) AS c FROM debts") || { c: 0 }).c,
    countIncome: (one("SELECT COUNT(*) AS c FROM incomes") || { c: 0 }).c,
    countExpenses: (one("SELECT COUNT(*) AS c FROM expenses") || { c: 0 }).c,
    countNotes: (one("SELECT COUNT(*) AS c FROM notes") || { c: 0 }).c,
  };
}

export function monthlyTotals(months = 6) {
  const out = [];
  const d = new Date();
  d.setDate(1);
  for (let i = months - 1; i >= 0; i--) {
    const ref = new Date(d.getFullYear(), d.getMonth() - i, 1);
    const key = `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, "0")}`;
    const inc = one("SELECT COALESCE(SUM(amount),0) AS t FROM incomes WHERE substr(date,1,7) = ?", [key]);
    const exp = one("SELECT COALESCE(SUM(amount),0) AS t FROM expenses WHERE substr(date,1,7) = ?", [key]);
    const pay = one("SELECT COALESCE(SUM(amount),0) AS t FROM payments WHERE substr(date,1,7) = ?", [key]);
    out.push({
      key,
      label: ref.toLocaleDateString("es", { month: "short" }),
      income: inc ? inc.t : 0,
      expenses: exp ? exp.t : 0,
      paid: pay ? pay.t : 0,
    });
  }
  return out;
}

export function upcomingDebts(days = 7) {
  const rows = listDebts();
  const limit = new Date();
  limit.setHours(23, 59, 59, 999);
  limit.setDate(limit.getDate() + days);
  const todayStr = today();
  return rows
    .filter((d) => {
      const remaining = d.amount - d.paid;
      if (remaining <= 0.0001) return false;
      if (!d.due_date) return false;
      return d.due_date <= limit.toISOString().slice(0, 10);
    })
    .map((d) => ({
      ...d,
      remaining: d.amount - d.paid,
      overdue: d.due_date < todayStr,
    }))
    .sort((a, b) => (a.due_date < b.due_date ? -1 : 1));
}

export function loadJsonData(data) {
  const t = nowISO();
  db.run("DELETE FROM payments; DELETE FROM debts; DELETE FROM incomes; DELETE FROM expenses; DELETE FROM notes; DELETE FROM budgets; DELETE FROM recurring; DELETE FROM income_categories; DELETE FROM goals;");
  const insIncome = db.prepare(
    "INSERT INTO incomes (amount, description, category, date, created_at) VALUES (?, ?, ?, ?, ?)"
  );
  for (const i of data.incomes || []) {
    insIncome.run([Number(i.amount) || 0, i.description || "", i.category || "", i.date || today(), i.created_at || t]);
  }
  insIncome.free();

  const insExpense = db.prepare(
    "INSERT INTO expenses (amount, description, category, date, created_at) VALUES (?, ?, ?, ?, ?)"
  );
  for (const x of data.expenses || []) {
    insExpense.run([Number(x.amount) || 0, x.description || "", x.category || "", x.date || today(), x.created_at || t]);
  }
  insExpense.free();

  const insDebt = db.prepare("INSERT INTO debts (name, amount, due_date, notes, plan_id, installment_no, installments, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  const insPay = db.prepare(
    "INSERT INTO payments (debt_id, amount, date, created_at) VALUES (?, ?, ?, ?)"
  );
  for (const d of data.debts || []) {
    insDebt.run([d.name || "", Number(d.amount) || 0, d.due_date || null, d.notes || "", d.plan_id || null, d.installment_no ?? null, d.installments ?? null, d.created_at || t]);
    const id = db.exec("SELECT last_insert_rowid() AS id")[0].values[0][0];
    for (const p of d.payments || []) {
      insPay.run([id, Number(p.amount) || 0, p.date || today(), p.created_at || t]);
    }
  }
  insDebt.free();
  insPay.free();

  const insNote = db.prepare(
    "INSERT INTO notes (title, body, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
  );
  for (const n of data.notes || []) {
    insNote.run([n.title || "", n.body || "", n.color || "default", n.created_at || t, n.updated_at || t]);
  }
  insNote.free();

  if (data.settings) {
    if (data.settings.currency != null) setSetting("currency", data.settings.currency);
    if (data.settings.reminderDays != null) setSetting("reminderDays", data.settings.reminderDays);
    if (data.settings.debtFirstOnly != null) setSetting("debt_first_only", data.settings.debtFirstOnly ? "1" : "0");
  }

  const insBudget = db.prepare("INSERT INTO budgets (category, amount) VALUES (?, ?)");
  for (const b of data.budgets || []) {
    if (b && b.category) insBudget.run([b.category, Number(b.amount) || 0]);
  }
  insBudget.free();

  const insIncCat = db.prepare("INSERT INTO income_categories (name) VALUES (?)");
  for (const c of data.incomeCategories || []) {
    const name = typeof c === "string" ? c : c && c.name;
    if (name) insIncCat.run([name]);
  }
  insIncCat.free();

  const insRec = db.prepare(
    "INSERT INTO recurring (type, amount, description, category, interval_days, next_date, active, schedule, day_of_month, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  for (const r of data.recurring || []) {
    const sch = r.schedule === "day_last" ? "day_last" : "interval";
    insRec.run([
      r.type === "income" ? "income" : "expense",
      Number(r.amount) || 0,
      r.description || "",
      r.category || "",
      parseInt(r.interval_days, 10) || 30,
      r.next_date || today(),
      r.active === 0 ? 0 : 1,
      sch,
      sch === "day_last" ? parseInt(r.day_of_month, 10) || 15 : null,
      r.created_at || t,
    ]);
  }
  insRec.free();

  const insGoal = db.prepare("INSERT INTO goals (name, target, saved, due_date, created_at) VALUES (?, ?, ?, ?, ?)");
  for (const g of data.goals || []) {
    if (!g) continue;
    insGoal.run([g.name || "", Number(g.target) || 0, Number(g.saved) || 0, g.due_date || null, g.created_at || t]);
  }
  insGoal.free();

  markDirty();
}

export function categoryTotals() {
  return all(
    "SELECT COALESCE(NULLIF(category,''),'Sin categoría') AS category, SUM(amount) AS total FROM incomes GROUP BY category ORDER BY total DESC"
  );
}

export function expenseCategoryTotals() {
  return all(
    "SELECT COALESCE(NULLIF(category,''),'Sin categoría') AS category, SUM(amount) AS total FROM expenses GROUP BY category ORDER BY total DESC"
  );
}

// ---------- budgets ----------
export function listBudgets() {
  return all("SELECT * FROM budgets ORDER BY category ASC");
}

export function setBudget(category, amount) {
  const cat = (category || "").trim();
  if (!cat) return;
  if (!(Number(amount) > 0)) {
    deleteBudget(cat);
    return;
  }
  run(
    "INSERT INTO budgets (category, amount) VALUES (?, ?) ON CONFLICT(category) DO UPDATE SET amount = excluded.amount",
    [cat, Number(amount)]
  );
}

export function deleteBudget(category) {
  run("DELETE FROM budgets WHERE category = ?", [category]);
}

// ---------- income categories ----------
export function listIncomeCategories() {
  return all("SELECT name FROM income_categories ORDER BY name ASC");
}

export function addIncomeCategory(name) {
  const n = (name || "").trim();
  if (!n) return;
  run("INSERT INTO income_categories (name) VALUES (?) ON CONFLICT(name) DO NOTHING", [n]);
}

export function deleteIncomeCategory(name) {
  run("DELETE FROM income_categories WHERE name = ?", [name]);
}

export function monthExpenseByCategory(monthKey = currentMonthKey()) {
  return all(
    "SELECT COALESCE(NULLIF(category,''),'Sin categoría') AS category, SUM(amount) AS total FROM expenses WHERE substr(date,1,7) = ? GROUP BY category",
    [monthKey]
  );
}

export function budgetStatus(monthKey = currentMonthKey()) {
  const budgets = listBudgets();
  const spent = monthExpenseByCategory(monthKey);
  const spentMap = {};
  spent.forEach((s) => (spentMap[s.category] = s.total));
  return budgets.map((b) => ({
    category: b.category,
    budget: b.amount,
    spent: spentMap[b.category] || 0,
    remaining: b.amount - (spentMap[b.category] || 0),
    pct: b.amount > 0 ? Math.min(100, ((spentMap[b.category] || 0) / b.amount) * 100) : 0,
  }));
}

// ---------- recurring ----------
export function listRecurring() {
  return all("SELECT * FROM recurring ORDER BY active DESC, next_date ASC, id DESC");
}

export function addRecurring({ type, amount, description, category, interval_days, next_date, schedule, day_of_month }) {
  const sch = schedule === "day_last" ? "day_last" : "interval";
  run(
    "INSERT INTO recurring (type, amount, description, category, interval_days, next_date, active, schedule, day_of_month, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)",
    [
      type === "income" ? "income" : "expense",
      Number(amount),
      description || "",
      category || "",
      Math.max(1, parseInt(interval_days, 10) || 30),
      next_date || today(),
      sch,
      sch === "day_last" ? Math.max(1, Math.min(parseInt(day_of_month, 10) || 15, 31)) : null,
      nowISO(),
    ]
  );
}

export function updateRecurring(id, { type, amount, description, category, interval_days, next_date, active, schedule, day_of_month }) {
  const sch = schedule === "day_last" ? "day_last" : "interval";
  run(
    "UPDATE recurring SET type = ?, amount = ?, description = ?, category = ?, interval_days = ?, next_date = ?, active = ?, schedule = ?, day_of_month = ? WHERE id = ?",
    [
      type === "income" ? "income" : "expense",
      Number(amount),
      description || "",
      category || "",
      Math.max(1, parseInt(interval_days, 10) || 30),
      next_date || today(),
      active ? 1 : 0,
      sch,
      sch === "day_last" ? Math.max(1, Math.min(parseInt(day_of_month, 10) || 15, 31)) : null,
      id,
    ]
  );
}

export function deleteRecurring(id) {
  run("DELETE FROM recurring WHERE id = ?", [id]);
}

export function toggleRecurring(id) {
  const row = one("SELECT active FROM recurring WHERE id = ?", [id]);
  if (row) run("UPDATE recurring SET active = ? WHERE id = ?", [row.active ? 0 : 1, id]);
}

export function applyRecurring() {
  const t = today();
  const rows = all("SELECT * FROM recurring WHERE active = 1");
  let created = 0;
  for (const r of rows) {
    let next = r.next_date;
    let guard = 0;
    while (next <= t && guard < 1000) {
      if (r.type === "income") {
        db.run(
          "INSERT INTO incomes (amount, description, category, date, created_at) VALUES (?, ?, ?, ?, ?)",
          [r.amount, r.description || "", r.category || "", next, nowISO()]
        );
      } else {
        db.run(
          "INSERT INTO expenses (amount, description, category, date, created_at) VALUES (?, ?, ?, ?, ?)",
          [r.amount, r.description || "", r.category || "", next, nowISO()]
        );
      }
      created++;
      next =
        r.schedule === "day_last"
          ? scheduledAfter(next, r.day_of_month)
          : addDaysStr(next, r.interval_days);
      guard++;
    }
    if (next !== r.next_date) run("UPDATE recurring SET next_date = ? WHERE id = ?", [next, r.id]);
  }
  return created;
}
