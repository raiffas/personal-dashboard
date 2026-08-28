import { useState } from "react";

function relTime(h: number) {
  if (h < 1) return "now";
  if (h < 24) return Math.round(h) + "h";
  return Math.round(h / 24) + "d";
}

type Email = {
  id: number;
  cat: string;
  sender: string;
  subject: string;
  snippet: string;
  hours: number;
  unread: boolean;
  archived: boolean;
  folder: string | null;
  opened: boolean;
  code?: string;
  expiresHours?: number;
};

const RAW_EMAILS: Omit<Email, "archived" | "folder" | "opened">[] = [
  { id: 1, cat: "personal", sender: "M. Alvarez", subject: "Lorem ipsum dolor sit amet", snippet: "Consectetur adipiscing elit, sed do eiusmod tempor incididunt", hours: 2, unread: true },
  { id: 2, cat: "personal", sender: "R. Chen", subject: "Ut enim ad minim veniam", snippet: "Quis nostrud exercitation ullamco laboris nisi ut aliquip", hours: 5, unread: true },
  { id: 3, cat: "personal", sender: "S. Okafor", subject: "Duis aute irure dolor in", snippet: "Reprehenderit in voluptate velit esse cillum dolore eu fugiat", hours: 20, unread: false },
  { id: 4, cat: "personal", sender: "T. Novak", subject: "Excepteur sint occaecat cupidatat", snippet: "Non proident sunt in culpa qui officia deserunt mollit", hours: 30, unread: false },
  { id: 5, cat: "personal", sender: "J. Park", subject: "Sed ut perspiciatis unde omnis", snippet: "Iste natus error sit voluptatem accusantium doloremque laudantium", hours: 48, unread: true },

  { id: 6, cat: "recruiter", sender: "Recruiter — Company A", subject: "Staff role opportunity", snippet: "Totam rem aperiam eaque ipsa quae ab illo inventore", hours: 3, unread: true },
  { id: 7, cat: "recruiter", sender: "Recruiter — Company B", subject: "Quick chat about an opening?", snippet: "Veritatis et quasi architecto beatae vitae dicta sunt explicabo", hours: 26, unread: true },
  { id: 8, cat: "recruiter", sender: "Recruiter — Company C", subject: "Following up on my note", snippet: "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit", hours: 70, unread: false },
  { id: 9, cat: "recruiter", sender: "Recruiter — Company D", subject: "Design opportunity on our team", snippet: "Aut fugit consequuntur magni dolores eos qui ratione voluptatem", hours: 96, unread: false },

  { id: 10, cat: "recurse", sender: "Recurse Center", subject: "This week's community events", snippet: "Neque porro quisquam est qui dolorem ipsum quia dolor sit", hours: 4, unread: true },
  { id: 11, cat: "recurse", sender: "RC Batch Group", subject: "Cohort check-in tomorrow", snippet: "Ut labore et dolore magnam aliquam quaerat voluptatem ut enim", hours: 14, unread: true },
  { id: 12, cat: "recurse", sender: "Recurse Center", subject: "Alumni project spotlight", snippet: "Ad minima veniam quis nostrum exercitationem ullam corporis suscipit", hours: 60, unread: false },
  { id: 13, cat: "recurse", sender: "RC Pairing Partner", subject: "Pairing session confirmed", snippet: "Laboriosam nisi ut aliquid ex ea commodi consequatur quis", hours: 12, unread: false },

  { id: 14, cat: "deals", sender: "Retailer A", subject: "50% off — ends tonight", snippet: "Autem vel eum iure reprehenderit qui in ea voluptate", hours: 1, unread: true, code: "SAVE50", expiresHours: 6 },
  { id: 15, cat: "deals", sender: "Retailer B", subject: "Flash sale: extra 15% cashback", snippet: "Esse quam nihil molestiae consequatur vel illum qui dolorem", hours: 3, unread: true, code: "FLASH15", expiresHours: 10 },
  { id: 16, cat: "deals", sender: "Service C", subject: "New features this month", snippet: "Eum fugiat quo voluptas nulla pariatur at vero eos", hours: 30, unread: false },
  { id: 17, cat: "deals", sender: "Retailer D", subject: "Member sale starts this weekend", snippet: "Accusamus et iusto odio dignissimos ducimus qui blanditiis", hours: 40, unread: false, code: "EARLY10", expiresHours: 72 },
  { id: 18, cat: "deals", sender: "Service E", subject: "You left something in your cart", snippet: "Praesentium voluptatum deleniti atque corrupti quos dolores et quas", hours: 50, unread: false },
  { id: 19, cat: "deals", sender: "Retailer F", subject: "24 hours left: $50 off", snippet: "Molestias excepturi sint occaecati cupiditate non provident similique", hours: 4, unread: true, code: "TIME50", expiresHours: 20 },
];

