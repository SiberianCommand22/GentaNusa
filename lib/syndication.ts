import fs from "fs";
import path from "path";

export type Source = {
  id: string;
  name: string;
  url: string;
  category: string;
  color: string;
  notice: string;
};

export type SyndicatedItem = {
  id: string;
  sourceId: string;
  sourceName: string;
  title: string;
  excerpt: string;
  link: string;
  category: string;
  date: string;
};

const dataDir = path.join(process.cwd(), "lib", "data");

export function getSources(): Source[] {
  const raw = fs.readFileSync(path.join(dataDir, "sources.json"), "utf-8");
  return JSON.parse(raw) as Source[];
}

export function getSourceById(id: string): Source | undefined {
  return getSources().find((s) => s.id === id);
}

export function getSyndicated(): SyndicatedItem[] {
  const raw = fs.readFileSync(
    path.join(dataDir, "syndicated.json"),
    "utf-8"
  );
  return JSON.parse(raw) as SyndicatedItem[];
}
