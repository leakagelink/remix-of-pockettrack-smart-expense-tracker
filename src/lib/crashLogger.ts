/**
 * Global crash & error logger.
 *
 * Why: When the Capacitor Android app crashes immediately on launch, the only
 * reliable way to see WHY is via `adb logcat`. This module makes sure that:
 *   1. Any uncaught JS error / unhandled promise rejection is printed to
 *      `console.error` with a `[CRASH]` tag — these show up in `adb logcat`
 *      under the `Capacitor/Console` tag.
 *   2. The error message + stack are also rendered into the DOM as a visible
 *      red banner, so even on a phone without a debugger you can SEE what blew
 *      up instead of staring at a white/black screen.
 */

let installed = false;

function showOnScreen(title: string, detail: string) {
  if (typeof document === "undefined") return;
  try {
    let host = document.getElementById("__crash_overlay__");
    if (!host) {
      host = document.createElement("div");
      host.id = "__crash_overlay__";
      host.style.cssText = [
        "position:fixed",
        "left:0",
        "right:0",
        "bottom:0",
        "max-height:55vh",
        "overflow:auto",
        "z-index:2147483647",
        "background:#7f1d1d",
        "color:#fff",
        "font:12px/1.4 -apple-system,Segoe UI,Roboto,monospace",
        "padding:10px 12px",
        "border-top:2px solid #fecaca",
        "white-space:pre-wrap",
        "word-break:break-word",
      ].join(";");
      document.body?.appendChild(host);
    }
    const block = document.createElement("div");
    block.style.cssText = "margin:6px 0;border-bottom:1px solid #fecaca55;padding-bottom:6px;";
    block.textContent = `⚠️ ${title}\n${detail}`;
    host.appendChild(block);
  } catch {
    /* swallow — overlay must never itself crash */
  }
}

function format(err: unknown): string {
  if (!err) return "Unknown error";
  if (err instanceof Error) {
    return `${err.name}: ${err.message}\n${err.stack ?? ""}`;
  }
  try {
    return typeof err === "string" ? err : JSON.stringify(err);
  } catch {
    return String(err);
  }
}

export function installGlobalCrashLogger() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (event) => {
    const detail = format(event.error ?? event.message);
    // eslint-disable-next-line no-console
    console.error("[CRASH] window.error:", detail);
    showOnScreen("Uncaught error", detail);
  });

  window.addEventListener("unhandledrejection", (event) => {
    const detail = format(event.reason);
    // eslint-disable-next-line no-console
    console.error("[CRASH] unhandledrejection:", detail);
    showOnScreen("Unhandled promise rejection", detail);
  });

  // eslint-disable-next-line no-console
  console.log("[CRASH] global crash logger installed");
}