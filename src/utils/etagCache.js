// Minimal, promise-based (no async/await), same-tab only.
const PFX = "projcache:";

function read(k) {
  try { const s = sessionStorage.getItem(PFX + k); return s ? JSON.parse(s) : null; }
  catch (_) { return null; }
}
function write(k, v) {
  try { sessionStorage.setItem(PFX + k, JSON.stringify(v)); } catch (_) {}
}

// Use: fetchSessionJSON("/v1/projects/19/", "project:19")
export function fetchSessionJSON(url, key, init = {}) {
  const c = read(key);
  const h = new Headers(init.headers || {});
  if (c?.etag) h.set("If-None-Match", c.etag);
  else if (c?.lastModified) h.set("If-Modified-Since", c.lastModified);

  return fetch(url, { ...init, headers: h, credentials: "include" })
    .then(function (res) {
      if (res.status === 304 && c?.data) return c.data;

      if (!res.ok) {
        if (c?.data) return c.data; // fallback to last good data if network issues
        const e = new Error("HTTP " + res.status);
        e.status = res.status;
        throw e;
      }

      const etag = res.headers.get("ETag");
      const lastModified = res.headers.get("Last-Modified");

      return res.json().then(function (data) {
        write(key, { etag, lastModified, data });
        return data;
      });
    });
}

// Helpers if you want manual control
export function getCached(key) { const c = read(key); return c?.data || null; }
export function clearCached(key) { sessionStorage.removeItem(PFX + key); }
