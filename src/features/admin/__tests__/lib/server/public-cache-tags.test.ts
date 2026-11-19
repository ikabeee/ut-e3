/**
 * @jest-environment node
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { PUBLIC_CACHE_TAGS } from "@features/admin/lib/server/public-cache-tags";

const SOURCE = path.join(process.cwd(), "src");

describe("PUBLIC_CACHE_TAGS", () => {
  it("covers every tag that a cached query of src/ declares with cacheTag()", () => {
    const sources = listSourceFiles(SOURCE).map((file) => readFileSync(file, "utf8"));
    const names = sources.flatMap((text) => [...text.matchAll(/cacheTag\((\w+)\)/g)].map((match) => match[1]));

    expect(names.length).toBeGreaterThan(0);

    const values = [...new Set(names)].map((name) => findTagValue(sources, name));

    expect(values.toSorted()).toEqual([...PUBLIC_CACHE_TAGS].toSorted());
  });
});

function findTagValue(sources: string[], name: string): string {
  const definition = new RegExp(`const ${name} = "([^"]+)"`);
  const text = sources.find((source) => definition.test(source));

  return definition.exec(text ?? "")?.[1] ?? `missing:${name}`;
}

function listSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);

    if (entry.isDirectory()) return entry.name === "__tests__" ? [] : listSourceFiles(full);

    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });
}
