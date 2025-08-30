// lib/firebase/services/sessionService.ts
import { db, auth } from "@/lib/firebase/firebaseConfig";
import { doc, setDoc, getDoc, collection, getDocs, query, orderBy, serverTimestamp, limit } from "firebase/firestore";
import type { SummaryReport, DetailedReport, SessionData, UnifiedFeedbackData, FeedbackHistoryItem, BackendReport } from "@/features/facial-analysis/types";

  export const saveSessionToFirestore = async (
  summaryReport: SummaryReport,
  detailedReport: DetailedReport,
  scenarioId: string,
  selectedGoals: string[]
): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated.");

  const sessionId = new Date().getTime().toString();
  const sessionRef = doc(db, `users/${user.uid}/sessions`, sessionId);

  const sessionData: Omit<SessionData, 'id'> = {
    createdAt: serverTimestamp(),
    scenarioId,
    selectedGoals,
    summaryReport,
    detailedReport,
  };

  await setDoc(sessionRef, sessionData);
  console.log("SUCCESS: Raw session data saved to Firestore.");
  return sessionId;
};

export const fetchSessionById = async (sessionId: string): Promise<{ backend: BackendReport, detailed: DetailedReport, selectedGoals: string[], scenarioId: string } | null> => {
    const user = auth.currentUser;
    if (!user) return null;

    const sessionRef = doc(db, `users/${user.uid}/sessions`, sessionId);
    const docSnap = await getDoc(sessionRef);

    if (!docSnap.exists()) return null;

    const data = docSnap.data() as SessionData;

    return null;
}

export const fetchSessionsFromFirestore = async (): Promise<SessionData[]> => {
  const user = auth.currentUser;
  if (!user) return [];

  const sessionsRef = collection(db, `users/${user.uid}/sessions`);
  const q = query(sessionsRef, orderBy("createdAt", "desc"));

  try {
    const querySnapshot = await getDocs(q);
    const sessions = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as SessionData[];
    return sessions;
  } catch (error) {
    console.error("Error fetching sessions from Firestore:", error);
    return [];
  }
};

export const saveFeedbackToFirestore = async (
  feedbackData: Omit<FeedbackHistoryItem, 'id' | 'createdAt'>
): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated.");

  console.log(`%c[Firestore Save] Attempting to save session with score: ${feedbackData.overallScore}`, 'color: red; font-weight: bold;');


  const sessionId = new Date().getTime().toString();
  const feedbackRef = doc(db, `users/${user.uid}/feedbackHistory`, sessionId);

  const dataToSave = {
    ...feedbackData,
    createdAt: serverTimestamp()
  };
  await setDoc(feedbackRef, dataToSave);
  console.log("SUCCESS: Unified feedback report saved to Firestore.");
  return sessionId;
};

export const fetchFeedbackHistory = async (count?: number): Promise<FeedbackHistoryItem[]> => {
    const user = auth.currentUser;
    if (!user) return [];

    const historyRef = collection(db, `users/${user.uid}/feedbackHistory`);

    let q = query(historyRef, orderBy("createdAt", "desc"));

    if (count) {
        q = query(historyRef, orderBy("createdAt", "desc"), limit(count));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
    })) as FeedbackHistoryItem[];
};

export const fetchFeedbackById = async (sessionId: string): Promise<FeedbackHistoryItem | null> => {
    const user = auth.currentUser;
    if (!user) return null;

    const feedbackRef = doc(db, `users/${user.uid}/feedbackHistory`, sessionId);
    const docSnap = await getDoc(feedbackRef);

    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt.toDate(),
    } as FeedbackHistoryItem;
}
