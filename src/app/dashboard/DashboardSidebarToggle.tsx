"use client";

import { useEffect } from "react";

/** Mobile drawer: open / close / overlay (ids must match `dashboard/layout.tsx`). */
export default function DashboardSidebarToggle() {
  useEffect(() => {
    const sidebar = document.getElementById("dashSidebar");
    const overlay = document.getElementById("dashSidebarOverlay");
    const openBtn = document.getElementById("dashSidebarOpen");
    const closeBtn = document.getElementById("dashSidebarClose");
    if (!sidebar || !overlay) return;

    const sb = sidebar;
    const ov = overlay;

    function closeDrawer() {
      sb.classList.remove("show");
      ov.classList.remove("show");
      document.body.style.overflow = "";
    }

    function openDrawer() {
      sb.classList.add("show");
      ov.classList.add("show");
      document.body.style.overflow = "hidden";
    }

    openBtn?.addEventListener("click", openDrawer);
    closeBtn?.addEventListener("click", closeDrawer);
    ov.addEventListener("click", closeDrawer);

    return () => {
      openBtn?.removeEventListener("click", openDrawer);
      closeBtn?.removeEventListener("click", closeDrawer);
      ov.removeEventListener("click", closeDrawer);
    };
  }, []);

  return null;
}
