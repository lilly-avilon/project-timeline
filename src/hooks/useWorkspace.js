import { useState, useEffect, useRef, useCallback } from 'react';
import {
  loadProjects, saveProjects,
  getWorkspaceId, getWorkspaceIdFromUrl, decodeProjectsFromUrl,
} from '../utils/storage';
import { saveProjectsToDB, hasBackend, subscribeToProjects } from '../utils/database';

function migrateProject(p) {
  if (p.itemName !== undefined) return p;
  return { ...p, itemName: 'items', itemCount: p.droneCount ?? 1 };
}

function makeWriteId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * Manages all workspace state: Firestore subscription, localStorage fallback,
 * first-time migration, and echo suppression.
 *
 * Returns:
 *   projects     — current project array
 *   persist      — async (updatedArray) => void  — call on any mutation
 *   loading      — true until first data is ready
 *   backendReady — true once Firestore has confirmed at least one snapshot
 *   workspaceId  — the active workspace ID (own or shared)
 *   viewOnly     — true only for static ?data= snapshot links
 *   isSharedRef  — ref, true when viewing a live ?ws= shared link
 */
export function useWorkspace() {
  const [projects, setProjects]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [backendReady, setBackendReady]   = useState(false);
  const [workspaceId, setWorkspaceId]     = useState(null);
  const [viewOnly, setViewOnly]           = useState(false);

  const unsubRef        = useRef(null);
  const isSharedRef     = useRef(false);
  // Set BEFORE the Firestore write so onSnapshot echo arrives after the ref is populated
  const pendingWriteRef = useRef(null);

  useEffect(() => {
    const sharedWsId = getWorkspaceIdFromUrl();
    isSharedRef.current = !!sharedWsId;

    // Path 1: URL-encoded snapshot (?data=) — static, no Firestore
    const snap = decodeProjectsFromUrl();
    if (snap) {
      setViewOnly(true);
      setProjects(snap.map(migrateProject));
      setLoading(false);
      return;
    }

    const wsId     = sharedWsId ?? getWorkspaceId();
    const isShared = !!sharedWsId;
    setWorkspaceId(wsId);

    // No Firebase configured — localStorage only
    if (!hasBackend) {
      if (!isShared) setProjects(loadProjects().map(migrateProject));
      setLoading(false);
      return;
    }

    // Own workspace: paint localStorage content instantly; Firestore syncs behind the scenes
    if (!isShared) {
      setProjects(loadProjects().map(migrateProject));
      setLoading(false);
    }

    unsubRef.current = subscribeToProjects(
      wsId,
      async (data, incomingWriteId) => {
        setBackendReady(true);

        // Suppress echo of our own write — we already updated state optimistically
        const isEcho = incomingWriteId !== null && incomingWriteId === pendingWriteRef.current;
        pendingWriteRef.current = null;

        if (!isEcho) {
          // Don't wipe localStorage data with an empty Firestore doc on own workspace
          if (data.length > 0 || isShared) {
            setProjects(data.map(migrateProject));
          }
        }

        // First-time migration: own workspace, Firestore empty, localStorage has data
        if (!isShared && data.length === 0) {
          const local = loadProjects().map(migrateProject);
          if (local.length > 0) {
            const wid = makeWriteId();
            pendingWriteRef.current = wid; // suppress the migration echo
            const ok = await saveProjectsToDB(wsId, local, wid);
            if (!ok) pendingWriteRef.current = null;
          }
        }

        setLoading(false);
      },
      () => setLoading(false), // Firestore unavailable — fall through to localStorage content
    );

    return () => { if (unsubRef.current) unsubRef.current(); };
  }, []);

  const persist = useCallback(async (updated) => {
    setProjects(updated); // optimistic — UI responds immediately

    if (backendReady && workspaceId) {
      // Generate writeId BEFORE the await so onSnapshot echo always arrives after it's set
      const wid = makeWriteId();
      pendingWriteRef.current = wid;

      const ok = await saveProjectsToDB(workspaceId, updated, wid);
      if (ok) {
        // Dual-write: keep localStorage in sync for own workspace resilience
        if (!isSharedRef.current) saveProjects(updated);
      } else {
        pendingWriteRef.current = null;
        saveProjects(updated); // Firestore write failed — fall back to localStorage
      }
    } else {
      saveProjects(updated);
    }
  }, [backendReady, workspaceId]);

  return { projects, loading, backendReady, workspaceId, viewOnly, isSharedRef, persist };
}
