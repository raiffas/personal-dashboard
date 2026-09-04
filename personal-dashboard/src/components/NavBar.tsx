import { useEffect, useState } from "react";
import { Link } from "wouter";
import NotesDialog from "./NotesDialog";

type NavBarProps = {
  mode: "day" | "night";
  queueDebugMode: boolean;
  onToggleQueueDebug: () => void;
};

function NavBar({ mode, queueDebugMode, onToggleQueueDebug }: NavBarProps) {
  const [notesOpen, setNotesOpen] = useState(false);

  // Ctrl+Alt+T opens the notes scratchpad from anywhere in the app — NavBar
  // is mounted once above the router in App.tsx, so this listener is
  // effectively global regardless of which page is showing.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.altKey && (e.key === "t" || e.key === "T")) {
        e.preventDefault();
        setNotesOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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
      <NotesDialog isOpen={notesOpen} onClose={() => setNotesOpen(false)} />
    </>
  );
}

export default NavBar;
