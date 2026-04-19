"use client";

import {
  useLayoutEffect,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";

const PANEL_W = 320;
const GAP = 8;

export type NotificationPanelPlacement = "sidebar" | "topbar";

export function useNotificationPanelPosition(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  placement: NotificationPanelPlacement,
): CSSProperties {
  const [style, setStyle] = useState<CSSProperties>({});

  useLayoutEffect(() => {
    if (!open) {
      setStyle({});
      return;
    }

    const el = anchorRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const panelW = Math.min(PANEL_W, window.innerWidth - 16);

      if (placement === "sidebar") {
        let left = rect.right + GAP;
        if (left + panelW > window.innerWidth - GAP) {
          left = Math.max(GAP, rect.left - panelW - GAP);
        }
        setStyle({
          position: "fixed",
          top: rect.top,
          left,
          width: panelW,
          zIndex: 10000,
        });
      } else {
        const top = rect.bottom + GAP;
        let left = rect.right - panelW;
        left = Math.max(GAP, Math.min(left, window.innerWidth - panelW - GAP));
        setStyle({
          position: "fixed",
          top,
          left,
          width: panelW,
          zIndex: 10000,
        });
      }
    };

    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, placement, anchorRef]);

  return style;
}
