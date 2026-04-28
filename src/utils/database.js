import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

const apiKey    = import.meta.env.VITE_FIREBASE_API_KEY;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

let db = null;
if (apiKey && projectId) {
  const app = getApps().length ? getApp() : initializeApp({
    apiKey,
    authDomain: `${projectId}.firebaseapp.com`,
    projectId,
  });
  db = getFirestore(app);
}

export const hasBackend = !!db;

export async function fetchProjects(workspaceId) {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, 'workspaces', workspaceId));
    return snap.exists() ? (snap.data().projects ?? []) : [];
  } catch {
    return null;
  }
}

export async function saveProjectsToDB(workspaceId, projects) {
  if (!db) return false;
  try {
    await setDoc(doc(db, 'workspaces', workspaceId), {
      projects,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch {
    return false;
  }
}

// Real-time subscription — fires immediately with current data, then on every change.
// onData(projects[]) — called with current array
// onError()         — called if Firestore is unavailable
// Returns an unsubscribe function to call on cleanup.
export function subscribeToProjects(workspaceId, onData, onError) {
  if (!db) { onError?.(); return () => {}; }
  return onSnapshot(
    doc(db, 'workspaces', workspaceId),
    (snap) => onData(snap.exists() ? (snap.data().projects ?? []) : []),
    () => onError?.(),
  );
}
