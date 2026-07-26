import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, "..");
const output = resolve(root, "dist", "nexus-chapter2-standalone.html");

const [html, css, js] = await Promise.all([
  readFile(resolve(root, "index.html"), "utf8"),
  readFile(resolve(root, "styles.css"), "utf8"),
  readFile(resolve(root, "script.js"), "utf8"),
]);

const styleTag = `<style>\n${css}\n</style>`;
const scriptTag = `<script>\n${js.replace(/<\/script/gi, "<\\/script")}\n</script>`;
const standalone = html
  .replace('    <link rel="stylesheet" href="./styles.css" />', styleTag)
  .replace('    <script src="./script.js"></script>', scriptTag)
  .replace(
    "<head>",
    '<head>\n    <!-- Standalone offline build: CSS and JavaScript are embedded. -->\n    <link rel="icon" href="data:," />'
  );

if (standalone === html || standalone.includes("./styles.css") || standalone.includes("./script.js")) {
  throw new Error("Standalone build failed to inline local CSS or JavaScript.");
}

await mkdir(dirname(output), { recursive: true });
await writeFile(output, standalone, "utf8");
console.log(output);
