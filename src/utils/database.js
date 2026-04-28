import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const apiKey     = import.meta.env.VITE_FIREBASE_API_KEY;
const projectId  = import.meta.env.VITE_FIREBASE_PROJECT_ID;

const app = apiKey && projectId
  ? initializeApp({
      apiKey,
      authDomain:  `${projectId}.firebaseapp.com`,
      projectId,
    })
  : null;

const db = app ? getFirestore(app) : null;

export const hasBackend = !!db;

export async function fetchProjects(workspaceId) {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, 'workspaces', workspaceId));
    return snap.exists() ? (snap.data().projects ?? []) : [];
  } catch { return null; }
}

export async function saveProjectsToDB(workspaceId, projects) {
  if (!db) return false;
  try {
    await setDoc(doc(db, 'workspaces', workspaceId), {
      projects,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch { return false; }
}
