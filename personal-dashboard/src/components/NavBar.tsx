import { useEffect, useState } from "react";
import { Link } from "wouter";
import NotesDialog from "./NotesDialog";
import type { NoteKind } from "./NotesDialog";

type NavBarProps = {
  mode: "day" | "night";
  queueDebugMode: boolean;
  onToggleQueueDebug: () => void;
};

// The three scratchpads Ctrl+Alt+T cycles through, in rotation order.
const NOTE_DIALOGS: { kind: NoteKind; title: string }[] = [
  { kind: "notes", title: "notes" },
  { kind: "tech", title: "tech notes" },
  { kind: "todo", title: "reminders / todo" },
];

function NavBar({ mode, queueDebugMode, onToggleQueueDebug }: NavBarProps) {
  // null = no scratchpad dialog open; otherwise an index into NOTE_DIALOGS
  // for the one currently shown.
  const [activeNoteIndex, setActiveNoteIndex] = useState<number | null>(null);

  // Ctrl+Alt+T opens the notes scratchpad from anywhere in the app, and on
  // repeated presses rotates through notes -> tech notes -> reminders/todo
  // -> back to notes while staying open; Esc (handled inside NotesDialog)
  // closes the whole dialog. NavBar is mounted once above the router in
  // App.tsx, so this listener is effectively global regardless of page.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.altKey && (e.key === "t" || e.key === "T")) {
        e.preventDefault();
        setActiveNoteIndex((prev) => (prev === null ? 0 : (prev + 1) % NOTE_DIALOGS.length));
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const activeNote = activeNoteIndex !== null ? NOTE_DIALOGS[activeNoteIndex] : null;

  return (
    <>
      <nav className="nav-bar">
        {/* Mode is set automatically by time of day; this is a status icon, not a control. */}
        <div className="nav-logo" id="modeToggle" title="Day/night mode (automatic)">
          <span id="modeIcon">{mode === "day" ? "☀️" : "🌙"}</span>
        </div>
        <Link to="/" className="nav-links">
          <button className="nav-link active">Home</button>
        </Link>
        <Link to="/inbox" className="nav-links">
          <button className="nav-link">Inbox</button>
        </Link>
        <Link to="/calendar" className="nav-links">
          <button className="nav-link" data-page="/calendar">
            Calendar
          </button>
        </Link>
        <button
          className={queueDebugMode ? "nav-link active" : "nav-link"}
          title="Toggle visible inbox action queueing (debug)"
          onClick={onToggleQueueDebug}
        >
          Queue debug: {queueDebugMode ? "on" : "off"}
        </button>
      </nav>
      <NotesDialog
        isOpen={activeNote !== null}
        kind={activeNote?.kind ?? "notes"}
        title={activeNote?.title ?? "notes"}
        onClose={() => setActiveNoteIndex(null)}
      />
    </>
  );
}

export default NavBar;
