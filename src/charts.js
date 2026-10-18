if (typeof CanvasRenderingContext2D !== "undefined" && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    const rad = Math.min(Array.isArray(r) ? r[0] : r, w / 2, h / 2);
    this.moveTo(x + rad, y);
    this.arcTo(x + w, y, x + w, y + h, rad);
    this.arcTo(x + w, y + h, x, y + h, rad);
    this.arcTo(x, y + h, x, y, rad);
    this.arcTo(x, y, x + w, y, rad);
    this.closePath();
    return this;
  };
}

function palette() {
  const cs = getComputedStyle(document.documentElement);
  const v = (name, fallback) => cs.getPropertyValue(name).trim() || fallback;
  return {
    accent: v("--accent", "#5b8cff"),
    green: v("--green", "#34d399"),
    red: v("--red", "#fb7185"),
    orange: v("--orange", "#fbbf24"),
    muted: v("--muted", "#6f7b8d"),
    text: v("--text", "#eef2f8"),
    grid: v("--line-strong", "rgba(148,163,184,0.25)"),
  };
}

function setupCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(rect.width, 10);
  const h = Math.max(rect.height, 10);
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return { ctx, w, h };
}

function fmtShort(n) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (abs >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(Math.round(n));
}

export function drawBarChart(canvas, data) {
  const P = palette();
  const { ctx, w, h } = setupCanvas(canvas);
  const pad = { top: 16, right: 8, bottom: 26, left: 40 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;
  const max = Math.max(1, ...data.map((d) => Math.max(d.income || 0, d.expenses || 0, d.paid || 0)));

  ctx.strokeStyle = P.grid;
  ctx.fillStyle = P.muted;
  ctx.font = "10px system-ui, sans-serif";
  ctx.lineWidth = 1;
  const lines = 4;
  for (let i = 0; i <= lines; i++) {
    const y = pad.top + (plotH * i) / lines;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(w - pad.right, y);
    ctx.stroke();
    const val = max - (max * i) / lines;
    ctx.fillText(fmtShort(val), 4, y + 3);
  }

  const groupW = plotW / data.length;
  const barW = Math.min(9, groupW / 4.2);
  const gap = 2;
  data.forEach((d, i) => {
    const cx = pad.left + groupW * i + groupW / 2;
    const bars = [
      { v: d.income || 0, color: P.green, off: -(barW + gap) },
      { v: d.expenses || 0, color: P.orange, off: 0 },
      { v: d.paid || 0, color: P.red, off: barW + gap },
    ];
    for (const b of bars) {
      const bh = (b.v / max) * plotH;
      if (bh <= 0) continue;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.roundRect(cx + b.off - barW / 2, pad.top + plotH - bh, barW, bh, 2);
      ctx.fill();
    }
    ctx.fillStyle = P.muted;
    ctx.textAlign = "center";
    ctx.fillText(d.label, cx, h - 8);
    ctx.textAlign = "left";
  });
}

export function drawDonut(canvas, { paid, pending }) {
  const P = palette();
  const { ctx, w, h } = setupCanvas(canvas);
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) / 2 - 8;
  const total = paid + pending;
  const start = -Math.PI / 2;

  if (total <= 0) {
    ctx.strokeStyle = P.grid;
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = P.muted;
    ctx.font = "12px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Sin deudas", cx, cy + 4);
    return;
  }

  const paidAngle = (paid / total) * Math.PI * 2;
  ctx.lineWidth = 14;
  ctx.lineCap = "butt";

  ctx.strokeStyle = P.green;
  ctx.beginPath();
  ctx.arc(cx, cy, r, start, start + paidAngle);
  ctx.stroke();

  ctx.strokeStyle = P.red;
  ctx.beginPath();
  ctx.arc(cx, cy, r, start + paidAngle, start + Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = P.text;
  ctx.font = "600 18px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(Math.round((paid / total) * 100) + "%", cx, cy - 6);
  ctx.fillStyle = P.muted;
  ctx.font = "11px system-ui, sans-serif";
  ctx.fillText("pagado", cx, cy + 12);
  ctx.textBaseline = "alphabetic";
}
