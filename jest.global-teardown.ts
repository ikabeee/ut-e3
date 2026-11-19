import { rmSync } from "node:fs";
import path from "node:path";

export default function removeTemplateDatabase() {
  const template = process.env.JEST_TEMPLATE_DATABASE;

  if (template) {
    rmSync(path.dirname(template), { recursive: true, force: true });
  }
}
