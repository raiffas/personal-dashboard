import { useEffect, useState } from "react";

type Email = {
  id: string;
  sender: string;
  subject: string;
  snippet: string;
  receivedAt: number;
  gmailUrl: string;
};

const CATS = [
  { id: "all", label: "all", dot: "var(--nav-inactive)" },
  { id: "personal", label: "personal", dot: "var(--ink)" },
  { id: "recruiter", label: "recruiters", dot: "var(--headline-fill)" },
  { id: "recurse", label: "recurse center", dot: "var(--text-secondary)" },
  { id: "deals", label: "deals & promos", dot: "var(--arrow-pink)" },
];

function timeAgo(ms: number): string {
  const hours = (Date.now() - ms) / (1000 * 60 * 60);
  if (hours < 1) return "now";
  if (hours < 24) return Math.round(hours) + "h";
  return Math.round(hours / 24) + "d";
}

function initialsFor(sender: string): string {
  return sender
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const InboxPage = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const [unreadError, setUnreadError] = useState<string | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

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

  useEffect(() => {
    let cancelled = false;
    fetch("/api/gmail/messages?maxResults=50")
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setListError(data.error ?? "Failed to load emails");
          return;
        }
        setEmails(data.messages);
      })
      .catch(() => {
        if (!cancelled) setListError("Failed to load emails");
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
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

  const showList = activeTab === "all";

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
        {!showList && (
          <div className="iz-empty-state">
            <span className="iz-empty-text">nothing here yet</span>
          </div>
        )}

        {showList && listLoading && (
          <div className="iz-empty-state">
            <span className="iz-empty-text">loading…</span>
          </div>
        )}

        {showList && !listLoading && listError && (
          <div className="iz-empty-state">
            <span className="iz-empty-text">{listError}</span>
          </div>
        )}

        {showList && !listLoading && !listError && emails.length === 0 && (
          <div className="iz-empty-state">
            <span className="iz-empty-text">nothing here yet</span>
          </div>
        )}

        {showList &&
          !listLoading &&
          !listError &&
          emails.map((em) => (
            <div key={em.id} className="iz-row">
              <div className="iz-avatar" style={{ background: "var(--paper-shadow)", color: "var(--text-primary)" }}>
                {initialsFor(em.sender)}
              </div>

              <div className="iz-email-content">
                <div className="iz-email-top-row">
                  <div className="iz-sender-group">
                    <span className="iz-unread-dot" />
                    <span className="iz-sender-name" style={{ fontWeight: 650 }}>
                      {em.sender}
                    </span>
                  </div>
                  <span className="iz-email-time">{timeAgo(em.receivedAt)}</span>
                </div>
                <div className="iz-subject" style={{ fontWeight: 650 }}>
                  {em.subject}
                </div>
                <div className="iz-snippet">{em.snippet}</div>
              </div>

              <div className="iz-row-actions">
                <a href={em.gmailUrl} target="_blank" rel="noopener" title="Open in Gmail" className="iz-icon-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"></path>
                    <path d="M15 3h6v6"></path>
                    <path d="M10 14L21 3"></path>
                  </svg>
                </a>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default InboxPage;
