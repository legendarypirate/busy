"use client";

import { useEffect } from "react";

/** Matches PHP `platform-home.php`: `body.platform-v4` + hides marketing Navbar/Footer. */
export default function PlatformBodyClass() {
  useEffect(() => {
    document.body.classList.add("platform-v4", "platform-route");
    return () => {
      document.body.classList.remove("platform-v4", "platform-route");
    };
  }, []);
  return null;
}
