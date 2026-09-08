import "dotenv/config";
import express, { type Response } from "express";
import path from "node:path";
import {
  GmailAuthError,
  archiveMessage,
  getUnreadCount,
  listUnreadMessages,
  moveMessageToLabel,
  trashMessage,
} from "./lib/gmail";
import { deleteEvent, listEvents, listJournal, listLabels, upsertEvent, upsertJournalEntry, upsertLabel } from "./lib/calendarDb";
import { getNotesText, upsertNotesText, type NoteKind } from "./lib/notesDb";

const NOTE_KINDS: readonly NoteKind[] = ["notes", "tech", "todo"];
function isNoteKind(value: string): value is NoteKind {
  return (NOTE_KINDS as readonly string[]).includes(value);
}

const MAX_MESSAGES_LIMIT = 100;
const DEFAULT_MESSAGES_LIMIT = 50;
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const isProduction = process.env.NODE_ENV === "production";

async function handleGmailAction(res: Response, action: () => Promise<void>): Promise<void> {
  try {
    await action();
    res.json({ ok: true });
  } catch (err) {
    if (err instanceof GmailAuthError) {
      res.status(401).json({ error: err.message });
      return;
    }
    console.error("Gmail action failed:", err);
    res.status(502).json({ error: "Gmail action failed" });
  }
}

const app = express();
app.use(express.json());

app.get("/api/gmail/unread-count", async (_req, res) => {
  try {
    const count = await getUnreadCount();
    res.json({ count });
  } catch (err) {
    if (err instanceof GmailAuthError) {
      res.status(401).json({ error: err.message });
      return;
    }
    console.error("Failed to fetch Gmail unread count:", err);
    res.status(502).json({ error: "Failed to fetch unread count" });
  }
});

app.get("/api/gmail/messages", async (req, res) => {
  const requested = Number(req.query.maxResults);
  const maxResults =
    Number.isFinite(requested) && requested > 0 ? Math.min(requested, MAX_MESSAGES_LIMIT) : DEFAULT_MESSAGES_LIMIT;
  try {
    const messages = await listUnreadMessages(maxResults);
    res.json({ messages });
  } catch (err) {
    if (err instanceof GmailAuthError) {
      res.status(401).json({ error: err.message });
      return;
    }
    console.error("Failed to fetch Gmail messages:", err);
    res.status(502).json({ error: "Failed to fetch messages" });
  }
});

app.post("/api/gmail/messages/:id/archive", (req, res) => handleGmailAction(res, () => archiveMessage(req.params.id)));

app.post("/api/gmail/messages/:id/trash", (req, res) => handleGmailAction(res, () => trashMessage(req.params.id)));

app.post("/api/gmail/messages/:id/label", (req, res) => {
  const label = req.body?.label;
  if (typeof label !== "string" || !label.trim()) {
    res.status(400).json({ error: "Missing label" });
    return;
  }
  handleGmailAction(res, () => moveMessageToLabel(req.params.id, label));
});

app.get("/api/calendar/events", (_req, res) => {
  try {
    res.json({ events: listEvents() });
  } catch (err) {
    console.error("Failed to list calendar events:", err);
    res.status(500).json({ error: "Failed to load events" });
  }
});

