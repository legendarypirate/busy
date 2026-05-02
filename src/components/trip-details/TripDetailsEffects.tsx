"use client";

import { useEffect } from "react";

/** Mirrors PHP `trip-details.php` footer script: FAQ, section tabs, day panels, consult scroll. */
export default function TripDetailsEffects() {
  useEffect(() => {
    const root = document.querySelector(".trd-body") as HTMLElement | null;
    if (!root) return;

    const onClick = (e: Event) => {
      const target = (e as MouseEvent).target as HTMLElement | null;
      if (!target || !root.contains(target)) return;

      const faqTrigger = target.closest(".trd-faq-trigger");
      if (faqTrigger) {
        const item = faqTrigger.closest(".trd-faq-item");
        if (!item || !root.contains(item)) return;
        const wasOpen = item.classList.contains("is-open");
        root.querySelectorAll(".trd-faq-item").forEach((other) => {
          other.classList.remove("is-open");
          const oi = other.querySelector(".trd-faq-trigger i.fa-chevron-down") as HTMLElement | null;
          if (oi) oi.style.transform = "rotate(0deg)";
        });
        if (!wasOpen) {
          item.classList.add("is-open");
          const icon = faqTrigger.querySelector("i.fa-chevron-down") as HTMLElement | null;
          if (icon) icon.style.transform = "rotate(180deg)";
        }
        return;
      }

      const tab = target.closest(".trd-tab[data-trd-section]") as HTMLElement | null;
      if (tab) {
        e.preventDefault();
        root.querySelectorAll(".trd-tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        const id = tab.getAttribute("data-trd-section");
        const el = id ? document.getElementById(id) : null;
        if (el) {
          try {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          } catch {
            el.scrollIntoView(true);
          }
        }
        return;
      }

      const timelineBtn = target.closest(".trd-timeline-btn[data-trd-day-index]") as HTMLElement | null;
      if (timelineBtn) {
        const ix = timelineBtn.getAttribute("data-trd-day-index");
        if (ix == null) return;
        root.querySelectorAll(".trd-timeline-btn[data-trd-day-index]").forEach((b) => {
          const on = b.getAttribute("data-trd-day-index") === ix;
          b.classList.toggle("active", on);
          b.setAttribute("aria-selected", on ? "true" : "false");
        });
        root.querySelectorAll(".trd-day-panel[data-trd-day-panel]").forEach((p) => {
          const on = p.getAttribute("data-trd-day-panel") === ix;
          p.classList.toggle("is-active", on);
          (p as HTMLElement).hidden = !on;
        });
        return;
      }

      if (target.closest(".trd-btn-contact")) {
        const help = document.getElementById("trd-section-help");
        if (help) {
          try {
            help.scrollIntoView({ behavior: "smooth", block: "center" });
          } catch {
            help.scrollIntoView(true);
          }
        }
      }
    };

    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, []);

  return null;
}
