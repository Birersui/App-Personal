import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { isNative, bytesToBase64 } from "./store.js";
import {
  exportBytes,
  replaceWithBytes,
  listIncomes,
  listExpenses,
  listDebts,
  listNotes,
  listPayments,
  listBudgets,
  listRecurring,
  listIncomeCategories,
  listGoals,
  getSetting,
  loadJsonData,
} from "./db.js";

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

async function saveBytes(filename, bytes, mime) {
  if (isNative) {
    const { uri } = await Filesystem.writeFile({
      path: filename,
      directory: Directory.Cache,
      data: bytesToBase64(bytes),
      recursive: true,
    });
    try {
      await Share.share({
        title: filename,
        url: uri,
        dialogTitle: "Guardar o compartir respaldo",
      });
    } catch (e) {
      return `Cache/${filename}`;
    }
    return filename;
  }
  downloadBlob(filename, new Blob([bytes], { type: mime }));
  return filename;
}

export async function exportSqlite() {
  const bytes = exportBytes();
  const name = `mis-finanzas-${stamp()}.sqlite`;
  return saveBytes(name, bytes, "application/x-sqlite3");
}

export function exportJsonData() {
  const debts = listDebts().map((d) => ({ ...d, payments: listPayments(d.id) }));
  return {
    app: "mis-finanzas",
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: { currency: getSetting("currency", "$"), reminderDays: getSetting("reminderDays", "7"), debtFirstOnly: getSetting("debt_first_only", "0") === "1" },
    incomes: listIncomes(),
    expenses: listExpenses(),
    debts,
    notes: listNotes(),
    budgets: listBudgets(),
    incomeCategories: listIncomeCategories().map((c) => c.name),
    recurring: listRecurring(),
    goals: listGoals(),
  };
}

function csvCell(v) {
  const s = String(v == null ? "" : v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function csvData() {
  const rows = [["tipo", "fecha", "descripcion", "categoria", "monto", "estado"]];
  listIncomes().forEach((i) =>
    rows.push(["Ingreso", i.date, i.description || "", i.category || "", Number(i.amount), ""])
  );
  listExpenses().forEach((e) =>
    rows.push(["Gasto", e.date, e.description || "", e.category || "", Number(e.amount), ""])
  );
  listDebts().forEach((d) =>
    rows.push([
      "Deuda",
      d.due_date || "",
      d.name || "",
      d.plan_id ? `Cuota ${d.installment_no}/${d.installments}` : "",
      Number(d.amount),
      Number(d.paid) > 0 ? "Pagado " + Number(d.paid) : "Pendiente",
    ])
  );
  listDebts().forEach((d) =>
    listPayments(d.id).forEach((p) => rows.push(["Pago", p.date, d.name || "", "", Number(p.amount), ""]))
  );
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
}

export async function exportCsv() {
  const bytes = new TextEncoder().encode("\ufeff" + csvData());
  const name = `mis-finanzas-${stamp()}.csv`;
  return saveBytes(name, bytes, "text/csv");
}

export async function exportJson() {
  const data = exportJsonData();
  const bytes = new TextEncoder().encode(JSON.stringify(data, null, 2));
  const name = `mis-finanzas-${stamp()}.json`;
  return saveBytes(name, bytes, "application/json");
}

export function parseJson(text) {
  const data = JSON.parse(text);
  if (!data || data.app !== "mis-finanzas") throw new Error("Archivo JSON no válido");
  return data;
}

export async function importFile(file) {
  const name = (file.name || "").toLowerCase();
  if (name.endsWith(".sqlite") || name.endsWith(".db")) {
    const buf = new Uint8Array(await file.arrayBuffer());
    replaceWithBytes(buf);
    return "sqlite";
  }
  const text = await file.text();
  const data = parseJson(text);
  await loadJsonData(data);
  return "json";
}
