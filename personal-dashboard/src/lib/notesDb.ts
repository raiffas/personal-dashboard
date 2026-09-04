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

// One scratchpad per NoteKind (notes / tech / todo), keyed by `kind`. No
// history/versioning — every save overwrites that kind's row via
// INSERT OR REPLACE, same pattern as the calendar journal, just keyed by
// kind instead of date.
export type NoteKind = "notes" | "tech" | "todo";
const NOTE_KINDS: readonly NoteKind[] = ["notes", "tech", "todo"];

db.exec(`
  CREATE TABLE IF NOT EXISTS notes_by_kind (
    kind TEXT PRIMARY KEY,
    text TEXT NOT NULL DEFAULT ''
  )
`);

// One-time migration from the old single-scratchpad schema (a `notes` table
// with a single row pinned to id=1) into notes_by_kind under kind='notes',
// so upgrading doesn't wipe out whatever was already jotted down.
const oldTable = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='notes'`).get();
if (oldTable) {
  const oldRow = db.prepare("SELECT text FROM notes WHERE id = 1").get() as { text: string } | undefined;
  if (oldRow) {
    db.prepare(`INSERT OR IGNORE INTO notes_by_kind (kind, text) VALUES ('notes', ?)`).run(oldRow.text);
  }
  db.exec(`DROP TABLE notes`);
}

type NotesRow = {
  kind: NoteKind;
  text: string;
};

function assertValidKind(kind: string): asserts kind is NoteKind {
  if (!NOTE_KINDS.includes(kind as NoteKind)) {
    throw new Error(`Invalid note kind: ${kind}`);
  }
}

// Returns "" until the first save for this kind ever happens (no row
// exists yet), so callers never have to handle null.
export function getNotesText(kind: NoteKind): string {
  assertValidKind(kind);
  const row = db.prepare("SELECT * FROM notes_by_kind WHERE kind = ?").get(kind) as unknown as
    | NotesRow
    | undefined;
  return row?.text ?? "";
}

const upsertStmt = db.prepare(`
  INSERT OR REPLACE INTO notes_by_kind (kind, text) VALUES (?, ?)
`);

export function upsertNotesText(kind: NoteKind, text: string): void {
  assertValidKind(kind);
  upsertStmt.run(kind, text);
}
