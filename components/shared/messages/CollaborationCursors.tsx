"use client";

import { useEffect, useRef } from "react";
import type { MutableRefObject } from "react";
import { CollaborationUser } from "@/lib/collaboration";
import type * as Monaco from "monaco-editor";

interface CollaborationCursorsProps {
  users: CollaborationUser[];
  currentUserId?: string;
  pillsVisible?: boolean;
  editorRef: MutableRefObject<{
    editor: Monaco.editor.IStandaloneCodeEditor;
    monaco: typeof Monaco;
  } | null>;
}

export default function CollaborationCursors({
  users,
  currentUserId,
  pillsVisible = true,
  editorRef,
}: CollaborationCursorsProps) {
  const decoCollections = useRef<Map<string, Monaco.editor.IEditorDecorationsCollection>>(new Map());
  // Container mounted directly on <body> so it escapes Monaco's stacking context
  const bodyContainerRef = useRef<HTMLDivElement | null>(null);
  const pillNodes = useRef<Map<string, HTMLElement>>(new Map());
  const listenersRef = useRef<Array<{ dispose(): void }>>([]);

  // ── Create the body-level container once ──────────────────────────────────
  useEffect(() => {
    const container = document.createElement("div");
    container.id = "cz-pill-root";
    container.style.cssText = [
      "position:fixed",
      "top:0", "left:0",
      "width:0", "height:0",          // zero-size — children use their own fixed coords
      "pointer-events:none",
      "z-index:2147483647",            // max possible z-index
      "overflow:visible",
    ].join(";");
    document.body.appendChild(container);
    bodyContainerRef.current = container;

    return () => {
      container.remove();
      bodyContainerRef.current = null;
    };
  }, []);

  // ── Sync decorations + pills + positions ──────────────────────────────────
  useEffect(() => {
    if (!editorRef?.current || !bodyContainerRef.current) return;
    const { editor, monaco } = editorRef.current;
    const container = bodyContainerRef.current;

    const others = users.filter(u => u.isActive && u.id !== currentUserId && u.cursor);
    const alive = new Set(others.map(u => u.id));

    // Remove stale pills + decorations
    pillNodes.current.forEach((node, uid) => {
      if (!alive.has(uid)) { node.remove(); pillNodes.current.delete(uid); }
    });
    decoCollections.current.forEach((col, uid) => {
      if (!alive.has(uid)) { col.clear(); decoCollections.current.delete(uid); }
    });

    // Create / update each user's pill + cursor decoration
    others.forEach(user => {
      if (!user.cursor) return;
      const line = Math.max(1, user.cursor.line);
      const col  = Math.max(1, user.cursor.column);

      // Cursor bar decoration (the blinking vertical line inside Monaco)
      const decos: Monaco.editor.IModelDeltaDecoration[] = [{
        range: new monaco.Range(line, col, line, col),
        options: {
          className: `cz-bar cz-bar-${user.id}`,
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          zIndex: 20,
        },
      }];

      // Selection decoration
      const sel = user.selection;
      if (sel && !(sel.start.line === sel.end.line && sel.start.column === sel.end.column)) {
        decos.push({
          range: new monaco.Range(
            Math.max(1, sel.start.line), Math.max(1, sel.start.column),
            Math.max(1, sel.end.line),   Math.max(1, sel.end.column),
          ),
          options: {
            className: `cz-sel-${user.id}`,
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          },
        });
      }

      let dc = decoCollections.current.get(user.id);
      if (!dc) { dc = editor.createDecorationsCollection([]); decoCollections.current.set(user.id, dc); }
      dc.set(decos);

      // Pill node
      let pill = pillNodes.current.get(user.id);
      if (!pill) {
        pill = makePill(user);
        container.appendChild(pill);
        pillNodes.current.set(user.id, pill);
      } else {
        syncPill(pill, user);
      }
    });

    // Show / hide all pills globally
    container.style.display = pillsVisible ? "block" : "none";

    // Position updater — uses fixed viewport coords (editor rect + Monaco offset)
    const positionPills = () => {
      const editorDom = editor.getDomNode();
      if (!editorDom) return;
      const editorRect = editorDom.getBoundingClientRect();

      others.forEach(user => {
        if (!user.cursor) return;
        const pill = pillNodes.current.get(user.id);
        if (!pill) return;

        const monacoPos = editor.getScrolledVisiblePosition({
          lineNumber: Math.max(1, user.cursor.line),
          column:     Math.max(1, user.cursor.column),
        });

        if (!monacoPos) {
          pill.style.visibility = "hidden";
          return;
        }

        // Convert editor-relative coords → fixed viewport coords
        const screenLeft = editorRect.left + monacoPos.left;
        const screenTop  = editorRect.top  + monacoPos.top;

        pill.style.visibility = "visible";
        pill.style.left = `${screenLeft}px`;
        // translateY(-100% - gap) pushes pill above the cursor line
        pill.style.top  = `${screenTop}px`;
      });
    };

    positionPills();

    // Re-position on scroll / layout / window resize
    listenersRef.current.forEach(l => l.dispose());
    const onResize = () => positionPills();
    window.addEventListener("resize", onResize);
    listenersRef.current = [
      editor.onDidScrollChange(positionPills),
      editor.onDidLayoutChange(positionPills),
      { dispose: () => window.removeEventListener("resize", onResize) },
    ];

    injectStyles(others);

    return () => {
      listenersRef.current.forEach(l => l.dispose());
      listenersRef.current = [];
    };
  }, [users, currentUserId, pillsVisible, editorRef]);

  // ── Full unmount cleanup ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      listenersRef.current.forEach(l => l.dispose());
      decoCollections.current.forEach(c => c.clear());
      decoCollections.current.clear();
      pillNodes.current.clear();
    };
  }, []);

  return null;
}