// Upsert: the client always supplies an id (new events get a fresh
// crypto.randomUUID() client-side), so create and edit both land here.
app.put("/api/calendar/events/:id", (req, res) => {
  const { date, endDate, title, start, end, allDay, location, notes, labelId, calendarLabel } = req.body ?? {};
  if (typeof date !== "string" || typeof title !== "string") {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  try {
    upsertEvent({
      id: req.params.id,
      date,
      // Falls back to a single-day event if the client omits endDate or
      // sends one earlier than the start date.
      endDate: typeof endDate === "string" && endDate >= date ? endDate : date,
      title,
      start: typeof start === "string" ? start : null,
      end: typeof end === "string" ? end : null,
      allDay: !!allDay,
      location: typeof location === "string" ? location : "",
      notes: typeof notes === "string" ? notes : "",
      labelId: typeof labelId === "string" ? labelId : null,
      calendarLabel: typeof calendarLabel === "string" ? calendarLabel : "",
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("Failed to save calendar event:", err);
    res.status(500).json({ error: "Failed to save event" });
  }
});

app.delete("/api/calendar/events/:id", (req, res) => {
  try {
    deleteEvent(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error("Failed to delete calendar event:", err);
    res.status(500).json({ error: "Failed to delete event" });
  }
});

app.get("/api/calendar/labels", (_req, res) => {
  try {
    res.json({ labels: listLabels() });
  } catch (err) {
    console.error("Failed to list calendar labels:", err);
    res.status(500).json({ error: "Failed to load labels" });
  }
});

// Upsert, same convention as events: the client supplies the id.
app.put("/api/calendar/labels/:id", (req, res) => {
  const { name, color } = req.body ?? {};
  if (typeof name !== "string" || typeof color !== "string") {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  try {
    upsertLabel({ id: req.params.id, name, color });
    res.json({ ok: true });
  } catch (err) {
    console.error("Failed to save calendar label:", err);
    res.status(500).json({ error: "Failed to save label" });
  }
});

app.get("/api/calendar/journal", (_req, res) => {
  try {
    res.json({ journal: listJournal() });
  } catch (err) {
    console.error("Failed to list journal entries:", err);
    res.status(500).json({ error: "Failed to load journal" });
  }
});

// Upsert: PRIMARY KEY is the date, so re-saving the same date (editing a
// check-in later in the day) just overwrites that one row.
app.put("/api/calendar/journal/:date", (req, res) => {
  const { text } = req.body ?? {};
  if (typeof text !== "string") {
    res.status(400).json({ error: "Missing text" });
    return;
  }
  try {
    upsertJournalEntry(req.params.date, text);
    res.json({ ok: true });
  } catch (err) {
    console.error("Failed to save journal entry:", err);
    res.status(500).json({ error: "Failed to save journal entry" });
  }
});

app.get("/api/notes/:kind", (req, res) => {
  if (!isNoteKind(req.params.kind)) {
    res.status(400).json({ error: "Invalid note kind" });
    return;
  }
  try {
    res.json({ text: getNotesText(req.params.kind) });
  } catch (err) {
    console.error("Failed to load notes:", err);
    res.status(500).json({ error: "Failed to load notes" });
  }
});

// Upsert: single row per kind, so every save just overwrites it — no
// versioning, this is an ever-growing scratchpad per kind, not per-entry history.
app.put("/api/notes/:kind", (req, res) => {
  if (!isNoteKind(req.params.kind)) {
    res.status(400).json({ error: "Invalid note kind" });
    return;
  }
  const { text } = req.body ?? {};
  if (typeof text !== "string") {
    res.status(400).json({ error: "Missing text" });
    return;
  }
  try {
    upsertNotesText(req.params.kind, text);
    res.json({ ok: true });
  } catch (err) {
    console.error("Failed to save notes:", err);
    res.status(500).json({ error: "Failed to save notes" });
  }
});

app.get("/api/hello", (_req, res) => {
  res.json({ message: "Hello, world!", method: "GET" });
});
app.put("/api/hello", (_req, res) => {
  res.json({ message: "Hello, world!", method: "PUT" });
});
app.get("/api/hello/:name", (req, res) => {
  res.json({ message: `Hello, ${req.params.name}!` });
});

// In dev, Vite's own server handles the frontend (and proxies /api here —
// see vite.config.ts), so this process only needs to answer API requests.
// In production there's no separate Vite server, so this process also
// serves the built static assets, with an SPA fallback for client routes.
if (isProduction) {
  const distDir = path.join(import.meta.dirname, "..", "dist");
  app.use(express.static(distDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
