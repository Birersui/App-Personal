const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const vendor = path.join(root, "www", "vendor");

fs.mkdirSync(vendor, { recursive: true });

const files = [
  {
    from: path.join(root, "node_modules", "sql.js", "dist", "sql-wasm.js"),
    to: path.join(vendor, "sql-wasm.js"),
  },
  {
    from: path.join(root, "node_modules", "sql.js", "dist", "sql-wasm.wasm"),
    to: path.join(vendor, "sql-wasm.wasm"),
  },
];

for (const { from, to } of files) {
  if (fs.existsSync(from)) {
    fs.copyFileSync(from, to);
    console.log("copiado:", path.relative(root, to));
  } else {
    console.warn("falta (se omite):", from);
  }
}