// ── DOM helpers ───────────────────────────────────────────────────────────────

function makePill(user: CollaborationUser): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "cz-pill";
  wrap.style.setProperty("--cz-color", user.color);

  wrap.appendChild(makeAvatar(user));

  const name = document.createElement("span");
  name.className = "cz-pill-name";
  name.textContent = user.name;
  wrap.appendChild(name);

  return wrap;
}

function makeAvatar(user: CollaborationUser): HTMLElement {
  if (user.image) {
    const img = document.createElement("img");
    img.src   = user.image;
    img.alt   = "";
    img.className = "cz-pill-avatar";
    img.onerror   = () => img.replaceWith(makeInitial(user));
    return img;
  }
  return makeInitial(user);
}

function makeInitial(user: CollaborationUser): HTMLElement {
  const s = document.createElement("span");
  s.className   = "cz-pill-avatar cz-pill-initial";
  s.textContent = user.name.charAt(0).toUpperCase();
  return s;
}

function syncPill(node: HTMLElement, user: CollaborationUser) {
  node.style.setProperty("--cz-color", user.color);

  const nameEl = node.querySelector<HTMLElement>(".cz-pill-name");
  if (nameEl && nameEl.textContent !== user.name) nameEl.textContent = user.name;

  const av = node.querySelector<HTMLElement>(".cz-pill-avatar");
  if (!av) return;
  const isImg = av.tagName === "IMG";
  if      (user.image && !isImg)  { av.replaceWith(makeAvatar(user)); }
  else if (user.image && isImg)   { const i = av as HTMLImageElement; if (!i.src.endsWith(user.image)) i.src = user.image; }
  else if (!user.image && isImg)  { av.replaceWith(makeInitial(user)); }
  else { const init = user.name.charAt(0).toUpperCase(); if (av.textContent !== init) av.textContent = init; }
}

function injectStyles(users: CollaborationUser[]) {
  const id = "cz-collab-styles";
  let el = document.getElementById(id) as HTMLStyleElement | null;
  if (!el) { el = document.createElement("style"); el.id = id; document.head.appendChild(el); }

  el.textContent = `
    @keyframes cz-blink {
      0%,49.9% { opacity:1 } 50%,100% { opacity:0 }
    }
    @keyframes cz-pop {
      from { opacity:0; transform:translateY(calc(-100% - 3px)) scale(0.72); }
      to   { opacity:1; transform:translateY(calc(-100% - 3px)) scale(1);    }
    }

    /* ── Blinking cursor bar (Monaco decoration) ── */
    .cz-bar {
      display:inline-block!important;
      width:0!important;
      height:1.15em!important;
      vertical-align:text-bottom!important;
      animation: cz-blink 1.1s step-end infinite;
    }

    /* ── Name pill ── */
    .cz-pill {
      /* fixed position is set inline via JS */
      position: fixed;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: var(--cz-color);
      color: #fff;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      font-size: 11px;
      font-weight: 600;
      line-height: 1;
      padding: 3px 9px 3px 4px;
      border-radius: 8px 8px 8px 2px;
      white-space: nowrap;
      pointer-events: none;
      user-select: none;
      box-shadow: 0 2px 16px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.15);
      letter-spacing: 0.01em;
      /* Push pill above the cursor line */
      transform: translateY(calc(-100% - 3px));
      animation: cz-pop 0.2s cubic-bezier(0.34,1.56,0.64,1) both;
      z-index: 2147483647;
    }

    /* ── Avatar ── */
    .cz-pill-avatar {
      width:16px; height:16px;
      border-radius:50%;
      object-fit:cover;
      flex-shrink:0;
      border:1.5px solid rgba(255,255,255,0.45);
      display:block;
    }
    .cz-pill-initial {
      display:inline-flex; align-items:center; justify-content:center;
      background:rgba(255,255,255,0.22);
      font-size:9px; font-weight:700;
    }

    /* ── Per-user cursor + selection colours ── */
    ${users.map(u => `
      .cz-bar-${u.id} {
        border-left: 2px solid ${u.color}!important;
        box-shadow: 0 0 6px ${u.color}66;
        margin-left: -1px;
      }
      .cz-sel-${u.id} {
        background-color: ${u.color}2e!important;
        border-radius: 2px;
      }
    `).join("")}
  `;
}
