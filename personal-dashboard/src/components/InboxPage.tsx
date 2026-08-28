import { useEffect, useState } from "react";

const CATS = [
  { id: "all", label: "all", dot: "var(--nav-inactive)" },
  { id: "personal", label: "personal", dot: "var(--ink)" },
  { id: "recruiter", label: "recruiters", dot: "var(--headline-fill)" },
  { id: "recurse", label: "recurse center", dot: "var(--text-secondary)" },
  { id: "deals", label: "deals & promos", dot: "var(--arrow-pink)" },
];

const InboxPage = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const [unreadError, setUnreadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/gmail/unread-count")
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setUnreadError(data.error ?? "Failed to load unread count");
          return;
        }
        setUnreadCount(data.count);
      })
      .catch(() => {
        if (!cancelled) setUnreadError("Failed to load unread count");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const unreadLabel = unreadError ? unreadError : unreadCount === null ? "loading…" : `${unreadCount} unread`;

  const categories = CATS.map((c) => {
    const isActive = activeTab === c.id;
    return {
      ...c,
      count: c.id === "all" ? unreadCount : null,
      bg: isActive ? "var(--ink)" : "var(--paper)",
      fg: isActive ? "var(--paper)" : "var(--text-primary)",
      border: isActive ? "var(--ink)" : "transparent",
    };
  });

  return (
    <div className="iz-page">
      <div className="iz-header">
        <div className="iz-header-title-group">
          <span className="iz-title">clear inbox, clear mind</span>
          <span className="iz-unread-count">{unreadLabel}</span>
        </div>
      </div>

      <div className="iz-tabs">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className="iz-cat-btn"
            style={{ borderColor: cat.border, background: cat.bg, color: cat.fg }}
          >
            <span className="iz-dot" style={{ background: cat.dot }} />
            {cat.label}
            {!!cat.count && cat.count > 0 && <span className="iz-cat-count">{cat.count}</span>}
          </button>
        ))}
      </div>

      <div className="iz-email-list">
        <div className="iz-empty-state">
          <span className="iz-empty-text">nothing here yet</span>
        </div>
      </div>
    </div>
  );
};

export default InboxPage;
