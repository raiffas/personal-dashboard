import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAY_LABELS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const WEEKDAY_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SWATCHES = ["#c67139", "#7a8a5e", "#6b8ba4", "#c99a3e", "#9b6b8c", "#b8695f"];

type CalendarEvent = {
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

type EventLabel = {
  id: string;
  name: string;
  color: string;
};

type EventFormState = {
  title: string;
  allDay: boolean;
  start: string;
  end: string;
  location: string;
  notes: string;
  labelId: string | null;
};

type CalendarCell = {
  dateStr: string;
  dayNum: number;
  inMonth: boolean;
  isToday: boolean;
  hasJournal: boolean;
  dots: { color: string }[];
};

const SEED_LABELS: EventLabel[] = [
  { id: "l1", name: "Work", color: "#c67139" },
  { id: "l2", name: "Personal", color: "#7a8a5e" },
  { id: "l3", name: "Health", color: "#6b8ba4" },
  { id: "l4", name: "Social", color: "#c99a3e" },
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function dateStr(y: number, m: number, d: number): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
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
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(SWATCHES[0]!);
  const [labels, setLabels] = useState<EventLabel[]>(SEED_LABELS);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [journal, setJournal] = useState<Record<string, string>>({});
  const [journalError, setJournalError] = useState<string | null>(null);
  const [form, setForm] = useState<EventFormState>({
    title: "",
    allDay: false,
    start: "09:00",
    end: "10:00",
    location: "",
    notes: "",
    labelId: SEED_LABELS[0]?.id ?? null,
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
  const monthLabel = `${MONTH_NAMES[month]!.toLowerCase()} ${year}`;
  const labelMap = new Map(labels.map((l) => [l.id, l]));

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
    const dayEvs = events.filter((e) => e.date === ds);
    const seen = new Set<string>();
    const dots: { color: string }[] = [];
    for (const e of dayEvs) {
      const color = labelMap.get(e.labelId ?? "")?.color ?? "#a3a3a3";
      if (!seen.has(color) && dots.length < 5) {
        seen.add(color);
        dots.push({ color });
      }
    }
    cells.push({
      dateStr: ds,
      dayNum,
      inMonth,
      isToday: ds === todayStr,
      hasJournal: !!journal[ds]?.trim(),
      dots,
    });
  }

  type DayEvent = CalendarEvent & {
    color: string;
    timeLabel: string;
    hasLocation: boolean;
    expanded: boolean;
    editing: boolean;
  };

  let dayEvents: DayEvent[] = [];
  let journalText = "";
  let selectedDateLabel = "";
  let selectedWeekday = "";
  if (selectedDate) {
    const [sy, sm, sd] = selectedDate.split("-").map(Number) as [number, number, number];
    const d = new Date(sy, sm - 1, sd);
    selectedWeekday = WEEKDAY_FULL[d.getDay()]!.toLowerCase();
    selectedDateLabel = `${MONTH_NAMES[sm - 1]!.toLowerCase()} ${sd}`;
    journalText = journal[selectedDate] ?? "";
    dayEvents = events
      .filter((e) => e.date === selectedDate)
      .map((e) => ({
        ...e,
        color: labelMap.get(e.labelId ?? "")?.color ?? "#a3a3a3",
        timeLabel: e.allDay ? "all day" : `${fmtTime(e.start)} – ${fmtTime(e.end)}`,
        hasLocation: !!e.location,
        expanded: expandedEventId === e.id,
        editing: editingNotesId === e.id,
      }));
  }
  const labelOptions = labels.map((l) => ({ ...l, selected: form.labelId === l.id }));
  const swatchOptions = SWATCHES.map((c) => ({ color: c, selected: newLabelColor === c }));
  const addDisabled = !form.title.trim();

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
    setForm({
      title: "",
      allDay: false,
      start: "09:00",
      end: "10:00",
      location: "",
      notes: "",
      labelId: labels[0]?.id ?? null,
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
      setEventsError(null);
    } catch {
      setEventsError("Failed to delete event");
    }
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
  function confirmNewLabel() {
    const name = newLabelName.trim();
    if (!name) return;
    const id = "l" + Date.now();
    setLabels((ls) => [...ls, { id, name, color: newLabelColor }]);
    setAddingLabel(false);
    setNewLabelName("");
    setForm((f) => ({ ...f, labelId: id }));
  }

  async function addEvent() {
    if (!form.title.trim() || !selectedDate) return;
    const event: CalendarEvent = {
      id: crypto.randomUUID(),
      date: selectedDate,
      title: form.title.trim(),
      start: form.allDay ? null : form.start,
      end: form.allDay ? null : form.end,
      allDay: form.allDay,
      location: form.location.trim(),
      notes: form.notes.trim(),
      labelId: form.labelId,
    };
    const saved = await saveEvent(event);
    if (!saved) return;
    setEvents((es) => [...es, event]);
    setForm((f) => ({
      title: "",
      allDay: false,
      start: "09:00",
      end: "10:00",
      location: "",
      notes: "",
      labelId: f.labelId,
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
        {cells.map((cell) => (
          <div
            key={cell.dateStr}
            className={`cal-cell${cell.inMonth ? "" : " cal-cell--outside"}${cell.isToday ? " cal-cell--today" : ""}`}
            onClick={cell.inMonth ? () => openDay(cell.dateStr) : undefined}
          >
            <div className="cal-cell-top">
              <span className={`cal-day-num${cell.isToday ? " cal-day-num--today" : ""}`}>{cell.dayNum}</span>
              {cell.hasJournal && <span title="journal entry" className="cal-journal-dot" />}
            </div>
            <div className="cal-cell-dots">
              {cell.dots.map((dot, i) => (
                <span key={i} className="cal-dot" style={{ background: dot.color }} />
              ))}
            </div>
          </div>
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
                    <div className="cal-event-row" onClick={() => toggleEventExpand(ev.id)}>
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
                        <div className="cal-event-details-title">{ev.title}</div>
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

              <div className="cal-checkbox-row">
                <label className="cal-checkbox-label">
                  <input type="checkbox" checked={form.allDay} onChange={onAllDayToggle} />
                  all day
                </label>
              </div>

              {!form.allDay && (
                <div className="cal-time-fields">
                  <div className="cal-field cal-field--flex">
                    <label className="cal-field-label">Start</label>
                    <input type="time" value={form.start} onChange={onFieldChange("start")} className="cal-input" />
                  </div>
                  <div className="cal-field cal-field--flex">
                    <label className="cal-field-label">End</label>
                    <input type="time" value={form.end} onChange={onFieldChange("end")} className="cal-input" />
                  </div>
                </div>
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
