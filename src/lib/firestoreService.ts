import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc,
  onSnapshot,
  writeBatch,
  Unsubscribe,
} from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "./firebase";
import { sanitizeFirestorePayload } from "./firestoreUtils";
import {
  Edital,
  StudyPlan,
  StudySession,
  ScheduledReview,
  Reminder,
  Simulado,
  UserSettings,
  UserProfile,
  UserRole,
} from "../types";

/**
 * Defensive guard to ensure Firestore queries are only performed
 * when the Firebase Auth user is ready and matches the requested userId.
 */
function isAuthorizedUser(userId: string): boolean {
  return !!(auth.currentUser && auth.currentUser.uid === userId);
}

// ==========================================
// USER PROFILE FIRESTORE REPOSITORY
// ==========================================
export async function saveUserProfileToFirestore(profile: UserProfile): Promise<void> {
  if (!isAuthorizedUser(profile.id)) return;
  const path = `users/${profile.id}`;
  try {
    const docRef = doc(db, "users", profile.id);
    const existingSnap = await getDoc(docRef);

    let resolvedRole: UserRole = "aluno_vip";
    let resolvedCreatedAt = profile.createdAt || new Date().toISOString();

    if (existingSnap.exists()) {
      const existingData = existingSnap.data();
      // Preservar estritamente o role existente no Firestore (ex: "admin" continua "admin")
      resolvedRole = existingData?.role || profile.role || "aluno_vip";
      resolvedCreatedAt = existingData?.createdAt || resolvedCreatedAt;
    } else {
      // Documento inexistente: novo usuário recebe estritamente "aluno_vip"
      resolvedRole = "aluno_vip";
    }

    const dataToSave: Record<string, any> = {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      avatarUrl: profile.avatarUrl || null,
      loginMethod: profile.loginMethod,
      role: resolvedRole,
      createdAt: resolvedCreatedAt,
      lastLoginAt: new Date().toISOString(),
    };

    if (profile.onboarding !== undefined) {
      const rawDraft = profile.onboarding.draft ?? profile.onboardingData ?? null;
      const cleanDraft = rawDraft !== null && rawDraft !== undefined ? sanitizeFirestorePayload(rawDraft) : null;
      dataToSave.onboarding = {
        completed: Boolean(profile.onboarding.completed),
        currentStep: typeof profile.onboarding.currentStep === "number" ? profile.onboarding.currentStep : 0,
        version: profile.onboarding.version || 1,
        startedAt: profile.onboarding.startedAt || new Date().toISOString(),
        completedAt: profile.onboarding.completedAt || null,
        draft: cleanDraft,
      };
      dataToSave.onboardingCompleted = Boolean(profile.onboarding.completed);
      dataToSave.onboardingStep = dataToSave.onboarding.currentStep;
      dataToSave.onboardingDraft = cleanDraft;
    } else if (profile.onboardingCompleted !== undefined) {
      dataToSave.onboardingCompleted = profile.onboardingCompleted;
      dataToSave.onboardingStep = profile.onboardingStep || 0;
    }

    if (profile.onboardingCompletedAt !== undefined) {
      dataToSave.onboardingCompletedAt = profile.onboardingCompletedAt;
    }
    if (profile.onboardingData !== undefined) {
      dataToSave.onboardingData = profile.onboardingData !== null ? sanitizeFirestorePayload(profile.onboardingData) : null;
    }

    await setDoc(docRef, sanitizeFirestorePayload(dataToSave), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveUserOnboardingState(
  userId: string,
  onboarding: {
    completed: boolean;
    currentStep: number;
    version: number;
    startedAt?: string;
    completedAt?: string | null;
    draft?: any;
  },
  onboardingData?: any
): Promise<void> {
  if (!isAuthorizedUser(userId)) return;
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, "users", userId);
    const rawDraft = onboarding.draft ?? onboardingData ?? null;
    const cleanDraft = rawDraft !== null && rawDraft !== undefined ? sanitizeFirestorePayload(rawDraft) : null;
    const payload: Record<string, any> = {
      onboarding: {
        completed: Boolean(onboarding.completed),
        currentStep: typeof onboarding.currentStep === "number" ? onboarding.currentStep : 0,
        version: onboarding.version || 1,
        startedAt: onboarding.startedAt || new Date().toISOString(),
        completedAt: onboarding.completedAt || null,
        draft: cleanDraft,
      },
      onboardingCompleted: Boolean(onboarding.completed),
      onboardingStep: onboarding.currentStep,
      onboardingDraft: cleanDraft,
      lastLoginAt: new Date().toISOString(),
    };
    if (onboarding.completed && onboarding.completedAt) {
      payload.onboardingCompletedAt = onboarding.completedAt;
    }
    if (onboardingData !== undefined || cleanDraft !== null) {
      payload.onboardingData = cleanDraft;
    }
    await setDoc(docRef, sanitizeFirestorePayload(payload), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function checkUserLegacyStatus(userId: string): Promise<boolean> {
  if (!isAuthorizedUser(userId)) return false;
  try {
    // 1. Check existing study plans
    const plansSnap = await getDocs(collection(db, "users", userId, "studyPlans"));
    if (!plansSnap.empty) return true;

    // 2. Check existing study sessions
    const sessionsSnap = await getDocs(collection(db, "users", userId, "studySessions"));
    if (!sessionsSnap.empty) return true;

    // 3. Check existing editais
    const editaisSnap = await getDocs(collection(db, "users", userId, "editais"));
    if (!editaisSnap.empty) return true;

    return false;
  } catch (error) {
    console.warn("[FIRESTORE] Aviso ao verificar status legado:", error);
    return false;
  }
}

export async function getUserProfileFromFirestore(userId: string): Promise<UserProfile | null> {
  if (!isAuthorizedUser(userId)) return null;
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, "users", userId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

// ==========================================
// EDITAIS FIRESTORE REPOSITORY
// ==========================================
export function subscribeEditaisFromFirestore(
  userId: string,
  onUpdate: (editais: Edital[]) => void
): Unsubscribe {
  if (!isAuthorizedUser(userId)) {
    return () => {};
  }
  const path = `users/${userId}/editais`;
  const collRef = collection(db, "users", userId, "editais");

  return onSnapshot(
    collRef,
    (snapshot) => {
      const list: Edital[] = [];
      snapshot.forEach((docSnap) => {
        const item = docSnap.data() as Edital;
        const idLower = String(item.id || "").toLowerCase();
        const titleLower = String(item.title || "").toLowerCase();
        const organLower = String(item.organ || "").toLowerCase();
        const cargoLower = String(item.cargo || "").toLowerCase();

        const isArt =
          idLower.includes("pf") ||
          idLower.includes("demo") ||
          idLower.includes("mock") ||
          idLower.includes("test") ||
          idLower.includes("manaus") ||
          idLower.includes("artificial") ||
          idLower.startsWith("edital-default") ||
          titleLower.includes("polícia federal") ||
          titleLower.includes("agente de polícia federal") ||
          titleLower.includes("escrivão") ||
          titleLower.includes("papiloscopista") ||
          organLower.includes("polícia federal") ||
          cargoLower.includes("polícia federal");

        if (isArt) {
          deleteDoc(docSnap.ref).catch((err) => {
            console.warn("[FIRESTORE] Auto-purging artificial edital:", err);
          });
        } else {
          list.push(item);
        }
      });
      // Sort by creation date descending
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveEditalToFirestore(userId: string, edital: Edital): Promise<void> {
  if (!isAuthorizedUser(userId)) return;
  const path = `users/${userId}/editais/${edital.id}`;
  try {
    const docRef = doc(db, "users", userId, "editais", edital.id);
    await setDoc(docRef, sanitizeFirestorePayload({ ...edital, userId }), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteEditalFromFirestore(userId: string, editalId: string): Promise<void> {
  if (!isAuthorizedUser(userId)) return;
  const path = `users/${userId}/editais/${editalId}`;
  try {
    const docRef = doc(db, "users", userId, "editais", editalId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function purgeOrphanOrArtificialEditais(userId: string): Promise<number> {
  if (!isAuthorizedUser(userId)) return 0;
  try {
    const [plansSnap, editaisSnap] = await Promise.all([
      getDocs(collection(db, "users", userId, "studyPlans")),
      getDocs(collection(db, "users", userId, "editais")),
    ]);

    let count = 0;
    const hasNoPlans = plansSnap.empty;

    for (const docSnap of editaisSnap.docs) {
      const item = docSnap.data() as Edital;
      const idLower = String(item.id || "").toLowerCase();
      const titleLower = String(item.title || "").toLowerCase();
      const organLower = String(item.organ || "").toLowerCase();

      const isArt =
        idLower.includes("pf") ||
        idLower.includes("demo") ||
        idLower.includes("mock") ||
        idLower.includes("test") ||
        idLower.includes("manaus") ||
        idLower.includes("artificial") ||
        idLower.startsWith("edital-default") ||
        titleLower.includes("polícia federal") ||
        titleLower.includes("agente") ||
        titleLower.includes("escrivão") ||
        titleLower.includes("papiloscopista") ||
        organLower.includes("polícia federal");

      // If artificial or if user has no study plans (meaning leftover test editais from previous sessions)
      if (isArt || hasNoPlans) {
        await deleteDoc(docSnap.ref);
        count++;
      }
    }
    return count;
  } catch (err) {
    console.warn("[FIRESTORE] Erro ao limpar editais residuais:", err);
    return 0;
  }
}

// ==========================================
// STUDY PLANS FIRESTORE REPOSITORY
// ==========================================
export function subscribeStudyPlansFromFirestore(
  userId: string,
  onUpdate: (plans: StudyPlan[]) => void
): Unsubscribe {
  if (!isAuthorizedUser(userId)) {
    return () => {};
  }
  const path = `users/${userId}/studyPlans`;
  const collRef = collection(db, "users", userId, "studyPlans");

  return onSnapshot(
    collRef,
    (snapshot) => {
      const list: StudyPlan[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as StudyPlan);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveStudyPlanToFirestore(userId: string, plan: StudyPlan): Promise<void> {
  if (!isAuthorizedUser(userId)) return;
  const path = `users/${userId}/studyPlans/${plan.id}`;
  try {
    const docRef = doc(db, "users", userId, "studyPlans", plan.id);
    // Sanitize plan document to guarantee large Base64 dataUrl is NEVER stored in the main plan doc
    const sanitizedPlan: Record<string, any> = { ...plan, userId };
    if (typeof sanitizedPlan.imageUrl === "string" && sanitizedPlan.imageUrl.startsWith("data:")) {
      delete sanitizedPlan.imageUrl;
    }
    if (typeof sanitizedPlan.image_path === "string" && sanitizedPlan.image_path.startsWith("data:")) {
      delete sanitizedPlan.image_path;
    }
    await setDoc(docRef, sanitizeFirestorePayload(sanitizedPlan), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteStudyPlanFromFirestore(userId: string, planId: string): Promise<void> {
  if (!isAuthorizedUser(userId)) return;
  const path = `users/${userId}/studyPlans/${planId}`;
  try {
    const docRef = doc(db, "users", userId, "studyPlans", planId);
    await deleteDoc(docRef);

    // Also clean up subcollection image document if present
    const imgDocRef = doc(db, "users", userId, "planImages", planId);
    await deleteDoc(imgDocRef).catch(() => {});
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==========================================
// STUDY SESSIONS FIRESTORE REPOSITORY
// ==========================================
export function subscribeStudySessionsFromFirestore(
  userId: string,
  onUpdate: (sessions: StudySession[]) => void
): Unsubscribe {
  if (!isAuthorizedUser(userId)) {
    return () => {};
  }
  const path = `users/${userId}/studySessions`;
  const collRef = collection(db, "users", userId, "studySessions");

  return onSnapshot(
    collRef,
    (snapshot) => {
      const list: StudySession[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as StudySession);
      });
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveStudySessionToFirestore(
  userId: string,
  session: StudySession
): Promise<void> {
  if (!isAuthorizedUser(userId)) return;
  const path = `users/${userId}/studySessions/${session.id}`;
  try {
    const docRef = doc(db, "users", userId, "studySessions", session.id);
    await setDoc(docRef, sanitizeFirestorePayload({ ...session, userId }), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteStudySessionFromFirestore(
  userId: string,
  sessionId: string
): Promise<void> {
  if (!isAuthorizedUser(userId)) return;
  const path = `users/${userId}/studySessions/${sessionId}`;
  try {
    const docRef = doc(db, "users", userId, "studySessions", sessionId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function deleteMultipleStudySessionsFromFirestore(
  userId: string,
  sessionIds: string[]
): Promise<void> {
  if (!isAuthorizedUser(userId)) return;
  const path = `users/${userId}/studySessions (batch)`;
  try {
    const batch = writeBatch(db);
    sessionIds.forEach((id) => {
      const docRef = doc(db, "users", userId, "studySessions", id);
      batch.delete(docRef);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==========================================
// SCHEDULED REVIEWS FIRESTORE REPOSITORY
// ==========================================
export function subscribeScheduledReviewsFromFirestore(
  userId: string,
  onUpdate: (reviews: ScheduledReview[]) => void
): Unsubscribe {
  if (!isAuthorizedUser(userId)) {
    return () => {};
  }
  const path = `users/${userId}/scheduledReviews`;
  const collRef = collection(db, "users", userId, "scheduledReviews");

  return onSnapshot(
    collRef,
    (snapshot) => {
      const list: ScheduledReview[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as ScheduledReview);
      });
      list.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveScheduledReviewToFirestore(
  userId: string,
  review: ScheduledReview
): Promise<void> {
  if (!isAuthorizedUser(userId)) return;
  const path = `users/${userId}/scheduledReviews/${review.id}`;
  try {
    const docRef = doc(db, "users", userId, "scheduledReviews", review.id);
    await setDoc(docRef, sanitizeFirestorePayload({ ...review, userId }), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteScheduledReviewFromFirestore(
  userId: string,
  reviewId: string
): Promise<void> {
  if (!isAuthorizedUser(userId)) return;
  const path = `users/${userId}/scheduledReviews/${reviewId}`;
  try {
    const docRef = doc(db, "users", userId, "scheduledReviews", reviewId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==========================================
// REMINDERS FIRESTORE REPOSITORY
// ==========================================
export function subscribeRemindersFromFirestore(
  userId: string,
  onUpdate: (reminders: Reminder[]) => void
): Unsubscribe {
  if (!isAuthorizedUser(userId)) {
    return () => {};
  }
  const path = `users/${userId}/reminders`;
  const collRef = collection(db, "users", userId, "reminders");

  return onSnapshot(
    collRef,
    (snapshot) => {
      const list: Reminder[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Reminder);
      });
      list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveReminderToFirestore(userId: string, reminder: Reminder): Promise<void> {
  if (!isAuthorizedUser(userId)) return;
  const path = `users/${userId}/reminders/${reminder.id}`;
  try {
    const docRef = doc(db, "users", userId, "reminders", reminder.id);
    await setDoc(docRef, sanitizeFirestorePayload({ ...reminder, userId }), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteReminderFromFirestore(
  userId: string,
  reminderId: string
): Promise<void> {
  if (!isAuthorizedUser(userId)) return;
  const path = `users/${userId}/reminders/${reminderId}`;
  try {
    const docRef = doc(db, "users", userId, "reminders", reminderId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==========================================
// SIMULADOS FIRESTORE REPOSITORY
// ==========================================
export function subscribeSimuladosFromFirestore(
  userId: string,
  onUpdate: (simulados: Simulado[]) => void
): Unsubscribe {
  if (!isAuthorizedUser(userId)) {
    return () => {};
  }
  const path = `users/${userId}/simulados`;
  const collRef = collection(db, "users", userId, "simulados");

  return onSnapshot(
    collRef,
    (snapshot) => {
      const list: Simulado[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Simulado);
      });
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveSimuladoToFirestore(userId: string, simulado: Simulado): Promise<void> {
  if (!isAuthorizedUser(userId)) return;
  const path = `users/${userId}/simulados/${simulado.id}`;
  try {
    const docRef = doc(db, "users", userId, "simulados", simulado.id);
    await setDoc(docRef, sanitizeFirestorePayload({ ...simulado, userId }), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteSimuladoFromFirestore(
  userId: string,
  simuladoId: string
): Promise<void> {
  if (!isAuthorizedUser(userId)) return;
  const path = `users/${userId}/simulados/${simuladoId}`;
  try {
    const docRef = doc(db, "users", userId, "simulados", simuladoId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==========================================
// USER SETTINGS FIRESTORE REPOSITORY
// ==========================================
export function subscribeUserSettingsFromFirestore(
  userId: string,
  onUpdate: (settings: UserSettings) => void
): Unsubscribe {
  if (!isAuthorizedUser(userId)) {
    return () => {};
  }
  const path = `users/${userId}/settings/user_settings`;
  const docRef = doc(db, "users", userId, "settings", "user_settings");

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as UserSettings);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveUserSettingsToFirestore(
  userId: string,
  settings: UserSettings
): Promise<void> {
  if (!isAuthorizedUser(userId)) return;
  const path = `users/${userId}/settings/user_settings`;
  try {
    const docRef = doc(db, "users", userId, "settings", "user_settings");
    await setDoc(
      docRef,
      sanitizeFirestorePayload({ ...settings, userId, updatedAt: new Date().toISOString() }),
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ==========================================
// CONTROLLED DATA AUDIT & RESET (DEV / MAINTENANCE)
// ==========================================
export interface UserDataAuditResult {
  studyPlansCount: number;
  studyPlanIds: string[];
  editaisCount: number;
  editalIds: string[];
  planImagesCount: number;
  planImageIds: string[];
  studySessionsCount: number;
  scheduledReviewsCount: number;
  remindersCount: number;
  simuladosCount: number;
  dependentDataCount: number;
}

export async function auditUserFirestoreData(userId: string): Promise<UserDataAuditResult> {
  if (!isAuthorizedUser(userId)) {
    throw new Error("Usuário não autenticado ou não autorizado para auditar dados.");
  }

  const [
    plansSnap,
    editaisSnap,
    planImagesSnap,
    sessionsSnap,
    reviewsSnap,
    remindersSnap,
    simuladosSnap,
  ] = await Promise.all([
    getDocs(collection(db, "users", userId, "studyPlans")),
    getDocs(collection(db, "users", userId, "editais")),
    getDocs(collection(db, "users", userId, "planImages")),
    getDocs(collection(db, "users", userId, "studySessions")),
    getDocs(collection(db, "users", userId, "scheduledReviews")),
    getDocs(collection(db, "users", userId, "reminders")),
    getDocs(collection(db, "users", userId, "simulados")),
  ]);

  const studyPlanIds = plansSnap.docs.map((d) => d.id);
  const editalIds = editaisSnap.docs.map((d) => d.id);
  const planImageIds = planImagesSnap.docs.map((d) => d.id);
  const studySessionsCount = sessionsSnap.size;
  const scheduledReviewsCount = reviewsSnap.size;
  const remindersCount = remindersSnap.size;
  const simuladosCount = simuladosSnap.size;

  return {
    studyPlansCount: plansSnap.size,
    studyPlanIds,
    editaisCount: editaisSnap.size,
    editalIds,
    planImagesCount: planImagesSnap.size,
    planImageIds,
    studySessionsCount,
    scheduledReviewsCount,
    remindersCount,
    simuladosCount,
    dependentDataCount: studySessionsCount + scheduledReviewsCount + remindersCount + simuladosCount,
  };
}

export async function executeControlledReset(userId: string): Promise<{
  success: boolean;
  deletedCounts: {
    studyPlans: number;
    editais: number;
    planImages: number;
    studySessions: number;
    scheduledReviews: number;
    reminders: number;
    simulados: number;
    total: number;
  };
}> {
  if (!isAuthorizedUser(userId)) {
    throw new Error("Usuário não autenticado ou não autorizado para executar o reset.");
  }

  const collectionsToWipe = [
    "studyPlans",
    "editais",
    "planImages",
    "studySessions",
    "scheduledReviews",
    "reminders",
    "simulados",
  ];

  const counts: Record<string, number> = {
    studyPlans: 0,
    editais: 0,
    planImages: 0,
    studySessions: 0,
    scheduledReviews: 0,
    reminders: 0,
    simulados: 0,
  };

  for (const collName of collectionsToWipe) {
    const collRef = collection(db, "users", userId, collName);
    const snap = await getDocs(collRef);
    if (!snap.empty) {
      const batch = writeBatch(db);
      snap.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
      counts[collName] = snap.size;
    }
  }

  // Reset Onboarding in users/{userId} and mark migration completed
  const now = new Date().toISOString();
  const userDocRef = doc(db, "users", userId);
  await setDoc(
    userDocRef,
    sanitizeFirestorePayload({
      onboarding: {
        completed: false,
        currentStep: 0,
        version: 1,
        startedAt: now,
        completedAt: null,
        draft: {},
      },
      onboardingCompleted: false,
      onboardingStep: 0,
      onboardingDraft: {},
      onboardingCompletedAt: null,
      migration: {
        legacyMigrationVersion: 1,
        completed: true,
        completedAt: now,
      },
    }),
    { merge: true }
  );

  // Mark migration as completed locally so legacy migration never attempts to re-import
  const migrationFlagKey = `farda_migration_completed_v1_${userId}`;
  try {
    localStorage.setItem(migrationFlagKey, "true");

    // Purge user's localStorage keys
    const prefix = `farda_u_${userId}_`;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith(prefix) ||
          key.startsWith("nexo_plan_img_") ||
          key.includes("gcm-manaus") ||
          key.includes("manaus"))
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    console.warn("Aviso ao limpar localStorage:", e);
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return {
    success: true,
    deletedCounts: {
      studyPlans: counts.studyPlans,
      editais: counts.editais,
      planImages: counts.planImages,
      studySessions: counts.studySessions,
      scheduledReviews: counts.scheduledReviews,
      reminders: counts.reminders,
      simulados: counts.simulados,
      total,
    },
  };
}

// ==========================================
// SAFE ONE-TIME LOCALSTORAGE -> FIRESTORE MIGRATION
// ==========================================
export async function migrateLocalDataToFirestore(
  userId: string,
  data: {
    editais?: Edital[];
    studyPlans?: StudyPlan[];
    studySessions?: StudySession[];
    scheduledReviews?: ScheduledReview[];
    reminders?: Reminder[];
    simulados?: Simulado[];
    userSettings?: UserSettings;
  }
): Promise<boolean> {
  // CRITICAL CONSTRAINT: Never start migration if auth is not ready or user mismatch
  if (!isAuthorizedUser(userId)) {
    return false;
  }

  const migrationFlagKey = `farda_migration_completed_v1_${userId}`;

  // 1. Check if migration has already been executed locally
  if (localStorage.getItem(migrationFlagKey) === "true") {
    return true;
  }

  try {
    // 2. Check user's remote document for migration flag in Firestore
    const userDocRef = doc(db, "users", userId);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      if (
        userData?.migration?.completed === true ||
        (userData?.migration?.legacyMigrationVersion ?? 0) >= 1
      ) {
        localStorage.setItem(migrationFlagKey, "true");
        return true;
      }
    }

    // Helper to filter out test/demo/artificial/mock items
    const isArtificial = (id?: string, name?: string, title?: string): boolean => {
      const text = `${id || ""} ${name || ""} ${title || ""}`.toLowerCase();
      return (
        text.includes("gcm-manaus") ||
        text.includes("manaus") ||
        text.includes("mock") ||
        text.includes("demo") ||
        text.includes("fake") ||
        text.includes("teste") ||
        text.includes("artificial") ||
        text.includes("polícia federal") ||
        text.includes("policia federal") ||
        text.includes("policia-federal") ||
        text.includes("pf-") ||
        text.includes("agente de polícia federal") ||
        text.includes("escrivão") ||
        text.includes("papiloscopista")
      );
    };

    const realEditais = (data.editais || []).filter(
      (e) => e.id && !isArtificial(e.id, e.title)
    );
    const realPlans = (data.studyPlans || []).filter(
      (p) => p.id && !isArtificial(p.id, p.name)
    );

    // If there are no legitimate editais or plans to migrate, do not create artificial items
    if (realEditais.length === 0 && realPlans.length === 0) {
      await setDoc(
        userDocRef,
        sanitizeFirestorePayload({
          migration: {
            legacyMigrationVersion: 1,
            completed: true,
            completedAt: new Date().toISOString(),
          },
        }),
        { merge: true }
      );
      localStorage.setItem(migrationFlagKey, "true");
      return true;
    }

    // Migrate legitimate records only
    for (const edital of realEditais) {
      await saveEditalToFirestore(userId, edital);
    }
    for (const plan of realPlans) {
      await saveStudyPlanToFirestore(userId, plan);
    }
    if (data.studySessions && data.studySessions.length > 0) {
      for (const session of data.studySessions) {
        if (session.id && !isArtificial(session.id)) {
          await saveStudySessionToFirestore(userId, session);
        }
      }
    }
    if (data.scheduledReviews && data.scheduledReviews.length > 0) {
      for (const review of data.scheduledReviews) {
        if (review.id && !isArtificial(review.id)) {
          await saveScheduledReviewToFirestore(userId, review);
        }
      }
    }
    if (data.reminders && data.reminders.length > 0) {
      for (const rem of data.reminders) {
        if (rem.id && !isArtificial(rem.id)) {
          await saveReminderToFirestore(userId, rem);
        }
      }
    }
    if (data.simulados && data.simulados.length > 0) {
      for (const sim of data.simulados) {
        if (sim.id && !isArtificial(sim.id)) {
          await saveSimuladoToFirestore(userId, sim);
        }
      }
    }
    if (data.userSettings) {
      await saveUserSettingsToFirestore(userId, data.userSettings);
    }

    // Mark completed in Firestore and local storage
    await setDoc(
      userDocRef,
      sanitizeFirestorePayload({
        migration: {
          legacyMigrationVersion: 1,
          completed: true,
          completedAt: new Date().toISOString(),
        },
      }),
      { merge: true }
    );
    localStorage.setItem(migrationFlagKey, "true");
    console.log(`[MIGRATION SUCCESS] Dados legítimos migrados com sucesso para users/${userId}`);

    return true;
  } catch (error) {
    console.warn("[MIGRATION WARNING]: Falha temporária ao migrar dados locais para o Firestore:", error);
    return false;
  }
}
