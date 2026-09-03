// Data-access layer for calendar events, backed by SQLite (node:sqlite).
// Every INSERT/SELECT for the "events" table lives here — callers (routes,
// scripts) use the functions below and never touch SQL directly. Mirrors the
// pattern already used by ./gmail.ts for Gmail API access.
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

// Shape used everywhere outside this file — matches the CalendarEvent type
// CalendarPage.tsx already defines, so wiring a route up later is a
// straight passthrough with no field renaming on the frontend side.
export type CalendarEvent = {
  id: string;
  date: string;
  title: string;
  start: string | null;
  end: string | null;
  allDay: boolean;
  location: string;
  notes: string;
  labelId: string | null;
};

// SQLite has no boolean or connection-per-request concept: 0/1 stands in for
// allDay, and we open the file once and reuse the connection for the life of
// the process (reopening per-call would be wasteful and risks file locking).
const DB_PATH = path.join(import.meta.dirname, "..", "..", "data", "calendar.db");
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new DatabaseSync(DB_PATH);

// `end` is a reserved word in SQL (e.g. CASE...END), so columns use
// start_time/end_time and snake_case generally — the mapRow()/toRow() below
// translate to/from the camelCase shape the rest of the app uses.
// label_id has no FOREIGN KEY constraint yet because there's no labels table
// yet either; SEED_LABELS still only exists in CalendarPage.tsx. That's the
// next table to add once this gets wired into real routes.
db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    title TEXT NOT NULL,
    start_time TEXT,
    end_time TEXT,
    all_day INTEGER NOT NULL DEFAULT 0,
    location TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    label_id TEXT
  )
`);

type EventRow = {
  id: string;
  date: string;
  title: string;
  start_time: string | null;
  end_time: string | null;
  all_day: number;
  location: string;
  notes: string;
  label_id: string | null;
};

function mapRow(row: EventRow): CalendarEvent {
  return {
    id: row.id,
    date: row.date,
    title: row.title,
    start: row.start_time,
    end: row.end_time,
    allDay: row.all_day === 1,
    location: row.location,
    notes: row.notes,
    labelId: row.label_id,
  };
}

export function listEvents(): CalendarEvent[] {
  const rows = db.prepare("SELECT * FROM events ORDER BY date, start_time").all() as unknown as EventRow[];
  return rows.map(mapRow);
}

// INSERT OR REPLACE keys off the PRIMARY KEY (id): calling this again with
// the same id overwrites that row instead of erroring, which is what makes
// the seed script safe to re-run.
const upsertStmt = db.prepare(`
  INSERT OR REPLACE INTO events (id, date, title, start_time, end_time, all_day, location, notes, label_id)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

export function upsertEvent(event: CalendarEvent): void {
  upsertStmt.run(
    event.id,
    event.date,
    event.title,
    event.start,
    event.end,
    event.allDay ? 1 : 0,
    event.location,
    event.notes,
    event.labelId,
  );
}

export function deleteEvent(id: string): void {
  db.prepare("DELETE FROM events WHERE id = ?").run(id);
}

// One check-in per day, so `date` is the PRIMARY KEY: re-saving the same
// date (a user revising their check-in later that day) is just another
// INSERT OR REPLACE, same as events — no versioning needed.
db.exec(`
  CREATE TABLE IF NOT EXISTS journal (
    date TEXT PRIMARY KEY,
    text TEXT NOT NULL
  )
`);

type JournalRow = {
  date: string;
  text: string;
};

// Returned as a date -> text map to match the shape CalendarPage.tsx
// already keeps its journal state in.
export function listJournal(): Record<string, string> {
  const rows = db.prepare("SELECT * FROM journal").all() as unknown as JournalRow[];
  const journal: Record<string, string> = {};
  for (const row of rows) journal[row.date] = row.text;
  return journal;
}

const upsertJournalStmt = db.prepare(`
  INSERT OR REPLACE INTO journal (date, text) VALUES (?, ?)
`);

export function upsertJournalEntry(date: string, text: string): void {
  upsertJournalStmt.run(date, text);
}
