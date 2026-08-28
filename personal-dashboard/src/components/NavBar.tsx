import { Link } from "wouter";

type NavBarProps = {
  mode: "day" | "night";
  onToggleMode: () => void;
};

function NavBar({ mode, onToggleMode }: NavBarProps) {
  return (
    <nav className="nav-bar">
      <button
        className="nav-logo"
        id="modeToggle"
        title="Toggle day/night mode"
        onClick={onToggleMode}
      >
        <span id="modeIcon">{mode === "day" ? "☀️" : "🌙"}</span>
      </button>
      <Link to="/" className="nav-links">
        <button className="nav-link active">Home ({mode})</button>
      </Link>
      <Link to="/inbox" className="nav-links">
        <button className="nav-link">Inbox</button>
      </Link>
      <Link to="/calendar" className="nav-links">
        <button className="nav-link" data-page="/calendar">
          Calendar
        </button>
      </Link>
    </nav>
  );
}

export default NavBar;
