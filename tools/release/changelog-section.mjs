// Imprime las notas de una versión del CHANGELOG.md: el cuerpo de la sección "## [<versión>]", sin su encabezado y
// hasta el siguiente "## [". Lo usa el job `release` de .github/workflows/deploy.yml para crear el Release de GitHub.
// Uso: node tools/release/changelog-section.mjs <versión> <archivo>
// Termina con código 1 si la sección no existe o está vacía.
import { readFileSync } from "node:fs";

const SECTION_HEADING_PREFIX = "## [";

main();

function main() {
  const [version, file] = process.argv.slice(2);

  if (!version || !file) {
    console.error("Uso: node tools/release/changelog-section.mjs <versión> <archivo>");
    process.exit(1);
  }

  const notes = extractSection(readFileSync(file, "utf8"), version);

  if (notes === "") {
    console.error(`::error::${file} no tiene una sección "## [${version}]" con contenido`);
    process.exit(1);
  }

  console.log(notes);
}

function extractSection(changelog, version) {
  const lines = changelog.split(/\r?\n/);
  const start = lines.findIndex((line) => isHeadingOf(line, version));

  if (start === -1) return "";

  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith(SECTION_HEADING_PREFIX));
  const body = end === -1 ? rest : rest.slice(0, end);

  return body.join("\n").trim();
}

// El encabezado debe nombrar exactamente la versión entre corchetes: "[1.4.0]" no coincide con "[1.4.0-rc]".
function isHeadingOf(line, version) {
  return line.startsWith(`${SECTION_HEADING_PREFIX}${version}]`);
}
