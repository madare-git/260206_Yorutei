import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { auth, db } from './firebase';
import type { AppUser, FirebaseUserData } from '@/types';

export { onAuthStateChanged };
export type { FirebaseUser };

/**
 * 店舗アカウント登録
 */
export async function registerStore(
  email: string,
  password: string,
  storeId: string
): Promise<FirebaseUser> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // ユーザーデータをRealtimeDBに保存
  const userData: FirebaseUserData = {
    role: 'store',
    email,
    storeId,
    createdAt: Date.now(),
  };

  await set(ref(db, `users/${user.uid}`), userData);

  return user;
}

/**
 * ユーザーアカウント登録
 */
export async function registerUser(
  email: string,
  password: string,
  nickname: string
): Promise<FirebaseUser> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // ユーザーデータをRealtimeDBに保存
  const userData: FirebaseUserData = {
    role: 'user',
    email,
    nickname,
    createdAt: Date.now(),
  };

  await set(ref(db, `users/${user.uid}`), userData);

  return user;
}

/**
 * ログイン
 */
export async function login(email: string, password: string): Promise<FirebaseUser> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

/**
 * ログアウト
 */
export async function logout(): Promise<void> {
  await signOut(auth);
}

/**
 * ユーザーデータを取得
 */
export async function getUserData(uid: string): Promise<AppUser | null> {
  const snapshot = await get(ref(db, `users/${uid}`));
  if (!snapshot.exists()) return null;

  const data = snapshot.val() as FirebaseUserData;
  return {
    uid,
    ...data,
  };
}

/**
 * 現在のユーザーを取得
 */
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}
