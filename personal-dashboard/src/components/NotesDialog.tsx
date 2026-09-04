import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";

export type NoteKind = "notes" | "tech" | "todo";

type NotesDialogProps = {
  isOpen: boolean;
  kind: NoteKind;
  title: string;
  onClose: () => void;
};

// A single ever-growing scratchpad per `kind` (notes / tech notes /
// reminders), not per-open state: every time a kind's dialog opens it
// reloads whatever was last saved for that kind, and every save overwrites
// that kind's row (see notesDb.ts) — no history/versioning. Ctrl+Alt+T (in
// NavBar) rotates `kind` while the dialog stays open, so switching also
// saves the outgoing kind's text before loading the incoming kind's.
function NotesDialog({ isOpen, kind, title, onClose }: NotesDialogProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Mirrors `text` without being a dependency of the load effect below, so
  // that effect can read the latest typed text at switch-time without
  // re-running (and re-fetching) on every keystroke.
  const textRef = useRef(text);
  textRef.current = text;
  // Which kind was last loaded, so a kind change can tell it's a switch
  // (not just the dialog opening) and knows what to save it under.
  const prevKindRef = useRef<NoteKind | null>(null);

  async function saveNotesFor(saveKind: NoteKind, saveText: string) {
    try {
      const res = await fetch(`/api/notes/${saveKind}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: saveText }),
      });
      if (!res.ok) throw new Error();
      setError(null);
    } catch {
      setError("Failed to save notes");
    }
  }

  useEffect(() => {
    if (!isOpen) {
      prevKindRef.current = null;
      return;
    }
    let cancelled = false;

    // Rotating via Ctrl+Alt+T changes `kind` while staying open, so the
    // textarea never blurs — save the outgoing kind's text here instead.
    const outgoingKind = prevKindRef.current;
    if (outgoingKind && outgoingKind !== kind) {
      saveNotesFor(outgoingKind, textRef.current);
    }
    prevKindRef.current = kind;

    fetch(`/api/notes/${kind}`)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, kind]);

  function onChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
  }

  function saveNotes() {
    return saveNotesFor(kind, text);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, kind, text]);

  if (!isOpen) return null;

  return (
    <>
      <div className="cal-overlay" onClick={handleClose} />
      <div className="notes-dialog">
        <div className="notes-dialog-header">
          <h2 className="notes-dialog-title">{title}</h2>
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
