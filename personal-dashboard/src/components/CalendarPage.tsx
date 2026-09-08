import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAY_LABELS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const WEEKDAY_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SWATCHES = ["#f2e900", "#ff4fa3", "#00c2ff", "#3ee649", "#ff8a1f"];
// Calendar-label text has to fit on a single-line stripe, so it's capped
// much shorter than the free-text event title.
const CALENDAR_LABEL_MAX = 14;
// A cell only has room for a few stacked stripes before they'd overflow
// its fixed height; extras collapse into a trailing "+N" indicator.
const MAX_VISIBLE_STRIPES = 3;

type CalendarEvent = {
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

type EventLabel = {
  id: string;
  name: string;
  color: string;
};

type EventFormState = {
  title: string;
  allDay: boolean;
  startDate: string;
  endDate: string;
  start: string;
  end: string;
  location: string;
  notes: string;
  labelId: string | null;
  calendarLabel: string;
};

// One event reduced to just what a month-grid stripe needs to render.
type CellStripe = {
  id: string;
  color: string;
  label: string;
};

type CalendarCell = {
  dateStr: string;
  dayNum: number;
  inMonth: boolean;
  isToday: boolean;
  hasJournal: boolean;
  // Set when an all-day event owns the cell's whole background; the day
  // number and stripes render on top of it.
  fill: { color: string; label: string } | null;
  // Set when a multiday event's range covers this date: just a lighter
  // tint behind everything else in the cell. The bottom bar itself is
  // built separately (see MultidayBarSegment below) so it can span
  // multiple cells as one continuous piece instead of stopping at each
  // cell's edge.
  multidayBar: { id: string; color: string; isEventStart: boolean; isEventEnd: boolean } | null;
  // Top-aligned, start-time-ordered stripes for everything else that day
  // (timed events, plus any all-day/multiday events past the first).
  stripes: CellStripe[];
  overflowCount: number;
};

// One contiguous run of same-event cells within a single grid row — the
// unit the bottom multiday bar actually renders as, via explicit CSS Grid
// placement, so it reads as one unbroken stripe instead of a separate
// rounded chip per day.
type MultidayBarSegment = {
  key: string;
  row: number;
  colStart: number;
  colEnd: number;
  color: string;
  label: string;
  roundLeft: boolean;
  roundRight: boolean;
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function dateStr(y: number, m: number, d: number): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

// Picks black or white text for readability on top of an arbitrary hex
// fill color, via the standard relative-luminance threshold.
function getContrastText(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#2b2b2b" : "#ffffff";
}

function fmtShortDate(ds: string): string {
  const [y, m, d] = ds.split("-").map(Number) as [number, number, number];
  return `${MONTH_NAMES[m - 1]!.toUpperCase()} ${d}`;
}

function fmtTime(t: string | null): string {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ap = (h ?? 0) >= 12 ? "pm" : "am";
  const h12 = (h ?? 0) % 12 === 0 ? 12 : (h ?? 0) % 12;
  return `${h12}:${pad(m ?? 0)}${ap}`;
}

// Escapes HTML first, then applies a small fixed set of markdown-lite
// substitutions — safe for dangerouslySetInnerHTML because only text that
// survived escaping can end up inside the substituted tags.
function mdToHtml(src: string): string {
  if (!src) return "";
  let esc = src.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  esc = esc
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  const lines = esc.split("\n");
  let html = "";
  let inList = false;
  for (const line of lines) {
    const m = line.match(/^\s*[-*]\s+(.*)/);
    if (m) {
      if (!inList) {
        html += '<ul style="margin:4px 0 4px 18px;padding:0;">';
        inList = true;
      }
      html += `<li>${m[1]}</li>`;
    } else {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += line.trim() ? `<div>${line}</div>` : '<div style="height:6px;"></div>';
    }
  }
  if (inList) html += "</ul>";
  return html;
}

const CalendarPage = () => {
  const today = new Date();
  const todayStr = dateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [addingLabel, setAddingLabel] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [journalEditing, setJournalEditing] = useState(false);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  // Full-details edit mode, entered via double-click on an event row —
  // separate from editingNotesId's inline notes-only quick edit.
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EventFormState | null>(null);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(SWATCHES[0]!);
  const [labels, setLabels] = useState<EventLabel[]>([]);
  const [labelsError, setLabelsError] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [journal, setJournal] = useState<Record<string, string>>({});
  const [journalError, setJournalError] = useState<string | null>(null);
  const [form, setForm] = useState<EventFormState>({
    title: "",
    allDay: false,
    // No day is selected yet at mount time — openDay() re-defaults these
    // to whichever day's panel is opened.
    startDate: todayStr,
    endDate: todayStr,
    start: "09:00",
    end: "10:00",
    location: "",
    notes: "",
    // Labels haven't loaded yet at mount time — openDay() re-picks a
    // default from the loaded `labels` state every time the panel opens.
    labelId: null,
    calendarLabel: "",
  });

  // Load events from the SQLite-backed API once on mount; the calendar
  // renders empty until this resolves rather than showing stale seed data.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/calendar/events")
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setEventsError(data.error ?? "Failed to load events");
          return;
        }
        setEvents(data.events);
      })
      .catch(() => {
        if (!cancelled) setEventsError("Failed to load events");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Same pattern for event labels — a SQLite-backed table now, instead of
  // the SEED_LABELS constant this used to hold client-side.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/calendar/labels")
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setLabelsError(data.error ?? "Failed to load labels");
          return;
        }
        setLabels(data.labels);
      })
      .catch(() => {
        if (!cancelled) setLabelsError("Failed to load labels");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Same pattern for daily check-ins, from the separate journal table.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/calendar/journal")
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setJournalError(data.error ?? "Failed to load journal");
          return;
        }
        setJournal(data.journal);
      })
      .catch(() => {
        if (!cancelled) setJournalError("Failed to load journal");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const { year, month } = view;
  const monthLabel = `${MONTH_NAMES[month]!.toUpperCase()} ${year}`;
  const labelMap = new Map(labels.map((l) => [l.id, l]));
  // Looked up once here (rather than per cell) since the multiday bar's
  // label is attached to a whole grid-row segment, built in a separate
  // pass after the per-cell loop below.
  const calendarLabelById = new Map(
    events.map((e) => [e.id, e.calendarLabel || e.title.slice(0, CALENDAR_LABEL_MAX)]),
  );

  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: CalendarCell[] = [];
  const TOTAL_CELLS = 42;
  for (let i = 0; i < TOTAL_CELLS; i++) {
    let cellYear = year;
    let cellMonth = month;
    let dayNum: number;
    let inMonth: boolean;
    const idx = i - startOffset;
    if (idx < 0) {
      dayNum = daysInPrevMonth + idx + 1;
      cellMonth = month - 1;
      if (cellMonth < 0) {
        cellMonth = 11;
        cellYear = year - 1;
      }
      inMonth = false;
    } else if (idx >= daysInMonth) {
      dayNum = idx - daysInMonth + 1;
      cellMonth = month + 1;
      if (cellMonth > 11) {
        cellMonth = 0;
        cellYear = year + 1;
      }
      inMonth = false;
    } else {
      dayNum = idx + 1;
      inMonth = true;
    }
    const ds = dateStr(cellYear, cellMonth, dayNum);
    // A multiday event's range needs to match every date it covers, not
    // just its start date, so this is an inclusive-range check rather than
    // equality. events is date-then-start_time ordered from the API, and
    // SQLite sorts NULL start_time first, so allDay events naturally
    // precede timed ones here with no extra sort needed.
    const dayEvs = events.filter((e) => e.date <= ds && ds <= e.endDate);
    const multidayEvs = dayEvs.filter((e) => e.endDate !== e.date);
    const singleDayEvs = dayEvs.filter((e) => e.endDate === e.date);
    const allDayEvs = singleDayEvs.filter((e) => e.allDay);
    const timedEvs = singleDayEvs
      .filter((e) => !e.allDay)
      .sort((a, b) => (a.start ?? "").localeCompare(b.start ?? ""));

    const toStripe = (e: CalendarEvent): CellStripe => ({
      id: e.id,
      color: labelMap.get(e.labelId ?? "")?.color ?? "#a3a3a3",
      label: e.calendarLabel || e.title.slice(0, CALENDAR_LABEL_MAX),
    });

    // The first all-day event owns the cell's full background; any other
    // all-day events that day fall back to rendering as ordinary stripes.
    const fillEvent = allDayEvs[0];
    const fill = fillEvent
      ? { color: labelMap.get(fillEvent.labelId ?? "")?.color ?? "#a3a3a3", label: toStripe(fillEvent).label }
      : null;

    // Likewise, the first multiday event covering this date owns the
    // bottom bar (the segment pass below joins these into one continuous
    // bar per row).
    const barEvent = multidayEvs[0];
    const multidayBar = barEvent
      ? {
          id: barEvent.id,
          color: labelMap.get(barEvent.labelId ?? "")?.color ?? "#a3a3a3",
          isEventStart: barEvent.date === ds,
          isEventEnd: barEvent.endDate === ds,
        }
      : null;

    const allStripes = [...allDayEvs.slice(1), ...multidayEvs.slice(1), ...timedEvs].map(toStripe);
    const stripes = allStripes.slice(0, MAX_VISIBLE_STRIPES);
    const overflowCount = allStripes.length - stripes.length;

    cells.push({
      dateStr: ds,
      dayNum,
      inMonth,
      isToday: ds === todayStr,
      hasJournal: !!journal[ds]?.trim(),
      fill,
      multidayBar,
      stripes,
      overflowCount,
    });
  }

  // Group each row's run of same-event cells into one CSS Grid item, so
  // the multiday bar renders as a single unbroken stripe across the row
  // (grid-column spanning naturally covers the gap between cells) instead
  // of a separate rounded chip per day.
  const multidayBarSegments: MultidayBarSegment[] = [];
  for (let row = 0; row < TOTAL_CELLS / 7; row++) {
    const rowStart = row * 7;
    for (let col = 0; col < 7; ) {
      const bar = cells[rowStart + col]!.multidayBar;
      if (!bar) {
        col++;
        continue;
      }
      let endCol = col;
      while (endCol + 1 < 7 && cells[rowStart + endCol + 1]!.multidayBar?.id === bar.id) endCol++;
      multidayBarSegments.push({
        key: `${bar.id}-${row}`,
        row,
        colStart: col,
        colEnd: endCol,
        color: bar.color,
        label: cells[rowStart + col]!.multidayBar!.isEventStart ? (calendarLabelById.get(bar.id) ?? "") : "",
        roundLeft: cells[rowStart + col]!.multidayBar!.isEventStart,
        roundRight: cells[rowStart + endCol]!.multidayBar!.isEventEnd,
      });
      col = endCol + 1;
    }
  }

  type DayEvent = CalendarEvent & {
    color: string;
    timeLabel: string;
    hasLocation: boolean;
    expanded: boolean;
    editing: boolean;
    editingEvent: boolean;
  };

  let dayEvents: DayEvent[] = [];
  let journalText = "";
  let selectedDateLabel = "";
  let selectedWeekday = "";
  if (selectedDate) {
    const [sy, sm, sd] = selectedDate.split("-").map(Number) as [number, number, number];
    const d = new Date(sy, sm - 1, sd);
    selectedWeekday = WEEKDAY_FULL[d.getDay()]!.toLowerCase();
    selectedDateLabel = `${MONTH_NAMES[sm - 1]!.toUpperCase()} ${sd}`;
    journalText = journal[selectedDate] ?? "";
    dayEvents = events
      .filter((e) => e.date <= selectedDate && selectedDate <= e.endDate)
      .map((e) => ({
        ...e,
        color: labelMap.get(e.labelId ?? "")?.color ?? "#a3a3a3",
        timeLabel:
          e.date !== e.endDate
            ? `${fmtShortDate(e.date)} – ${fmtShortDate(e.endDate)}`
            : e.allDay
              ? "all day"
              : `${fmtTime(e.start)} – ${fmtTime(e.end)}`,
        hasLocation: !!e.location,
        expanded: expandedEventId === e.id,
        editing: editingNotesId === e.id,
        editingEvent: editingEventId === e.id,
      }));
  }
  const labelOptions = labels.map((l) => ({ ...l, selected: form.labelId === l.id }));
  const swatchOptions = SWATCHES.map((c) => ({ color: c, selected: newLabelColor === c }));
  const addDisabled = !form.title.trim();
  const isMultidayForm = form.startDate !== form.endDate;

  function prevMonth() {
    setView(({ year: y, month: m }) => (m === 0 ? { year: y - 1, month: 11 } : { year: y, month: m - 1 }));
  }
  function nextMonth() {
    setView(({ year: y, month: m }) => (m === 11 ? { year: y + 1, month: 0 } : { year: y, month: m + 1 }));
  }
  function goToday() {
    const t = new Date();
    setView({ year: t.getFullYear(), month: t.getMonth() });
  }

  function openDay(ds: string) {
    setSelectedDate(ds);
    setPanelOpen(true);
    setAddingLabel(false);
    setNewLabelName("");
    setJournalEditing(false);
    setEditingNotesId(null);
    setExpandedEventId(null);
    setEditingEventId(null);
    setEditForm(null);
    setForm({
      title: "",
      allDay: false,
      startDate: ds,
      endDate: ds,
      start: "09:00",
      end: "10:00",
      location: "",
      notes: "",
      labelId: labels[0]?.id ?? null,
      calendarLabel: "",
    });
  }
  function closePanel() {
    setPanelOpen(false);
  }

  function onJournalChange(e: ChangeEvent<HTMLTextAreaElement>) {
    const v = e.target.value;
    setJournal((j) => (selectedDate ? { ...j, [selectedDate]: v } : j));
  }
  function startJournalEditing() {
    setJournalEditing(true);
  }
  async function stopJournalEditing() {
    setJournalEditing(false);
    if (!selectedDate) return;
    const text = journal[selectedDate] ?? "";
    try {
      const res = await fetch(`/api/calendar/journal/${selectedDate}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error();
      setJournalError(null);
    } catch {
      setJournalError("Failed to save check-in");
    }
  }

  function onFieldChange(key: keyof EventFormState) {
    return (e: ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setForm((f) => ({ ...f, [key]: v }));
    };
  }
  function onAllDayToggle(e: ChangeEvent<HTMLInputElement>) {
    const checked = e.target.checked;
    setForm((f) => ({ ...f, allDay: checked }));
  }
  // Keeps endDate from ever landing before startDate: moving the start
  // past the current end drags the end along with it.
  function onStartDateChange(e: ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setForm((f) => ({ ...f, startDate: v, endDate: f.endDate < v ? v : f.endDate }));
  }
  function onEndDateChange(e: ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setForm((f) => ({ ...f, endDate: v < f.startDate ? f.startDate : v }));
  }

  function toggleEventExpand(id: string) {
    const collapsing = expandedEventId === id;
    setExpandedEventId(collapsing ? null : id);
    if (!collapsing) setEditingNotesId(null);
  }
  // Upserts one event to the SQLite-backed API; shared by addEvent (new
  // events) and stopNotesEditing (persisting an in-place notes edit).
  async function saveEvent(event: CalendarEvent): Promise<boolean> {
    try {
      const res = await fetch(`/api/calendar/events/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });
      if (!res.ok) throw new Error();
      setEventsError(null);
      return true;
    } catch {
      setEventsError("Failed to save event");
      return false;
    }
  }
  function updateEventNotes(id: string, notes: string) {
    setEvents((es) => es.map((e) => (e.id === id ? { ...e, notes } : e)));
  }
  function startNotesEditing(id: string) {
    setEditingNotesId(id);
  }
  function stopNotesEditing(event: CalendarEvent) {
    setEditingNotesId(null);
    saveEvent(event);
  }
  async function deleteEvent(id: string) {
    try {
      const res = await fetch(`/api/calendar/events/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setEvents((es) => es.filter((e) => e.id !== id));
      if (editingEventId === id) {
        setEditingEventId(null);
        setEditForm(null);
      }
      setEventsError(null);
    } catch {
      setEventsError("Failed to delete event");
    }
  }

  // Converts a stored event back into form-shaped fields so the edit form
  // can start pre-filled with its current values.
  function eventToFormState(ev: CalendarEvent): EventFormState {
    return {
      title: ev.title,
      allDay: ev.allDay,
      startDate: ev.date,
      endDate: ev.endDate,
      start: ev.start ?? "09:00",
      end: ev.end ?? "10:00",
      location: ev.location,
      notes: ev.notes,
      labelId: ev.labelId,
      calendarLabel: ev.calendarLabel,
    };
  }
  function startEventEdit(ev: CalendarEvent) {
    setExpandedEventId(ev.id);
    setEditingNotesId(null);
    setEditingEventId(ev.id);
    setEditForm(eventToFormState(ev));
  }
  function cancelEventEdit() {
    setEditingEventId(null);
    setEditForm(null);
  }
  function onEditFieldChange(key: keyof EventFormState) {
    return (e: ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setEditForm((f) => (f ? { ...f, [key]: v } : f));
    };
  }
  function onEditAllDayToggle(e: ChangeEvent<HTMLInputElement>) {
    const checked = e.target.checked;
    setEditForm((f) => (f ? { ...f, allDay: checked } : f));
  }
  function onEditStartDateChange(e: ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setEditForm((f) => (f ? { ...f, startDate: v, endDate: f.endDate < v ? v : f.endDate } : f));
  }
  function onEditEndDateChange(e: ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setEditForm((f) => (f ? { ...f, endDate: v < f.startDate ? f.startDate : v } : f));
  }
  function selectEditLabel(id: string) {
    setEditForm((f) => (f ? { ...f, labelId: id } : f));
  }
  async function saveEventEdit(id: string) {
    if (!editForm || !editForm.title.trim()) return;
    const title = editForm.title.trim();
    const isMultiday = editForm.startDate !== editForm.endDate;
    const updated: CalendarEvent = {
      id,
      date: editForm.startDate,
      endDate: editForm.endDate,
      title,
      start: isMultiday || editForm.allDay ? null : editForm.start,
      end: isMultiday || editForm.allDay ? null : editForm.end,
      allDay: isMultiday || editForm.allDay,
      location: editForm.location.trim(),
      notes: editForm.notes.trim(),
      labelId: editForm.labelId,
      calendarLabel: editForm.calendarLabel.trim() || title.slice(0, CALENDAR_LABEL_MAX),
    };
    const saved = await saveEvent(updated);
    if (!saved) return;
    setEvents((es) => es.map((e) => (e.id === id ? updated : e)));
    setEditingEventId(null);
    setEditForm(null);
  }

  function selectLabel(id: string) {
    setForm((f) => ({ ...f, labelId: id }));
  }
  function toggleAddingLabel() {
    setAddingLabel((v) => !v);
    setNewLabelName("");
    setNewLabelColor(SWATCHES[0]!);
  }
  function onNewLabelNameChange(e: ChangeEvent<HTMLInputElement>) {
    setNewLabelName(e.target.value);
  }
  function selectSwatch(color: string) {
    setNewLabelColor(color);
  }
  // Upsert, same convention as saveEvent: the client supplies the id.
  async function saveLabel(label: EventLabel): Promise<boolean> {
    try {
      const res = await fetch(`/api/calendar/labels/${label.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(label),
      });
      if (!res.ok) throw new Error();
      setLabelsError(null);
      return true;
    } catch {
      setLabelsError("Failed to save label");
      return false;
    }
  }
  async function confirmNewLabel() {
    const name = newLabelName.trim();
    if (!name) return;
    const label: EventLabel = { id: crypto.randomUUID(), name, color: newLabelColor };
    const saved = await saveLabel(label);
    if (!saved) return;
    setLabels((ls) => [...ls, label]);
    setAddingLabel(false);
    setNewLabelName("");
    setForm((f) => ({ ...f, labelId: label.id }));
  }

  async function addEvent() {
    if (!form.title.trim() || !selectedDate) return;
    const title = form.title.trim();
    // A multiday event doesn't carry a per-day clock time — it renders as
    // a bar across every date in its range, not a timed stripe — so it's
    // always stored as all-day regardless of the form's own toggle.
    const isMultiday = form.startDate !== form.endDate;
    const event: CalendarEvent = {
      id: crypto.randomUUID(),
      date: form.startDate,
      endDate: form.endDate,
      title,
      start: isMultiday || form.allDay ? null : form.start,
      end: isMultiday || form.allDay ? null : form.end,
      allDay: isMultiday || form.allDay,
      location: form.location.trim(),
      notes: form.notes.trim(),
      labelId: form.labelId,
      // Falls back to the (already-capped-length) title so every event has
      // stripe text even if the user skips the dedicated field.
      calendarLabel: form.calendarLabel.trim() || title.slice(0, CALENDAR_LABEL_MAX),
    };
    const saved = await saveEvent(event);
    if (!saved) return;
    setEvents((es) => [...es, event]);
    setForm((f) => ({
      title: "",
      allDay: false,
      startDate: selectedDate,
      endDate: selectedDate,
      start: "09:00",
      end: "10:00",
      location: "",
      notes: "",
      labelId: f.labelId,
      calendarLabel: "",
    }));
  }

  return (
    <div className="cal-page">
      <div className="cal-header">
        <h1 className="cal-title">{monthLabel}</h1>
        <div className="cal-nav">
          <button className="cal-nav-btn" onClick={prevMonth} aria-label="Previous month">
            ‹
          </button>
          <button className="cal-today-btn" onClick={goToday}>
            today
          </button>
          <button className="cal-nav-btn" onClick={nextMonth} aria-label="Next month">
            ›
          </button>
        </div>
      </div>

      <div className="cal-weekday-row">
        {WEEKDAY_LABELS.map((wd) => (
          <div key={wd} className="cal-weekday">
            {wd}
          </div>
        ))}
      </div>

      <div className="cal-grid">
        {cells.map((cell, i) => {
          const fillTextColor = cell.fill ? getContrastText(cell.fill.color) : undefined;
          return (
            <div
              key={cell.dateStr}
              className={`cal-cell${cell.inMonth ? "" : " cal-cell--outside"}${cell.isToday ? " cal-cell--today" : ""}${cell.fill ? " cal-cell--filled" : ""}`}
              // Explicit grid placement (matching auto-flow's own row-major
              // order) so the multidayBarSegments below — which use
              // explicit placement to span multiple cells — can overlap
              // these on purpose. Mixing auto-placed and explicit-placed
              // grid items would otherwise make auto-placement dodge
              // around whatever cells the segments already claimed.
              style={{
                gridColumn: (i % 7) + 1,
                gridRow: Math.floor(i / 7) + 1,
                ...(cell.fill ? { background: cell.fill.color } : null),
              }}
              onClick={cell.inMonth ? () => openDay(cell.dateStr) : undefined}
            >
              {/* A single-day all-day event (cell.fill) always wins the cell's
                  own background, since it's the more visually prominent
                  (fully solid) treatment — the multiday tint only shows up
                  when there's no fill event competing for the same cell. */}
              {cell.multidayBar && !cell.fill && (
                <span
                  className="cal-cell-multiday-tint"
                  style={{ background: `color-mix(in srgb, ${cell.multidayBar.color} 35%, var(--paper))` }}
                />
              )}
              <div className="cal-cell-top">
                <span
                  className={`cal-day-num${cell.isToday ? " cal-day-num--today" : ""}`}
                  style={fillTextColor ? { color: fillTextColor } : undefined}
                >
                  {cell.dayNum}
                </span>
                {cell.hasJournal && <span title="journal entry" className="cal-journal-dot" />}
              </div>
              <div className="cal-cell-stripes">
                {cell.stripes.map((stripe) => (
                  <span
                    key={stripe.id}
                    className="cal-stripe"
                    style={{ borderLeftColor: stripe.color, background: `color-mix(in srgb, ${stripe.color} 25%, white)` }}
                  >
                    {/* Label lives in its own span so small screens can hide just
                        the text (media query) and keep the stripe as a color bar. */}
                    <span className="cal-stripe-label">{stripe.label}</span>
                  </span>
                ))}
                {cell.overflowCount > 0 && (
                  <span className="cal-stripe cal-stripe--overflow">
                    <span className="cal-stripe-label">+{cell.overflowCount} more</span>
                  </span>
                )}
              </div>
              {cell.fill && (
                <span className="cal-cell-fill-label" style={{ color: fillTextColor }}>
                  {cell.fill.label}
                </span>
              )}
            </div>
          );
        })}
        {multidayBarSegments.map((seg) => (
          <span
            key={seg.key}
            className="cal-multiday-bar-segment"
            style={{
              gridRow: seg.row + 1,
              gridColumn: `${seg.colStart + 1} / ${seg.colEnd + 2}`,
              background: seg.color,
              color: getContrastText(seg.color),
              borderTopLeftRadius: seg.roundLeft ? "var(--radius-sm)" : 0,
              borderBottomLeftRadius: seg.roundLeft ? "var(--radius-sm)" : 0,
              borderTopRightRadius: seg.roundRight ? "var(--radius-sm)" : 0,
              borderBottomRightRadius: seg.roundRight ? "var(--radius-sm)" : 0,
            }}
          >
            {/* Own span so small screens can hide just the text (media query)
                and keep the segment as a plain color bar. */}
            <span className="cal-multiday-label">{seg.label}</span>
          </span>
        ))}
      </div>

      {panelOpen && (
        <>
          <div className="cal-overlay" onClick={closePanel} />
          <div className="cal-panel">
            <div className="cal-panel-header">
              <div>
                <div className="cal-panel-weekday">{selectedWeekday}</div>
                <h2 className="cal-panel-date">{selectedDateLabel}</h2>
              </div>
              <button className="cal-close-btn" onClick={closePanel} aria-label="close">
                ×
              </button>
            </div>

            <div className="cal-journal-card">
              <div className="cal-journal-label">daily checkin</div>
              {journalError && (
                <div className="cal-empty-state" style={{ color: "var(--arrow-pink)" }}>
                  {journalError}
                </div>
              )}
              {journalEditing ? (
                <textarea
                  autoFocus
                  value={journalText}
                  onChange={onJournalChange}
                  onBlur={stopJournalEditing}
                  placeholder="jot ur thoughts"
                  className="cal-journal-textarea"
                />
              ) : (
                <div
                  onClick={startJournalEditing}
                  className="cal-journal-preview"
                  style={{ color: journalText.trim() ? "var(--text-primary)" : "var(--text-secondary)" }}
                  dangerouslySetInnerHTML={{
                    __html: journalText.trim() ? mdToHtml(journalText) : "jot ur thoughts",
                  }}
                />
              )}
            </div>

            <div>
              <div className="cal-section-label">events</div>
              {eventsError && (
                <div className="cal-empty-state" style={{ color: "var(--arrow-pink)" }}>
                  {eventsError}
                </div>
              )}
              {dayEvents.length === 0 && <div className="cal-empty-state">nothing here yet</div>}
              <div className="cal-event-list">
                {dayEvents.map((ev) => (
                  <div key={ev.id} className="cal-event">
                    <div
                      className="cal-event-row"
                      onClick={() => toggleEventExpand(ev.id)}
                      onDoubleClick={() => startEventEdit(ev)}
                    >
                      <span className="cal-dot" style={{ background: ev.color }} />
                      <div className="cal-event-summary">
                        <span className="cal-event-title">{ev.title}</span>
                        <span className="cal-event-time">{ev.timeLabel}</span>
                        {ev.hasLocation && <span className="cal-event-location">· {ev.location}</span>}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteEvent(ev.id);
                        }}
                        aria-label="delete event"
                        className="cal-event-delete"
                      >
                        ×
                      </button>
                    </div>
                    {ev.expanded && (
                      <div className="cal-event-details">
                        {ev.editingEvent && editForm ? (
                          <div className="cal-event-edit-form" onClick={(e) => e.stopPropagation()}>
                            <div className="cal-field">
                              <label className="cal-field-label">Title</label>
                              <input
                                type="text"
                                value={editForm.title}
                                onChange={onEditFieldChange("title")}
                                className="cal-input"
                              />
                            </div>
                            <div className="cal-field">
                              <label className="cal-field-label">
                                Calendar label{" "}
                                <span className="cal-field-hint">
                                  {editForm.calendarLabel.length}/{CALENDAR_LABEL_MAX}
                                </span>
                              </label>
                              <input
                                type="text"
                                value={editForm.calendarLabel}
                                onChange={onEditFieldChange("calendarLabel")}
                                maxLength={CALENDAR_LABEL_MAX}
                                className="cal-input"
                              />
                            </div>
                            <div className="cal-time-fields">
                              <div className="cal-field cal-field--flex">
                                <label className="cal-field-label">Start date</label>
                                <input
                                  type="date"
                                  value={editForm.startDate}
                                  onChange={onEditStartDateChange}
                                  className="cal-input"
                                />
                              </div>
                              <div className="cal-field cal-field--flex">
                                <label className="cal-field-label">End date</label>
                                <input
                                  type="date"
                                  value={editForm.endDate}
                                  onChange={onEditEndDateChange}
                                  className="cal-input"
                                />
                              </div>
                            </div>
                            {editForm.startDate === editForm.endDate && (
                              <>
                                <div className="cal-checkbox-row">
                                  <label className="cal-checkbox-label">
                                    <input type="checkbox" checked={editForm.allDay} onChange={onEditAllDayToggle} />
                                    all day
                                  </label>
                                </div>
                                {!editForm.allDay && (
                                  <div className="cal-time-fields">
                                    <div className="cal-field cal-field--flex">
                                      <label className="cal-field-label">Start time</label>
                                      <input
                                        type="time"
                                        value={editForm.start}
                                        onChange={onEditFieldChange("start")}
                                        className="cal-input"
                                      />
                                    </div>
                                    <div className="cal-field cal-field--flex">
                                      <label className="cal-field-label">End time</label>
                                      <input
                                        type="time"
                                        value={editForm.end}
                                        onChange={onEditFieldChange("end")}
                                        className="cal-input"
                                      />
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                            <div className="cal-field">
                              <label className="cal-field-label">Location</label>
                              <input
                                type="text"
                                value={editForm.location}
                                onChange={onEditFieldChange("location")}
                                className="cal-input"
                              />
                            </div>
                            <div>
                              <label className="cal-field-label cal-field-label--block">Label</label>
                              <div className="cal-label-picker">
                                {labels.map((lbl) => (
                                  <button
                                    key={lbl.id}
                                    onClick={() => selectEditLabel(lbl.id)}
                                    className={`cal-label-btn${editForm.labelId === lbl.id ? " cal-label-btn--selected" : ""}`}
                                  >
                                    <span className="cal-dot" style={{ background: lbl.color }} />
                                    {lbl.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="cal-event-edit-actions">
                              <button
                                className="cal-add-event-btn"
                                onClick={() => saveEventEdit(ev.id)}
                                disabled={!editForm.title.trim()}
                              >
                                save
                              </button>
                              <button className="cal-cancel-btn" onClick={cancelEventEdit}>
                                cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="cal-event-details-header">
                              <div className="cal-event-details-title">{ev.title}</div>
                              {/* Editing was double-click-only, which has no touch
                                  equivalent — this button makes it tap-reachable too. */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEventEdit(ev);
                                }}
                                aria-label="edit event"
                                className="cal-event-edit-btn"
                              >
                                ✎
                              </button>
                            </div>
                            <div className="cal-event-details-time">{ev.timeLabel}</div>
                            {ev.hasLocation && <div className="cal-event-details-location">{ev.location}</div>}
                            {ev.editing ? (
                              <textarea
                                autoFocus
                                value={ev.notes}
                                onChange={(e) => updateEventNotes(ev.id, e.target.value)}
                                onBlur={() => stopNotesEditing(ev)}
                                placeholder="jot a note for this event…"
                                className="cal-event-notes-textarea"
                              />
                            ) : (
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startNotesEditing(ev.id);
                                }}
                                className="cal-event-notes-preview"
                                style={{ color: ev.notes.trim() ? "var(--text-primary)" : "var(--text-secondary)" }}
                                dangerouslySetInnerHTML={{
                                  __html: ev.notes.trim() ? mdToHtml(ev.notes) : "jot a note for this event…",
                                }}
                              />
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="cal-add-event">
              <div className="cal-section-label">add event</div>

              <div className="cal-field">
                <label className="cal-field-label">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={onFieldChange("title")}
                  placeholder="Event title"
                  className="cal-input"
                />
              </div>

              <div className="cal-field">
                <label className="cal-field-label">
                  Calendar label <span className="cal-field-hint">{form.calendarLabel.length}/{CALENDAR_LABEL_MAX}</span>
                </label>
                <input
                  type="text"
                  value={form.calendarLabel}
                  onChange={onFieldChange("calendarLabel")}
                  maxLength={CALENDAR_LABEL_MAX}
                  placeholder={form.title.slice(0, CALENDAR_LABEL_MAX) || "Shown on the calendar stripe"}
                  className="cal-input"
                />
              </div>

              <div className="cal-time-fields">
                <div className="cal-field cal-field--flex">
                  <label className="cal-field-label">Start date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={onStartDateChange}
                    className="cal-input"
                  />
                </div>
                <div className="cal-field cal-field--flex">
                  <label className="cal-field-label">End date</label>
                  <input type="date" value={form.endDate} onChange={onEndDateChange} className="cal-input" />
                </div>
              </div>

              {!isMultidayForm && (
                <>
                  <div className="cal-checkbox-row">
                    <label className="cal-checkbox-label">
                      <input type="checkbox" checked={form.allDay} onChange={onAllDayToggle} />
                      all day
                    </label>
                  </div>

                  {!form.allDay && (
                    <div className="cal-time-fields">
                      <div className="cal-field cal-field--flex">
                        <label className="cal-field-label">Start time</label>
                        <input
                          type="time"
                          value={form.start}
                          onChange={onFieldChange("start")}
                          className="cal-input"
                        />
                      </div>
                      <div className="cal-field cal-field--flex">
                        <label className="cal-field-label">End time</label>
                        <input type="time" value={form.end} onChange={onFieldChange("end")} className="cal-input" />
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="cal-field">
                <label className="cal-field-label">Location</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={onFieldChange("location")}
                  placeholder="Optional"
                  className="cal-input"
                />
              </div>

              <div className="cal-field">
                <label className="cal-field-label">Notes</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={onFieldChange("notes")}
                  placeholder="Optional"
                  className="cal-input"
                />
              </div>

              <div>
                <label className="cal-field-label cal-field-label--block">Label</label>
                {labelsError && (
                  <div className="cal-empty-state" style={{ color: "var(--arrow-pink)" }}>
                    {labelsError}
                  </div>
                )}
                <div className="cal-label-picker">
                  {labelOptions.map((lbl) => (
                    <button
                      key={lbl.id}
                      onClick={() => selectLabel(lbl.id)}
                      className={`cal-label-btn${lbl.selected ? " cal-label-btn--selected" : ""}`}
                    >
                      <span className="cal-dot" style={{ background: lbl.color }} />
                      {lbl.name}
                    </button>
                  ))}
                  <button onClick={toggleAddingLabel} className="cal-new-label-btn">
                    + new label
                  </button>
                </div>

                {addingLabel && (
                  <div className="cal-new-label-form">
                    <input
                      type="text"
                      value={newLabelName}
                      onChange={onNewLabelNameChange}
                      placeholder="Label name"
                      className="cal-input"
                    />
                    <div className="cal-swatch-picker">
                      {swatchOptions.map((sw) => (
                        <button
                          key={sw.color}
                          onClick={() => selectSwatch(sw.color)}
                          className={`cal-swatch${sw.selected ? " cal-swatch--selected" : ""}`}
                          style={{ background: sw.color }}
                          aria-label="choose color"
                        />
                      ))}
                    </div>
                    <button className="cal-save-label-btn" onClick={confirmNewLabel}>
                      save label
                    </button>
                  </div>
                )}
              </div>

              <button className="cal-add-event-btn" onClick={addEvent} disabled={addDisabled}>
                add event
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CalendarPage;
