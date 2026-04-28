import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore, initializeFirestore, doc, setDoc, onSnapshot,
  persistentLocalCache, persistentMultipleTabManager,
} from 'firebase/firestore';

const apiKey    = import.meta.env.VITE_FIREBASE_API_KEY;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

let db = null;
if (apiKey && projectId) {
  const alreadyInit = getApps().length > 0;
  const app = alreadyInit ? getApp() : initializeApp({
    apiKey,
    authDomain: `${projectId}.firebaseapp.com`,
    projectId,
  });
  if (alreadyInit) {
    // HMR in dev: Firestore already configured, reuse existing instance
    db = getFirestore(app);
  } else {
    try {
      // Enable IndexedDB persistence so repeat visits load from cache instantly
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
    } catch {
      // Private browsing or unsupported browser — fall back to in-memory
      db = getFirestore(app);
    }
  }
}

export const hasBackend = !!db;

// Returns the writeId used on success (for echo suppression), null on failure.
// Pass a pre-generated writeId when you need to set the ref BEFORE the await.
export async function saveProjectsToDB(workspaceId, projects, writeId) {
  if (!db) return null;
  const wid = writeId ?? (Math.random().toString(36).slice(2) + Date.now().toString(36));
  try {
    await setDoc(doc(db, 'workspaces', workspaceId), {
      projects,
      updatedAt: new Date().toISOString(),
      writeId: wid,
    });
    return wid;
  } catch {
    return null;
  }
}

// Real-time subscription.
// onData(projects[], writeId | null) — fires immediately with current data, then on every change.
// onError()                          — fires if Firestore is unavailable.
// Returns an unsubscribe function.
export function subscribeToProjects(workspaceId, onData, onError) {
  if (!db) { onError?.(); return () => {}; }
  return onSnapshot(
    doc(db, 'workspaces', workspaceId),
    (snap) => {
      if (!snap.exists()) { onData([], null); return; }
      const d = snap.data();
      onData(d.projects ?? [], d.writeId ?? null);
    },
    () => onError?.(),
  );
}
