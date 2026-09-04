import { Link } from "wouter";

type NavBarProps = {
  mode: "day" | "night";
  queueDebugMode: boolean;
  onToggleQueueDebug: () => void;
};

function NavBar({ mode, queueDebugMode, onToggleQueueDebug }: NavBarProps) {
  return (
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
  );
}

export default NavBar;
