import { build } from "esbuild";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { rmSync } from "node:fs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outFile = resolve(root, ".tmp-dbtest.cjs");

const storeStub = {
  name: "stub-store",
  setup(b) {
    b.onResolve({ filter: /\/store\.js$|^\.\/store\.js$/ }, () => ({
      path: "store-stub",
      namespace: "stub",
    }));
    b.onLoad({ filter: /.*/, namespace: "stub" }, () => ({
      contents: `export const DB_FILENAME="t.sqlite"; export const isNative=false;
        export async function readDbBytes(){return null;}
        export async function writeDbBytes(){}
        export const bytesToBase64=(b)=>""; export const base64ToBytes=()=>new Uint8Array();`,
      loader: "js",
    }));
  },
};

const entry = `
import initSqlJs from "sql.js";
globalThis.window = globalThis;
globalThis.window.initSqlJs = initSqlJs;
import * as db from ${JSON.stringify(resolve(root, "src/db.js"))};
import { csvData } from ${JSON.stringify(resolve(root, "src/backup.js"))};

function assert(cond, msg){ if(!cond){ console.error("FAIL:", msg); process.exitCode=1;} else console.log("ok -", msg); }

(async () => {
  await db.initDb();
  db.addIncome({ amount: 100, description: "sueldo", category: "Trabajo", date: "2026-10-01" });
  db.addIncome({ amount: 50, description: "extra", category: "Varios", date: "2026-09-15" });
  db.addDebt({ name: "Tarjeta", amount: 500, due_date: "2026-10-20" });
  db.addDebt({ name: "Préstamo", amount: 1000, due_date: "2026-10-25", notes: "x" });
  const debts = db.listDebts();
  assert(debts.length === 2, "2 deudas");
  assert(debts[0].paid === 0, "pagado inicia en 0");
  db.addPayment(debts[0].id, { amount: 200, date: "2026-10-05" });
  const d0 = db.listDebts().find(d => d.id === debts[0].id);
  assert(d0.paid === 200, "pago reflejado = 200");

  db.addExpense({ amount: 30, description: "comida", category: "Comida", date: "2026-10-03" });
  db.addExpense({ amount: 20, description: "bus", category: "Transporte", date: "2026-10-03" });
  assert(db.listExpenses().length === 2, "2 gastos");

  const s = db.getSummary();
  assert(s.totalIncome === 150, "total ingresos 150");
  assert(s.totalExpenses === 50, "total gastos 50");
  assert(s.totalDebt === 1500, "total deuda 1500");
  assert(s.totalPaid === 200, "total pagado 200");
  assert(s.pending === 1300, "pendiente 1300");
  assert(s.balance === -1400, "disponible resta deuda total");

  // deuda en cuotas
  const planId = db.addDebtPlan({ name: "TV", amount: 100, count: 6, every_days: 14, due_date: "2026-10-10" });
  const plan = db.listDebts().filter(d => d.plan_id === planId);
  assert(plan.length === 6, "plan de 6 cuotas");
  assert(plan.every(d => d.installments === 6 && d.installment_no >= 1), "cuotas numeradas 1..6");
  assert(plan.find(d => d.installment_no === 2).due_date === "2026-10-24", "cuota 2 = +14 dias");
  assert(plan.find(d => d.installment_no === 3).due_date === "2026-11-07", "cuota 3 = +28 dias");
  db.setSetting("debt_first_only", "1");
  const sOn = db.getSummary();
  assert(sOn.totalDebt === 2100, "deuda total sigue completa (2100)");
  assert(sOn.debtInBalance === 1600, "balance cuenta solo la 1a cuota (1600)");
  assert(sOn.balance === -1500, "disponible con solo primera cuota");
  db.setSetting("debt_first_only", "0");
  assert(db.getSummary().balance === -2000, "disponible con todas las cuotas");

  // editar plan (recalcula fechas, conserva pagos por cuota)
  const c1 = plan.find(d => d.installment_no === 1);
  db.addPayment(c1.id, { amount: 20, date: "2026-10-11" });
  db.updateDebtPlan(planId, { name: "TV", amount: 120, count: 3, every_days: 10, due_date: "2026-10-19" });
  const plan2 = db.listDebts().filter(d => d.plan_id === planId);
  assert(plan2.length === 3, "plan editado a 3 cuotas");
  assert(plan2[0].due_date === "2026-10-19" && plan2[1].due_date === "2026-10-29" && plan2[2].due_date === "2026-11-08", "fechas recalculadas cada 10 dias");
  assert(plan2.every(d => d.amount === 120), "monto por cuota actualizado");
  assert(plan2.find(d => d.installment_no === 1).paid === 20, "pago conservado al editar plan");

  // borrado en cascada de pagos (FK se re-activa tras export)
  db.addDebt({ name: "solo", amount: 50, due_date: "2026-10-30" });
  const solo = db.listDebts().find(d => d.name === "solo");
  db.addPayment(solo.id, { amount: 5, date: "2026-10-12" });
  await db.persist();
  db.deleteDebt(solo.id);
  assert(db.listPayments(solo.id).length === 0, "pagos eliminados en cascada al borrar deuda");

  const cats = db.expenseCategoryTotals();
  assert(cats.length === 2 && cats[0].total === 30, "gastos por categoria");

  const months = db.monthlyTotals(6);
  assert(months.length === 6, "6 meses");
  const oct = months.find(m => m.key === "2026-10");
  assert(oct && oct.income === 100 && oct.paid === 220 && oct.expenses === 50, "octubre consolidado");

  // presupuestos
  db.setBudget("Comida", 100);
  db.setBudget("Transporte", 10);
  const bs = db.budgetStatus("2026-10");
  const comida = bs.find(b => b.category === "Comida");
  assert(comida && comida.budget === 100 && comida.spent === 30 && comida.remaining === 70, "presupuesto comida 30/100");
  const trans = bs.find(b => b.category === "Transporte");
  assert(trans && trans.pct === 100, "presupuesto transporte excedido 20/10");
  db.setBudget("Comida", 0);
  assert(db.listBudgets().length === 1, "presupuesto en 0 se elimina");

  // recurrentes
  db.addRecurring({ type: "expense", amount: 10, description: "sub", category: "Servicios", interval_days: 30, next_date: "2026-10-01" });
  const created = db.applyRecurring();
  assert(created === 1, "recurrente aplicado 1 vez");
  const rec = db.listRecurring()[0];
  assert(rec.next_date === "2026-10-31", "recurrente avanza a 2026-10-31");
  assert(db.listExpenses().some(e => e.description === "sub"), "gasto recurrente creado");
  assert(db.applyRecurring() === 0, "recurrente no repite el mismo dia");

  // recurrente "dia 15 y ultimo del mes"
  db.addRecurring({ type: "income", amount: 50, description: "quincena", schedule: "day_last", day_of_month: 15, interval_days: 30, next_date: "2026-10-01" });
  const c2 = db.applyRecurring();
  assert(c2 === 2, "recurrente 15 y ultimo: registra el 1 y el 15");
  const r2 = db.listRecurring().find(x => x.description === "quincena");
  assert(r2.next_date === "2026-10-31", "siguiente = ultimo del mes (31)");
  assert(db.scheduledOnOrAfter("2026-10-17", 15) === "2026-10-31", "siguiente ocurrencia = ultimo dia");
  assert(db.scheduledOnOrAfter("2026-02-16", 15) === "2026-02-28", "febrero termina el 28");
  assert(db.scheduledOnOrAfter("2026-04-20", 31) === "2026-04-30", "dia 31 se ajusta a 30 en abril");

  // categorias de ingreso
  db.addIncomeCategory("Trabajo");
  db.addIncomeCategory("  ");
  assert(db.listIncomeCategories().length === 1, "categoria de ingreso creada");
  db.deleteIncomeCategory("Trabajo");
  assert(db.listIncomeCategories().length === 0, "categoria de ingreso borrada");

  const up = db.upcomingDebts(7);
  assert(Array.isArray(up), "upcoming devuelve array");

  db.addNote({ title: "Idea", body: "comprar", color: "yellow" });
  assert(db.listNotes().length === 1, "nota creada");

  db.addGoal({ name: "Viaje", target: 1000, saved: 100, due_date: "2026-12-01" });
  assert(db.listGoals().length === 1, "meta creada");
  const goalId = db.listGoals()[0].id;
  db.contributeGoal(goalId, 250);
  assert(db.listGoals()[0].saved === 350, "abono a meta");
  db.updateGoal(goalId, { name: "Viaje", target: 1200, saved: 350, due_date: null });
  assert(db.listGoals()[0].target === 1200 && db.listGoals()[0].due_date === null, "meta actualizada");
  db.deleteGoal(goalId);
  assert(db.listGoals().length === 0, "meta borrada");

  const updId = db.listIncomes()[0].id;
  db.updateIncome(updId, { amount: 999, description: "z", category: "c", date: "2026-10-01" });
  assert(db.listIncomes().find(r => r.id === updId).amount === 999, "ingreso actualizado");

  const json = db.loadJsonData({
    app: "mis-finanzas",
    settings: { currency: "Q", reminderDays: 10, debtFirstOnly: true },
    incomes: [{ amount: 7, date: "2026-01-01" }],
    expenses: [{ amount: 3, category: "Cafe", date: "2026-01-03" }],
    debts: [{ name: "d", amount: 10, plan_id: "pl", installment_no: 1, installments: 3, payments: [{ amount: 5, date: "2026-01-02" }] }],
    notes: [{ title: "t", body: "x" }],
    budgets: [{ category: "Cafe", amount: 50 }],
    incomeCategories: ["Trabajo", "Ventas"],
    recurring: [{ type: "income", amount: 100, description: "sueldo", category: "Trabajo", interval_days: 30, next_date: "2026-02-01", schedule: "day_last", day_of_month: 15 }],
    goals: [{ name: "Auto", target: 5000, saved: 500, due_date: "2027-01-01" }],
  });
  const s2 = db.getSummary();
  assert(s2.totalIncome === 7 && s2.totalPaid === 5 && s2.totalDebt === 10, "importacion JSON");
  assert(s2.totalExpenses === 3, "gasto importado");
  assert(s2.balance === -6, "disponible tras importar = 7-3-10");
  assert(db.listBudgets().length === 1 && db.listBudgets()[0].category === "Cafe", "presupuesto importado");
  assert(db.listIncomeCategories().length === 2, "categorias de ingreso importadas");
  assert(db.listRecurring().length === 1 && db.listRecurring()[0].amount === 100, "recurrente importado");
  assert(db.listRecurring()[0].schedule === "day_last" && db.listRecurring()[0].day_of_month === 15, "horario day_last importado");
  assert(db.getSetting("currency") === "Q", "moneda importada");
  assert(db.getSetting("debt_first_only") === "1", "preferencia cuota importada");
  assert(db.listDebts()[0].plan_id === "pl" && db.listDebts()[0].installment_no === 1, "cuota importada");
  assert(db.listPayments(db.listDebts()[0].id).length === 1, "pago importado ligado");
  assert(db.listGoals().length === 1 && db.listGoals()[0].saved === 500, "meta importada");

  const csv = csvData();
  assert(csv.startsWith("tipo,fecha,descripcion,categoria,monto,estado"), "csv encabezado");
  assert(csv.includes("Ingreso") && csv.includes("Gasto") && csv.includes("Deuda") && csv.includes("Pago"), "csv tipos");

  console.log(process.exitCode ? "\\nRESULTADO: FALLÓ" : "\\nRESULTADO: TODO OK");
})();
`;

await build({
  stdin: { contents: entry, resolveDir: root, loader: "js" },
  bundle: true,
  platform: "node",
  format: "cjs",
  outfile: outFile,
  plugins: [storeStub],
  logLevel: "warning",
});

await import(outFile + "?t=" + Date.now());
rmSync(outFile, { force: true });
