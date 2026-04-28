const KEY    = 'timeline_projects';
const WS_KEY = 'timeline_workspace_id';

// ── localStorage fallback ──────────────────────────────────────
export function loadProjects() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveProjects(projects) {
  localStorage.setItem(KEY, JSON.stringify(projects));
}

// ── Workspace ID ──────────────────────────────────────────────
export function getWorkspaceId() {
  let id = localStorage.getItem(WS_KEY);
  if (!id) {
    id = 'ws_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    localStorage.setItem(WS_KEY, id);
  }
  return id;
}

export function getWorkspaceIdFromUrl() {
  return new URLSearchParams(window.location.search).get('ws');
}

export function buildShareUrl(workspaceId) {
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set('ws', workspaceId);
  return url.toString();
}

// ── Legacy URL-encoded share (fallback when no backend) ────────
export function encodeProjectsToUrl(projects) {
  const encoded = btoa(encodeURIComponent(JSON.stringify(projects)));
  const url = new URL(window.location.href);
  url.searchParams.set('data', encoded);
  return url.toString();
}

export function decodeProjectsFromUrl() {
  try {
    const encoded = new URLSearchParams(window.location.search).get('data');
    if (!encoded) return null;
    return JSON.parse(decodeURIComponent(atob(encoded)));
  } catch { return null; }
}
