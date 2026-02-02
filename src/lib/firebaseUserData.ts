import {
  doc,
  getDoc,
  setDoc,
  deleteField,
  type DocumentData,
} from 'firebase/firestore';
import { getDb } from './firebase';
import type { AppSettings } from '@/types';
import type { VoiceProfile } from './voiceIdentification';

export interface UserClassesItem {
  id: string;
  name: string;
  sessions: UserSessionItem[];
  createdAt: string;
}

export interface UserSessionItem {
  id: string;
  title: string;
  classId: string;
  createdAt: string;
  transcript?: string;
  captions?: Array<{
    id: string;
    text: string;
    timestamp: number;
    isFinal: boolean;
    speaker?: string;
    isEdited?: boolean;
    originalText?: string;
  }>;
}

export interface UserDataDoc {
  settings?: AppSettings;
  classes?: UserClassesItem[];
  deepgramApiKey?: string;
  teacherVoiceProfile?: VoiceProfile;
  updatedAt?: string;
}

function userDocRef(userId: string) {
  const database = getDb();
  if (!database) return null;
  return doc(database, 'users', userId);
}

export async function getUserData(userId: string): Promise<UserDataDoc | null> {
  const ref = userDocRef(userId);
  if (!ref) return null;
  try {
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as UserDataDoc) : null;
  } catch (e) {
    console.error('Firebase getUserData error:', e);
    return null;
  }
}

export async function setUserData(
  userId: string,
  data: Partial<UserDataDoc>
): Promise<boolean> {
  const ref = userDocRef(userId);
  if (!ref) return false;
  try {
    const existing = await getDoc(ref);
    const merged: DocumentData = existing.exists()
      ? { ...existing.data(), ...data }
      : { ...data };
    merged.updatedAt = new Date().toISOString();
    await setDoc(ref, merged, { merge: true });
    return true;
  } catch (e) {
    console.error('Firebase setUserData error:', e);
    return false;
  }
}

export async function getUserSettings(userId: string): Promise<AppSettings | null> {
  const data = await getUserData(userId);
  return data?.settings ?? null;
}

export async function setUserSettings(
  userId: string,
  settings: AppSettings
): Promise<boolean> {
  return setUserData(userId, { settings });
}

export async function getUserClasses(userId: string): Promise<UserClassesItem[]> {
  const data = await getUserData(userId);
  return data?.classes ?? [];
}

export async function setUserClasses(
  userId: string,
  classes: UserClassesItem[]
): Promise<boolean> {
  return setUserData(userId, { classes });
}

export async function getUserDeepgramApiKey(userId: string): Promise<string | null> {
  const data = await getUserData(userId);
  return data?.deepgramApiKey ?? null;
}

export async function setUserDeepgramApiKey(
  userId: string,
  apiKey: string
): Promise<boolean> {
  return setUserData(userId, { deepgramApiKey: apiKey });
}

export async function getUserTeacherVoiceProfile(
  userId: string
): Promise<VoiceProfile | null> {
  const data = await getUserData(userId);
  return data?.teacherVoiceProfile ?? null;
}

export async function setUserTeacherVoiceProfile(
  userId: string,
  profile: VoiceProfile
): Promise<boolean> {
  return setUserData(userId, { teacherVoiceProfile: profile });
}

export async function clearUserTeacherVoiceProfile(userId: string): Promise<boolean> {
  const ref = userDocRef(userId);
  if (!ref) return false;
  try {
    const existing = await getDoc(ref);
    const merged: DocumentData = existing.exists() ? { ...existing.data() } : {};
    merged.teacherVoiceProfile = deleteField();
    merged.updatedAt = new Date().toISOString();
    await setDoc(ref, merged, { merge: true });
    return true;
  } catch (e) {
    console.error('Firebase clearUserTeacherVoiceProfile error:', e);
    return false;
  }
}
