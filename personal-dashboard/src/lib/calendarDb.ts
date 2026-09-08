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
  // Equal to `date` for a single-day event; a later date makes this a
  // multiday event spanning [date, endDate] inclusive.
  endDate: string;
  title: string;
  start: string | null;
  end: string | null;
  allDay: boolean;
  location: string;
  notes: string;
  labelId: string | null;
  calendarLabel: string;
};

// Matches the EventLabel type CalendarPage.tsx defines.
export type EventLabel = {
  id: string;
  name: string;
  color: string;
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
// label_id still has no FOREIGN KEY constraint — SQLite requires
// PRAGMA foreign_keys to be turned on per-connection for it to be enforced,
// and nothing here depends on that enforcement, so it's left off.
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

// `CREATE TABLE IF NOT EXISTS` above only shapes a brand-new events table —
// it won't retrofit new columns onto a calendar.db from before they
// existed, so add any missing ones by hand.
const eventColumns = new Set(
  (db.prepare("PRAGMA table_info(events)").all() as unknown as { name: string }[]).map((col) => col.name),
);
if (!eventColumns.has("calendar_label")) {
  db.exec("ALTER TABLE events ADD COLUMN calendar_label TEXT NOT NULL DEFAULT ''");
}
if (!eventColumns.has("end_date")) {
  db.exec("ALTER TABLE events ADD COLUMN end_date TEXT NOT NULL DEFAULT ''");
  // Backfill: every event that existed before multiday support was a
  // single day, so its end_date is just its own date.
  db.exec("UPDATE events SET end_date = date WHERE end_date = ''");
}

type EventRow = {
  id: string;
  date: string;
  end_date: string;
  title: string;
  start_time: string | null;
  end_time: string | null;
  all_day: number;
  location: string;
  notes: string;
  label_id: string | null;
  calendar_label: string;
};

function mapRow(row: EventRow): CalendarEvent {
  return {
    id: row.id,
    date: row.date,
    endDate: row.end_date,
    title: row.title,
    start: row.start_time,
    end: row.end_time,
    allDay: row.all_day === 1,
    location: row.location,
    notes: row.notes,
    labelId: row.label_id,
    calendarLabel: row.calendar_label,
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
  INSERT OR REPLACE INTO events (id, date, end_date, title, start_time, end_time, all_day, location, notes, label_id, calendar_label)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

export function upsertEvent(event: CalendarEvent): void {
  upsertStmt.run(
    event.id,
    event.date,
    event.endDate,
    event.title,
    event.start,
    event.end,
    event.allDay ? 1 : 0,
    event.location,
    event.notes,
    event.labelId,
    event.calendarLabel,
  );
}

export function deleteEvent(id: string): void {
  db.prepare("DELETE FROM events WHERE id = ?").run(id);
}

db.exec(`
  CREATE TABLE IF NOT EXISTS labels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL
  )
`);

export function listLabels(): EventLabel[] {
  return db.prepare("SELECT * FROM labels ORDER BY rowid").all() as unknown as EventLabel[];
}

const upsertLabelStmt = db.prepare(`
  INSERT OR REPLACE INTO labels (id, name, color) VALUES (?, ?, ?)
`);

export function upsertLabel(label: EventLabel): void {
  upsertLabelStmt.run(label.id, label.name, label.color);
}

// A brand-new calendar.db ships with an empty labels table, which would
// leave the label picker blank on first run — seed a starter set once,
// the same names the old client-side SEED_LABELS used, now on the SWATCHES
// palette so they're consistent with the "+ new label" color picker.
const labelCount = (db.prepare("SELECT COUNT(*) AS count FROM labels").get() as { count: number }).count;
if (labelCount === 0) {
  const STARTER_LABELS: EventLabel[] = [
    { id: "l1", name: "Work", color: "#f2e900" },
    { id: "l2", name: "Personal", color: "#ff4fa3" },
    { id: "l3", name: "Health", color: "#00c2ff" },
    { id: "l4", name: "Social", color: "#3ee649" },
  ];
  for (const label of STARTER_LABELS) upsertLabel(label);
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
