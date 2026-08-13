"use client";

import { useEffect } from "react";

/** Irehistro ang service worker — production lang (baka makasagabal sa dev). */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* optional lang ang PWA */
    });
  }, []);
  return null;
}
