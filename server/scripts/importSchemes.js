/**
 * Import schemes_enriched.csv (3400 real govt schemes) into the `schemes` SQLite table.
 * Run directly: `npm run import:schemes`
 * Also called from db.js on first boot if the schemes table is empty.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_PATH = path.join(__dirname, '..', 'data', 'schemes_enriched.csv');

function blankToNull(v) {
  if (v === undefined || v === null) return null;
  const trimmed = String(v).trim();
  return trimmed === '' ? null : trimmed;
}

function toInt(v) {
  const s = blankToNull(v);
  if (s === null) return null;
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? null : n;
}

// Split eligibility prose into sentence bullets, stored as a JSON array
// (keeps existing `JSON.parse(eligibility || '[]')` call sites working).
function eligibilityToArray(text) {
  const s = blankToNull(text);
  if (s === null) return [];
  return s
    .split(/(?<=[.!?])\s+/)
    .map(x => x.trim())
    .filter(Boolean);
}

export function importSchemesFromCSV(db, csvPath = CSV_PATH) {
  const raw = fs.readFileSync(csvPath, 'utf8');
  const records = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
  });

  const insert = db.prepare(`
    INSERT OR IGNORE INTO schemes
    (id, name, slug, description, benefit, eligibility, application, documents, level, category, tags,
     gender, min_age, max_age, max_income, social_category, occupation_keywords, applicable_states, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')
  `);

  const run = db.transaction(rows => {
    let count = 0;
    for (const r of rows) {
      const slug = blankToNull(r.slug);
      if (!slug) continue;
      insert.run(
        slug,
        blankToNull(r.scheme_name),
        slug,
        blankToNull(r.details),
        blankToNull(r.benefits),
        JSON.stringify(eligibilityToArray(r.eligibility)),
        blankToNull(r.application),
        blankToNull(r.documents),
        blankToNull(r.level),
        blankToNull(r.schemeCategory),
        blankToNull(r.tags),
        blankToNull(r.gender),
        toInt(r.min_age),
        toInt(r.max_age),
        toInt(r.max_income),
        blankToNull(r.social_category),
        blankToNull(r.occupation_keywords),
        blankToNull(r.applicable_states)
      );
      count++;
    }
    return count;
  });

  const inserted = run(records);
  return { total: records.length, inserted };
}

// Allow running standalone: `node scripts/importSchemes.js`
if (process.argv[1] === __filename) {
  const Database = (await import('better-sqlite3')).default;
  const db = new Database(path.join(__dirname, '..', 'suvidha.db'));
  db.exec(`
    CREATE TABLE IF NOT EXISTS schemes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT,
      description TEXT,
      benefit TEXT,
      eligibility TEXT,
      application TEXT,
      documents TEXT,
      level TEXT,
      category TEXT,
      tags TEXT,
      gender TEXT,
      min_age INTEGER,
      max_age INTEGER,
      max_income INTEGER,
      social_category TEXT,
      occupation_keywords TEXT,
      applicable_states TEXT,
      status TEXT DEFAULT 'Active'
    );
  `);
  const { total, inserted } = importSchemesFromCSV(db);
  console.log(`Parsed ${total} rows, inserted ${inserted} schemes.`);
  console.log(`Table now has ${db.prepare('SELECT COUNT(*) AS c FROM schemes').get().c} rows.`);
  db.close();
}
