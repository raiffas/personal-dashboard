import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";

type NotesDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

// A single ever-growing scratchpad, not per-open state: every time the
// dialog opens it reloads whatever was last saved, and every save
// overwrites that same row (see notesDb.ts) — no history/versioning.
function NotesDialog({ isOpen, onClose }: NotesDialogProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    fetch("/api/notes")
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? "Failed to load notes");
          return;
        }
        setText(data.text);
        setError(null);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load notes");
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  function onChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
  }

  async function saveNotes() {
    try {
      const res = await fetch("/api/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error();
      setError(null);
    } catch {
      setError("Failed to save notes");
    }
  }

  // Saves again on close (backdrop click, ×, or Esc) as a harmless
  // idempotent fallback for closes that don't pass through a natural
  // textarea blur.
  function handleClose() {
    saveNotes();
    onClose();
  }

  // Esc closes the dialog from anywhere, including while the textarea has focus.
  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className="cal-overlay" onClick={handleClose} />
      <div className="notes-dialog">
        <div className="notes-dialog-header">
          <h2 className="notes-dialog-title">notes</h2>
          <button className="cal-close-btn" onClick={handleClose} aria-label="close">
            ×
          </button>
        </div>
        {error && <div className="notes-dialog-error">{error}</div>}
        <textarea
          autoFocus
          value={text}
          onChange={onChange}
          onBlur={saveNotes}
          placeholder="jot it down…"
          className="notes-dialog-textarea"
        />
      </div>
    </>
  );
}

export default NotesDialog;
