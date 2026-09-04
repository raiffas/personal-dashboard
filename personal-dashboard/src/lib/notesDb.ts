// Data-access layer for the global notes scratchpad, backed by SQLite
// (node:sqlite). Kept in its own file/DB rather than folded into
// calendarDb.ts because this isn't calendar data — mirrors the
// one-file-per-domain split already used by gmail.ts and calendarDb.ts.
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const DB_PATH = path.join(import.meta.dirname, "..", "..", "data", "notes.db");
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new DatabaseSync(DB_PATH);

// Single-row table: id is pinned to 1 by the CHECK constraint, so there can
// never be more than one note. No history/versioning — every save
// overwrites this one row via INSERT OR REPLACE, same pattern as the
// calendar journal, just without a date key.
db.exec(`
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    text TEXT NOT NULL DEFAULT ''
  )
`);

type NotesRow = {
  id: number;
  text: string;
};

// Returns "" until the first save ever happens (no row exists yet), so
// callers never have to handle null.
export function getNotesText(): string {
  const row = db.prepare("SELECT * FROM notes WHERE id = 1").get() as unknown as NotesRow | undefined;
  return row?.text ?? "";
}

const upsertStmt = db.prepare(`
  INSERT OR REPLACE INTO notes (id, text) VALUES (1, ?)
`);

export function upsertNotesText(text: string): void {
  upsertStmt.run(text);
}
