import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, runTransaction, push, set, get, update, serverTimestamp, off } from 'firebase/database';
import { getAuth, signInAnonymously, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { firebaseConfig } from '@/config';

// Firebase初期化
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);

// Re-export for convenience
export { ref, onValue, runTransaction, push, set, get, update, serverTimestamp, off };
export { signInAnonymously, onAuthStateChanged };
export type { FirebaseUser };
