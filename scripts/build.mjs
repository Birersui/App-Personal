import { build } from "esbuild";
import { cpSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "www");

mkdirSync(resolve(outDir, "js"), { recursive: true });
mkdirSync(resolve(outDir, "vendor"), { recursive: true });
mkdirSync(resolve(outDir, "icons"), { recursive: true });

await build({
  entryPoints: [resolve(root, "src/main.js")],
  bundle: true,
  format: "esm",
  target: ["es2020"],
  minify: false,
  sourcemap: false,
  outfile: resolve(outDir, "js/bundle.js"),
  loader: { ".wasm": "file" },
});

cpSync(resolve(root, "src/styles.css"), resolve(outDir, "css/styles.css"), {
  recursive: true,
});

const sqlJs = resolve(root, "node_modules/sql.js/dist/sql-wasm.wasm");
if (existsSync(sqlJs)) cpSync(sqlJs, resolve(outDir, "vendor/sql-wasm.wasm"));

console.log("build listo -> www/");
