/**
 * Content seeding — runs at startup.
 * If a content key is missing or empty in admin_settings,
 * we populate it with the default static data.
 * Once an admin saves via the admin panel, the DB version takes over.
 */
import { db, adminSettingsTable, eq } from "@workspace/db";
import { GLOSSARY } from "./content/glossary";
import { STRATEGIES } from "./content/strategies";
import { BOOKS_CATALOG } from "./content/books";
import { RESOURCES } from "./content/resources";
import { LEVELS } from "./content/curriculum";

async function seedKey(key: string, data: unknown): Promise<boolean> {
  const existing = await db
    .select()
    .from(adminSettingsTable)
    .where(eq(adminSettingsTable.key, key))
    .get();

  if (existing?.value) {
    try {
      const parsed = JSON.parse(existing.value);
      if (Array.isArray(parsed) && parsed.length > 0) return false;
      if (!Array.isArray(parsed) && typeof parsed === "object" && Object.keys(parsed).length > 0) return false;
    } catch {
      // invalid JSON — overwrite below
    }
  }

  const now = Date.now();
  const json = JSON.stringify(data);
  await db
    .insert(adminSettingsTable)
    .values({ key, value: json, updatedAt: now })
    .onConflictDoUpdate({ target: adminSettingsTable.key, set: { value: json, updatedAt: now } });

  return true;
}

export async function seedContent(): Promise<void> {
  const seeds: [string, unknown][] = [
    ["content.glossary",   GLOSSARY],
    ["content.strategies", STRATEGIES],
    ["content.books",      BOOKS_CATALOG],
    ["content.resources",  RESOURCES],
    ["content.curriculum", LEVELS],
  ];

  const results = await Promise.allSettled(
    seeds.map(([key, data]) => seedKey(key, data)),
  );

  results.forEach((r, i) => {
    const name = seeds[i][0];
    if (r.status === "fulfilled" && r.value) {
      console.info(`[seed] Seeded ${name} from static data`);
    } else if (r.status === "rejected") {
      console.warn(`[seed] Failed to seed ${name}:`, r.reason);
    }
  });
}
