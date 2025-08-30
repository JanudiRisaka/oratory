import { db } from "@/lib/firebase/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface UserSettings {
  aiSensitivity: "low" | "medium" | "high";
}

export const defaultSettings: UserSettings = {
  aiSensitivity: "medium",
};

/**
 * Fetches a user's settings from Firestore.
 * Returns default settings if none are found.
 */
export const getUserSettings = async (uid: string): Promise<UserSettings> => {
  const settingsRef = doc(db, `users/${uid}/settings`, "data");
  const docSnap = await getDoc(settingsRef);

  if (docSnap.exists()) {
    return docSnap.data() as UserSettings;
  } else {
    await setDoc(settingsRef, defaultSettings);
    return defaultSettings;
  }
};

/**
 * Updates a user's settings in Firestore.
 */
export const updateUserSettings = async (uid: string, settings: Partial<UserSettings>): Promise<void> => {
  const settingsRef = doc(db, `users/${uid}/settings`, "data");
  await setDoc(settingsRef, settings, { merge: true });
};