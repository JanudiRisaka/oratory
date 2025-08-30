// lib/firebase/services/userService.ts
import { db } from "@/lib/firebase/firebaseConfig";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import type { User as FirebaseUser } from "firebase/auth";

export interface Profile {
  name: string;
  email: string;
  title: string;
  company: string;
  location: string;
  bio: string;
  joinDate: Date;
  avatar: string;
}

/**
 * Fetches a user's profile from Firestore.
 * Returns null if the profile does not exist.
 */
export const getUserProfile = async (uid: string): Promise<Profile | null> => {

  const profileRef = doc(db, `users/${uid}/profile`, "data");
  const docSnap = await getDoc(profileRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      ...data,
      joinDate: data.joinDate?.toDate() || new Date(),
    } as Profile;
  } else {
    console.log("No profile document found for user.");
    return null;
  }
};

/**
 * Creates a default profile for a new user. This is essential.
 */
export const createDefaultProfile = async (user: FirebaseUser): Promise<Profile> => {
  // The data to be stored in Firestore
  const newProfileData = {
    name: user.displayName || "New User",
    email: user.email || "",
    title: "",
    company: "",
    location: "",
    bio: "Welcome to Oratory! Click 'Edit Profile' to tell us about yourself.",
    joinDate: serverTimestamp(),
    avatar: user.photoURL || "",
  };

  const profileRef = doc(db, `users/${user.uid}/profile`, "data");
  await setDoc(profileRef, newProfileData);

  return { ...newProfileData, joinDate: new Date() } as Profile;
};

/**
 * Updates a user's profile in Firestore.
 */
export const updateUserProfile = async (uid: string, profileData: Partial<Profile>): Promise<void> => {
  const profileRef = doc(db, `users/${uid}/profile`, "data");
  await setDoc(profileRef, profileData, { merge: true });
};