const CATS = [
  { id: "all", label: "all", dot: "var(--nav-inactive)" },
  { id: "personal", label: "personal", dot: "var(--ink)" },
  { id: "recruiter", label: "recruiters", dot: "var(--headline-fill)" },
  { id: "recurse", label: "recurse center", dot: "var(--text-secondary)" },
  { id: "deals", label: "deals & promos", dot: "var(--arrow-pink)" },
];

const CAT_PRIORITY: Record<string, number> = { personal: 0, recruiter: 1, recurse: 2, deals: 3 };

const InboxPage = () => {
  const [emails, setEmails] = useState<Email[]>(() =>
    RAW_EMAILS.map((e) => ({ ...e, archived: false, folder: null, opened: false }))
  );
  const [activeTab, setActiveTab] = useState("all");
  const [dealFilter, setDealFilter] = useState("all");
  const [openMenuFor, setOpenMenuFor] = useState<number | null>(null);

  function setTab(id: string) {
    setActiveTab(id);
    setDealFilter("all");
    setOpenMenuFor(null);
  }
  function archive(id: number) {
    setEmails((es) => es.map((e) => (e.id === id ? { ...e, archived: true } : e)));
    setOpenMenuFor(null);
  }
  function deleteEmail(id: number) {
    setEmails((es) => es.filter((e) => e.id !== id));
    setOpenMenuFor(null);
  }
  function toggleRead(id: number) {
    setEmails((es) => es.map((e) => (e.id === id ? { ...e, unread: !e.unread } : e)));
    setOpenMenuFor(null);
  }
  function moveTo(id: number, folder: string) {
    setEmails((es) => es.map((e) => (e.id === id ? { ...e, folder } : e)));
    setOpenMenuFor(null);
  }
  function markOpened(id: number) {
    setEmails((es) => es.map((e) => (e.id === id ? { ...e, opened: true } : e)));
  }
  function toggleMenu(id: number) {
    setOpenMenuFor((m) => (m === id ? null : id));
  }

  const active = emails.filter((e) => !e.archived && e.unread && !e.folder);

  const countFor = (catId: string) => {
    if (catId === "all") return active.length;
    return active.filter((e) => e.cat === catId).length;
  };

  const categories = CATS.map((c) => {
    const isActive = activeTab === c.id;
    return {
      ...c,
      count: countFor(c.id),
      bg: isActive ? "var(--ink)" : "var(--paper)",
      fg: isActive ? "var(--paper)" : "var(--text-primary)",
      border: isActive ? "var(--ink)" : "transparent",
    };
  });

  let list = activeTab === "all" ? active : active.filter((e) => e.cat === activeTab);

  if (activeTab === "deals") {
    if (dealFilter === "expiring") list = list.filter((e) => e.code);
    if (dealFilter === "general") list = list.filter((e) => !e.code);
  }

  list = [...list].sort((a, b) => {
    if (activeTab === "all") {
      const pa = CAT_PRIORITY[a.cat] ?? 9;
      const pb = CAT_PRIORITY[b.cat] ?? 9;
      if (pa !== pb) return pa - pb;
    }
    return a.hours - b.hours;
  });

  const visibleEmails = list.map((e) => {
    const initials = e.sender
      .split(/[\s—]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    const catMeta = CATS.find((c) => c.id === e.cat);
    const expiryLabel = e.code ? "Expires in " + relTime(e.expiresHours ?? 0) : "";
    return {
      id: e.id,
      sender: e.sender,
      subject: e.subject,
      snippet: e.snippet,
      time: relTime(e.hours),
      unread: e.unread,
      nameWeight: e.unread ? 650 : 400,
      rowOpacity: e.opened ? 0.55 : 1,
      initials,
      avatarBg: catMeta ? `color-mix(in oklch, ${catMeta.dot} 22%, var(--paper))` : "var(--paper-shadow)",
      avatarFg: catMeta ? catMeta.dot : "var(--text-primary)",
      dealCode: e.code || null,
      expiryLabel,
      folder: e.folder,
      menuOpen: openMenuFor === e.id,
      readMenuLabel: e.unread ? "Mark as read" : "Mark as unread",
      gmailUrl: "https://mail.google.com/mail/u/0/#search/" + encodeURIComponent(e.subject),
    };
  });

  const isDeals = activeTab === "deals";
  const isEmpty = visibleEmails.length === 0;
  const totalUnread = active.filter((e) => e.unread).length;

  const dealFilterStyle = (val: string) => ({
    borderColor: dealFilter === val ? "var(--ink)" : "var(--paper-shadow)",
    background: dealFilter === val ? "var(--bg)" : "var(--paper)",
  });

  return (
    <div className="iz-page">
      <div className="iz-header">
        <div className="iz-header-title-group">
          <span className="iz-title">clear inbox, clear mind</span>
          <span className="iz-unread-count">{totalUnread} unread</span>
        </div>
      </div>

      <div className="iz-tabs">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setTab(cat.id)}
            className="iz-cat-btn"
            style={{ borderColor: cat.border, background: cat.bg, color: cat.fg }}
          >
            <span className="iz-dot" style={{ background: cat.dot }} />
            {cat.label}
            {cat.count > 0 && <span className="iz-cat-count">{cat.count}</span>}
          </button>
        ))}
      </div>

      {isDeals && (
        <div className="iz-deal-filters">
          <button onClick={() => setDealFilter("all")} className="iz-filter-btn" style={dealFilterStyle("all")}>
            all
          </button>
          <button onClick={() => setDealFilter("expiring")} className="iz-filter-btn" style={dealFilterStyle("expiring")}>
            expiring soon
          </button>
          <button onClick={() => setDealFilter("general")} className="iz-filter-btn" style={dealFilterStyle("general")}>
            general promo
          </button>
        </div>
      )}

      <div className="iz-email-list">
        {visibleEmails.map((em) => (
          <div key={em.id} className="iz-row" style={{ opacity: em.rowOpacity }}>
            <div className="iz-avatar" style={{ background: em.avatarBg, color: em.avatarFg }}>
              {em.initials}
            </div>

            <div className="iz-email-content">
              <div className="iz-email-top-row">
                <div className="iz-sender-group">
                  {em.unread && <span className="iz-unread-dot" />}
                  <span className="iz-sender-name" style={{ fontWeight: em.nameWeight }}>
                    {em.sender}
                  </span>
                  {em.folder && <span className="iz-folder-badge">{em.folder}</span>}
                </div>
                <span className="iz-email-time">{em.time}</span>
              </div>
              <div className="iz-subject" style={{ fontWeight: em.nameWeight }}>
                {em.subject}
              </div>
              <div className="iz-snippet">{em.snippet}</div>

              {em.dealCode && (
                <div className="iz-deal-row">
                  <span className="iz-deal-code">{em.dealCode}</span>
                  <span className="iz-expiry-label">{em.expiryLabel}</span>
                </div>
              )}
            </div>

            <div className="iz-row-actions">
              <button onClick={() => archive(em.id)} title="Archive" className="iz-icon-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="4" width="18" height="4" rx="1.5"></rect>
                  <path d="M5 8h14v11a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 015 19V8z"></path>
                  <path d="M10 12.5h4"></path>
                </svg>
              </button>
              <button onClick={() => deleteEmail(em.id)} title="Delete" className="iz-icon-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M4 7h16"></path>
                  <path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2"></path>
                  <path d="M6 7l1 13a1 1 0 001 1h8a1 1 0 001-1l1-13"></path>
                </svg>
              </button>
              <a
                href={em.gmailUrl}
                target="_blank"
                rel="noopener"
                onClick={() => markOpened(em.id)}
                title="Open in Gmail"
                className="iz-icon-btn"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"></path>
                  <path d="M15 3h6v6"></path>
                  <path d="M10 14L21 3"></path>
                </svg>
              </a>
              <button onClick={() => toggleMenu(em.id)} title="More actions" className="iz-icon-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none"></circle>
                  <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"></circle>
                  <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none"></circle>
                </svg>
              </button>
            </div>

            {em.menuOpen && (
              <div className="iz-dropdown-menu">
                <button onClick={() => toggleRead(em.id)} className="iz-menu-item">
                  {em.readMenuLabel}
                </button>
                <div className="iz-menu-divider" />
                <button onClick={() => moveTo(em.id, "Action Required")} className="iz-menu-item">
                  Move to Action Required
                </button>
                <button onClick={() => moveTo(em.id, "Work")} className="iz-menu-item">
                  Move to Work
                </button>
                <button onClick={() => moveTo(em.id, "Travel")} className="iz-menu-item">
                  Move to Travel
                </button>
                <button onClick={() => moveTo(em.id, "Follow-up")} className="iz-menu-item">
                  Move to Follow-up
                </button>
                <div className="iz-menu-divider" />
                <button onClick={() => deleteEmail(em.id)} className="iz-menu-item">
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}

        {isEmpty && (
          <div className="iz-empty-state">
            <span className="iz-empty-text">nothing here yet</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default InboxPage;
