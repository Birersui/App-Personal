import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { isNative } from "./store.js";
import { upcomingDebts } from "./db.js";

export async function ensureNotificationPermission() {
  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display === "granted") return true;
    const req = await LocalNotifications.requestPermissions();
    return req.display === "granted";
  } catch (e) {
    return false;
  }
}

export async function refreshNotifications(settings = {}) {
  if (!isNative) return;
  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }
    const debts = upcomingDebts(settings.reminderDays || 7).filter((d) => !d.overdue);
    const notifications = debts.map((d) => ({
      id: 1000 + (d.id % 100000),
      title: "Pago próximo: " + d.name,
      body: `Vence el ${d.due_date}. Restan ${(d.remaining).toFixed(2)}`,
      schedule: { at: new Date(d.due_date + "T09:00:00"), allowWhileIdle: true },
    }));
    if (notifications.length) await LocalNotifications.schedule({ notifications });
  } catch (e) {
    console.warn("No se pudieron programar notificaciones", e);
  }
}

export function isNativePlatform() {
  return Capacitor.isNativePlatform();
}
