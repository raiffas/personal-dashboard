import { useEffect, useRef, useState } from "react";

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

async function extractError(res: Response): Promise<string> {
  const data = await res.json().catch(() => ({}));
  return data.error ?? "Action failed";
}

const ACTIONS = {
  archive: {
    request: (email: Email) => fetch(`/api/gmail/messages/${email.id}/archive`, { method: "POST" }),
  },
  trash: {
    request: (email: Email) => fetch(`/api/gmail/messages/${email.id}/trash`, { method: "POST" }),
  },
  label: {
    request: (email: Email) =>
      fetch(`/api/gmail/messages/${email.id}/label`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: "Action Required" }),
      }),
  },
} as const;

type ActionKind = keyof typeof ACTIONS;

const ACTION_LABELS: Record<ActionKind, string> = {
  archive: "Archive",
  label: "Action Required",
  trash: "Delete",
};

const DEBOUNCE_MS = 1200;

const InboxPage = () => {
  const [activeTab, setActiveTab] = useState("all");
  // Toggles whether inbox actions (archive/trash/label) apply optimistically
  // or wait on the real request — a dev aid, now owned locally by this page
  // instead of being wired through NavBar.
  const [debugQueueMode, setDebugQueueMode] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const [unreadError, setUnreadError] = useState<string | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [queuedIds, setQueuedIds] = useState<Record<string, ActionKind>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);
  const pendingQueueRef = useRef<Map<string, { kind: ActionKind; email: Email; optimistic: boolean }>>(new Map());
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFlushingRef = useRef(false);

  function refreshUnreadCount() {
    fetch("/api/gmail/unread-count")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setUnreadError(data.error ?? "Failed to load unread count");
          return;
        }
        setUnreadError(null);
        setUnreadCount(data.count);
      })
      .catch(() => setUnreadError("Failed to load unread count"));
  }

  useEffect(() => {
    refreshUnreadCount();
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

  useEffect(() => {
    return () => {
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    };
  }, []);

  async function flush() {
    if (isFlushingRef.current) return;
    isFlushingRef.current = true;
    try {
      while (pendingQueueRef.current.size > 0) {
        const [id, { kind, email, optimistic }] = pendingQueueRef.current.entries().next().value!;
        pendingQueueRef.current.delete(id);
        setSendingId(id);
        setActionError(null);
        try {
          const res = await ACTIONS[kind].request(email);
          if (!res.ok) throw new Error(await extractError(res));
          if (!optimistic) setEmails((es) => es.filter((e) => e.id !== email.id));
          refreshUnreadCount();
        } catch (err) {
          if (optimistic) {
            setEmails((es) => [...es, email].sort((a, b) => b.receivedAt - a.receivedAt));
          }
          setActionError(err instanceof Error ? err.message : "Action failed");
        } finally {
          setQueuedIds((q) => {
            const next = { ...q };
            delete next[id];
            return next;
          });
          setSendingId(null);
        }
      }
    } finally {
      isFlushingRef.current = false;
    }
  }

  function runAction(kind: ActionKind, email: Email) {
    const optimistic = !debugQueueMode;
    pendingQueueRef.current.set(email.id, { kind, email, optimistic });

    if (optimistic) {
      // Old-style UX: remove immediately, but still send through the serialized
      // queue in the background so overlapping Gmail requests can't race.
      setEmails((es) => es.filter((e) => e.id !== email.id));
      flush();
      return;
    }

    setQueuedIds((q) => ({ ...q, [email.id]: kind }));
    if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    flushTimerRef.current = setTimeout(flush, DEBOUNCE_MS);
  }

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
          {actionError && (
            <span className="iz-unread-count" style={{ color: "var(--arrow-pink)" }}>
              {actionError}
            </span>
          )}
        </div>
        <button
          className={debugQueueMode ? "nav-link active" : "nav-link"}
          title="Toggle visible inbox action queueing (debug)"
          onClick={() => setDebugQueueMode((v) => !v)}
        >
          Queue debug: {debugQueueMode ? "on" : "off"}
        </button>
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
          emails.map((em) => {
            const isSending = sendingId === em.id;
            const queuedKind = queuedIds[em.id];
            return (
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
                  {isSending && <span className="iz-pending-badge">sending…</span>}
                  {!isSending && queuedKind && (
                    <span className="iz-pending-badge">queued: {ACTION_LABELS[queuedKind]}</span>
                  )}
                  <button
                    onClick={() => runAction("archive", em)}
                    title="Archive"
                    className="iz-icon-btn"
                    disabled={isSending}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="3" y="4" width="18" height="4" rx="1.5"></rect>
                      <path d="M5 8h14v11a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 015 19V8z"></path>
                      <path d="M10 12.5h4"></path>
                    </svg>
                  </button>
                  <button
                    onClick={() => runAction("label", em)}
                    title="Move to Action Required"
                    className="iz-icon-btn"
                    disabled={isSending}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M3 7a1 1 0 011-1h5l2 2h9a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V7z"></path>
                    </svg>
                  </button>
                  <button
                    onClick={() => runAction("trash", em)}
                    title="Delete"
                    className="iz-icon-btn"
                    disabled={isSending}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M4 7h16"></path>
                      <path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2"></path>
                      <path d="M6 7l1 13a1 1 0 001 1h8a1 1 0 001-1l1-13"></path>
                    </svg>
                  </button>
                  <a href={em.gmailUrl} target="_blank" rel="noopener" title="Open in Gmail" className="iz-icon-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"></path>
                      <path d="M15 3h6v6"></path>
                      <path d="M10 14L21 3"></path>
                    </svg>
                  </a>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default InboxPage;
