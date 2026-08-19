import { GRAPH_SCOPES } from '../config.js';
import { acquireToken } from './authToken.js';

// ─── Token helper ─────────────────────────────────────────────────────────────

export async function acquireGraphToken(instance) {
  return acquireToken(instance, GRAPH_SCOPES);
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────
// Shared by api/planner.js and api/todo.js.

export async function gFetch(url, token, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (res.status === 204) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message ?? `HTTP ${res.status}: ${url}`);
  }
  return res.json();
}

export async function fetchAllPages(url, token) {
  const items = [];
  let nextUrl = url;
  while (nextUrl) {
    const data = await gFetch(nextUrl, token);
    items.push(...(data?.value ?? []));
    nextUrl = data?.['@odata.nextLink'] ?? null;
  }
  return items;
}
