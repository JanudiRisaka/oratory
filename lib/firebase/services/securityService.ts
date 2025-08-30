import { db } from "@/lib/firebase/firebaseConfig";
import { addDoc, collection, getDocs, query, orderBy, serverTimestamp, limit } from "firebase/firestore";

export interface SecurityAuditEvent {
  id: string;
  event: string;
  at: Date;
}

/**
 * Write a security event audit log to Firestore for a specific user.
 */
export async function writeSecurityAudit(uid: string, event: string, meta?: Record<string, any>) {
  try {
    await addDoc(collection(db, "users", uid, "security_audit"), {
      event,
      at: serverTimestamp(),
      ...meta,
    });
  } catch (e) {
    console.warn("Security audit write failed:", e);
  }
}

/**
 * Fetches the most recent security audit events for a user.
 */
export async function fetchSecurityAudits(uid: string): Promise<SecurityAuditEvent[]> {
  try {
    const auditRef = collection(db, "users", uid, "security_audit");
    const q = query(auditRef, orderBy("at", "desc"), limit(5));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      at: doc.data().at.toDate(),
    })) as SecurityAuditEvent[];
  } catch (e) {
    console.error("Failed to fetch security audits:", e);
    return [];
  }
}