import type { GlowState } from "./glow-types";

/**
 * Encode GlowState to a URL-safe base64 string (compressed)
 */
export function encodeStateToUrl(state: GlowState): string {
  try {
    const json = JSON.stringify(state);
    const encoded = btoa(encodeURIComponent(json));
    return encoded;
  } catch {
    return "";
  }
}

/**
 * Decode a base64 string back to GlowState
 */
export function decodeStateFromUrl(encoded: string): GlowState | null {
  try {
    const json = decodeURIComponent(atob(encoded));
    const parsed = JSON.parse(json);
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.layers)) {
      return parsed as GlowState;
    }
  } catch {

    // invalid
  }return null;
}

/**
 * Build a shareable URL with state encoded in hash
 */
export function buildShareUrl(state: GlowState): string {
  const encoded = encodeStateToUrl(state);
  const url = new URL(window.location.href);
  url.hash = "";
  url.searchParams.delete("s");
  // Use hash for large payloads (no server needed)
  url.hash = `s=${encoded}`;
  return url.toString();
}

/**
 * Extract state from current URL hash if present
 */
export function getStateFromCurrentUrl(): GlowState | null {
  try {
    const hash = window.location.hash;
    if (!hash) return null;
    const params = new URLSearchParams(hash.slice(1));
    const encoded = params.get("s");
    if (!encoded) return null;
    return decodeStateFromUrl(encoded);
  } catch {
    return null;
  }
}