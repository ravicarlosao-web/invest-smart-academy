/**
 * Content seeding — runs at startup.
 * Inserts demo content into dedicated DB tables if they are empty.
 * Once an admin edits content via the admin panel, the DB rows take over.
 */
import {
  db, sql,
  glossaryTermsTable,
  strategiesTable,
  booksTable,
  resourceSectionsTable,
  resourceItemsTable,
  curriculumLevelsTable,
  curriculumLessonsTable,
} from "@workspace/db";
import { GLOSSARY } from "./content/glossary.js";
import { STRATEGIES } from "./content/strategies.js";
import { BOOKS_CATALOG } from "./content/books.js";
import { RESOURCES } from "./content/resources.js";
import { LEVELS } from "./content/curriculum.js";

const NOW = Date.now();

async function isEmpty(table: Parameters<typeof db.select>[0] extends undefined ? never : any, tableName: string): Promise<boolean> {
  const res = await db.run(sql.raw(`SELECT COUNT(*) as n FROM ${tableName}`));
  const rows = (res as any).rows ?? [];
  const count = rows[0] ? Number(rows[0][0] ?? rows[0].n ?? 0) : 0;
  return count === 0;
}

async function seedGlossary() {
  if (!(await isEmpty(null, "glossary_terms"))) return;

  await db.insert(glossaryTermsTable).values(
    GLOSSARY.map((t, i) => ({
      term:       t.term,
      definition: t.definition,
      category:   t.category,
      sortOrder:  i,
      createdAt:  NOW,
      updatedAt:  NOW,
    })),
  );
  console.info(`[seed] glossary_terms: ${GLOSSARY.length} terms`);
}

async function seedStrategies() {
  if (!(await isEmpty(null, "strategies"))) return;

  await db.insert(strategiesTable).values(
    STRATEGIES.map((s, i) => ({
      id:             s.id,
      name:           s.name,
      subtitle:       s.subtitle,
      icon:           s.icon,
      timeframes:     JSON.stringify(s.timeframes),
      markets:        JSON.stringify(s.markets),
      riskLevel:      s.riskLevel,
      winRate:        s.winRate,
      riskReward:     s.riskReward,
      difficulty:     s.difficulty,
      description:    s.description,
      howItWorks:     s.howItWorks,
      setup:          JSON.stringify(s.setup),
      entrySignals:   JSON.stringify(s.entrySignals),
      exitSignals:    JSON.stringify(s.exitSignals),
      riskManagement: JSON.stringify(s.riskManagement),
      pros:           JSON.stringify(s.pros),
      cons:           JSON.stringify(s.cons),
      example:        s.example,
      tags:           JSON.stringify(s.tags),
      sortOrder:      i,
      createdAt:      NOW,
      updatedAt:      NOW,
    })),
  );
  console.info(`[seed] strategies: ${STRATEGIES.length} rows`);
}

async function seedBooks() {
  if (!(await isEmpty(null, "books"))) return;

  await db.insert(booksTable).values(
    BOOKS_CATALOG.map((b) => ({
      id:          b.id,
      orderNum:    b.order,
      title:       b.title,
      author:      b.author,
      cover:       b.cover,
      category:    b.category,
      description: b.description,
      pages:       b.pages,
      docxFile:    b.docxFile ?? null,
      content:     b.content  ?? null,
      createdAt:   NOW,
      updatedAt:   NOW,
    })),
  );
  console.info(`[seed] books: ${BOOKS_CATALOG.length} rows`);
}

async function seedResources() {
  if (!(await isEmpty(null, "resource_sections"))) return;

  await db.insert(resourceSectionsTable).values(
    RESOURCES.map((s, i) => ({
      id:        s.id,
      title:     s.title,
      icon:      s.icon,
      color:     s.color,
      sortOrder: i,
      createdAt: NOW,
      updatedAt: NOW,
    })),
  );

  const items = RESOURCES.flatMap((s, _si) =>
    s.items.map((item, j) => ({
      sectionId:   s.id,
      name:        item.name,
      description: item.description,
      url:         item.url  ?? null,
      badge:       item.badge ?? null,
      stars:       item.stars ?? null,
      tags:        JSON.stringify(item.tags ?? []),
      sortOrder:   j,
      createdAt:   NOW,
      updatedAt:   NOW,
    })),
  );
  await db.insert(resourceItemsTable).values(items);
  console.info(`[seed] resource_sections: ${RESOURCES.length} sections, ${items.length} items`);
}

async function seedCurriculum() {
  if (!(await isEmpty(null, "curriculum_levels"))) return;

  await db.insert(curriculumLevelsTable).values(
    LEVELS.map((l, i) => ({
      id:         l.id,
      title:      l.title,
      subtitle:   l.subtitle,
      difficulty: l.difficulty,
      sortOrder:  i,
      createdAt:  NOW,
      updatedAt:  NOW,
    })),
  );

  const lessons = LEVELS.flatMap((l) =>
    l.lessons.map((lesson, j) => ({
      id:        lesson.id,
      levelId:   l.id,
      title:     lesson.title,
      summary:   lesson.summary,
      xp:        lesson.xp,
      content:   JSON.stringify(lesson.content),
      questions: JSON.stringify(lesson.questions),
      sortOrder: j,
      createdAt: NOW,
      updatedAt: NOW,
    })),
  );

  for (const lesson of lessons) {
    await db.insert(curriculumLessonsTable).values(lesson);
  }
  console.info(`[seed] curriculum: ${LEVELS.length} levels, ${lessons.length} lessons`);
}

export async function seedContent(): Promise<void> {
  try {
    await seedGlossary();
    await seedStrategies();
    await seedBooks();
    await seedResources();
    await seedCurriculum();
  } catch (err) {
    console.error("[seed] error:", err);
  }
}
