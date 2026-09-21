import React, { createContext, useContext, useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile as updateFirebaseProfile,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import {
  saveUserProfileToFirestore,
  getUserProfileFromFirestore,
  saveUserOnboardingState,
  checkUserLegacyStatus,
} from "../lib/firestoreService";
import { sanitizeFirestorePayload } from "../lib/firestoreUtils";
import { UserProfile, UserRole, OnboardingData, UserOnboardingState } from "../types";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextType {
  authStatus: AuthStatus;
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string; code?: string; domain?: string }>;
  signupWithEmail: (
    name: string,
    email: string,
    pass: string
  ) => Promise<{ success: boolean; error?: string; message?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string; recoveryCode?: string; emailDispatched?: boolean }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string; recoveryCode?: string; emailDispatched?: boolean }>;
  resetPasswordWithCode: (email: string, code: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  hasSeenOnboarding: boolean;
  setHasSeenOnboarding: (val: boolean) => void;
  
  // Mandatory Onboarding Flow methods
  checkOnboardingState: () => Promise<{ onboardingCompleted: boolean; onboardingStep: number; onboardingData?: any; hasPlans?: boolean }>;
  saveOnboardingProgress: (step: number, data: any) => Promise<{ success: boolean; error?: string }>;
  completeOnboarding: (data: OnboardingData) => Promise<{ success: boolean; plan?: any; edital?: any; user?: UserProfile; error?: string }>;
  resetOnboarding: () => Promise<{ success: boolean; error?: string }>;
  updateOnboardingStep: (step: number, data?: any) => Promise<void>;
  completeUserOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "projeto_farda_auth_user_session";
const ONBOARDING_STORAGE_KEY = "projeto_farda_onboarding_done";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // User Session State: initialize to null and wait for Firebase onAuthStateChanged
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboardingState] = useState<boolean>(() => {
    return localStorage.getItem(ONBOARDING_STORAGE_KEY) === "true";
  });

  // Non-blocking Firestore profile background synchronization with smart onboarding detection
  const syncFirestoreProfile = async (uid: string, fallback: UserProfile, explicitIsNewUser?: boolean) => {
    try {
      // Lookup profile from Firestore
      const remoteProfile = await Promise.race([
        getUserProfileFromFirestore(uid),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
      ]);

      let finalProfile: UserProfile;
      if (remoteProfile) {
        let onboardingState = remoteProfile.onboarding;

        // If onboarding state is not defined yet on existing profile (legacy user)
        if (!onboardingState) {
          const isLegacy =
            remoteProfile.onboardingCompleted === true ||
            (await checkUserLegacyStatus(uid));

          onboardingState = {
            completed: isLegacy,
            currentStep: remoteProfile.onboardingStep ?? (isLegacy ? 8 : 0),
            version: 1,
            startedAt: remoteProfile.createdAt || new Date().toISOString(),
            completedAt: isLegacy ? remoteProfile.onboardingCompletedAt || remoteProfile.createdAt || new Date().toISOString() : null,
          };
        }

        finalProfile = {
          ...remoteProfile,
          name: remoteProfile.name || fallback.name,
          email: remoteProfile.email || fallback.email,
          avatarUrl: fallback.avatarUrl || remoteProfile.avatarUrl,
          lastLoginAt: new Date().toISOString(),
          role: remoteProfile.role || "aluno_vip",
          onboarding: onboardingState,
          onboardingCompleted: onboardingState.completed,
          onboardingStep: onboardingState.currentStep,
        };
      } else {
        // Brand new user without Firestore document
        const isLegacyCheck = explicitIsNewUser ? false : await checkUserLegacyStatus(uid);
        const onboardingState: UserOnboardingState = {
          completed: isLegacyCheck,
          currentStep: 0,
          version: 1,
          startedAt: new Date().toISOString(),
          completedAt: isLegacyCheck ? new Date().toISOString() : null,
        };

        finalProfile = {
          ...fallback,
          role: "aluno_vip",
          createdAt: fallback.createdAt || new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          onboarding: onboardingState,
          onboardingCompleted: onboardingState.completed,
          onboardingStep: onboardingState.currentStep,
        };
      }

      setUser(finalProfile);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(finalProfile));
      await saveUserProfileToFirestore(finalProfile);
    } catch (err) {
      console.warn("[AUTH] Aviso ao sincronizar perfil Firestore (não-bloqueante):", err);
    }
  };

  // Firebase Auth State Listener & Firestore profile hydration
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      console.log("[AUTH] Firebase Auth State:", fbUser ? "authenticated" : "unauthenticated");

      if (fbUser) {
        console.log("[AUTH] Usuário logado:", fbUser.email, "UID:", fbUser.uid);

        const email = (fbUser.email || "").toLowerCase().trim();

        // Check local storage for quick cached profile to eliminate render delay
        let initialProfile: UserProfile | null = null;
        try {
          const raw = localStorage.getItem(AUTH_STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.id === fbUser.uid) {
              initialProfile = parsed;
            }
          }
        } catch {}

        if (!initialProfile) {
          const remoteDoc = await getUserProfileFromFirestore(fbUser.uid).catch(() => null);
          let onboardingState: UserOnboardingState;

          if (remoteDoc?.onboarding) {
            onboardingState = remoteDoc.onboarding;
          } else if (remoteDoc) {
            const isLegacy =
              remoteDoc.onboardingCompleted === true ||
              (await checkUserLegacyStatus(fbUser.uid));

            onboardingState = {
              completed: isLegacy,
              currentStep: remoteDoc.onboardingStep ?? (isLegacy ? 8 : 0),
              version: 1,
              startedAt: remoteDoc.createdAt || new Date().toISOString(),
              completedAt: isLegacy ? remoteDoc.onboardingCompletedAt || remoteDoc.createdAt || new Date().toISOString() : null,
            };
          } else {
            onboardingState = {
              completed: false,
              currentStep: 0,
              version: 1,
              startedAt: new Date().toISOString(),
              completedAt: null,
            };
          }

          initialProfile = {
            id: fbUser.uid,
            name: remoteDoc?.name || fbUser.displayName || email.split("@")[0] || "Aluno",
            email,
            avatarUrl: remoteDoc?.avatarUrl || fbUser.photoURL || undefined,
            loginMethod: fbUser.providerData.some((p) => p.providerId === "google.com") ? "google" : "email",
            role: remoteDoc?.role || "aluno_vip",
            createdAt: remoteDoc?.createdAt || new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            onboarding: onboardingState,
            onboardingCompleted: onboardingState.completed,
            onboardingStep: onboardingState.currentStep,
          };
        }

        // Release application immediately without blocking
        setUser(initialProfile);
        setAuthStatus("authenticated");
        setIsLoading(false);

        console.log("[AUTH] Perfil carregado:", initialProfile.email, "Role:", initialProfile.role);

        // Background sync with Firestore
        syncFirestoreProfile(fbUser.uid, initialProfile);
      } else {
        setUser(null);
        setAuthStatus("unauthenticated");
        setIsLoading(false);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Sync User Session to LocalStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  const setHasSeenOnboarding = (val: boolean) => {
    setHasSeenOnboardingState(val);
    localStorage.setItem(ONBOARDING_STORAGE_KEY, String(val));
  };

  const isAdmin = user?.role === "admin";

  // Login with Email & Password (Firebase Auth + Firestore Profile)
  const loginWithEmail = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const cleanEmail = email.toLowerCase().trim();
      const cleanPass = pass.trim();

      if (!cleanEmail || !cleanPass) {
        setIsLoading(false);
        return { success: false, error: "Informe seu e-mail e senha cadastrados." };
      }

      console.log("[AUTH] Efetuando login por e-mail e senha...");
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
      const fbUser = cred.user;

      console.log("[AUTH] Firebase Auth State: authenticated");
      console.log("[AUTH] Usuário logado:", fbUser.email, "UID:", fbUser.uid);

      const existingDoc = await getUserProfileFromFirestore(fbUser.uid).catch(() => null);
      let onboardingState: UserOnboardingState;

      if (existingDoc?.onboarding) {
        onboardingState = existingDoc.onboarding;
      } else if (existingDoc) {
        const isLegacy =
          existingDoc.onboardingCompleted === true ||
          (await checkUserLegacyStatus(fbUser.uid));

        onboardingState = {
          completed: isLegacy,
          currentStep: existingDoc.onboardingStep ?? (isLegacy ? 8 : 0),
          version: 1,
          startedAt: existingDoc.createdAt || new Date().toISOString(),
          completedAt: isLegacy ? (existingDoc.onboardingCompletedAt || existingDoc.createdAt || new Date().toISOString()) : null,
        };
      } else {
        onboardingState = {
          completed: false,
          currentStep: 0,
          version: 1,
          startedAt: new Date().toISOString(),
          completedAt: null,
        };
      }

      const profile: UserProfile = {
        id: fbUser.uid,
        name: existingDoc?.name || fbUser.displayName || cleanEmail.split("@")[0] || "Aluno",
        email: cleanEmail,
        avatarUrl: existingDoc?.avatarUrl || fbUser.photoURL || undefined,
        loginMethod: "email",
        role: existingDoc?.role || "aluno_vip",
        createdAt: existingDoc?.createdAt || new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        onboarding: onboardingState,
        onboardingCompleted: onboardingState.completed,
        onboardingStep: onboardingState.currentStep,
      };

      // Set user and authenticated state IMMEDIATELY
      setUser(profile);
      setAuthStatus("authenticated");
      setIsLoading(false);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));

      console.log("[AUTH] Perfil carregado:", profile.email, "Role:", profile.role);

      // Background Firestore sync
      syncFirestoreProfile(fbUser.uid, profile, !existingDoc);

      return { success: true };
    } catch (fbErr: any) {
      setIsLoading(false);
      let errMsg = "Credenciais não autorizadas. Verifique seus dados de acesso.";
      if (fbErr.code === "auth/operation-not-allowed") {
        console.warn("[AUTH] Provedor de e-mail/senha desativado no Firebase Console (auth/operation-not-allowed).");
        errMsg = "O login por e-mail/senha ainda não está ativado no Firebase Console. Utilize o botão 'Entrar com Conta Google' ou ative o provedor 'E-mail/senha' no Console do Firebase (Authentication > Sign-in method).";
      } else if (
        fbErr.code === "auth/wrong-password" ||
        fbErr.code === "auth/invalid-credential" ||
        fbErr.code === "auth/user-not-found"
      ) {
        console.warn("[AUTH] Credenciais incorretas:", fbErr.code);
        errMsg = "E-mail ou senha incorretos. Verifique suas credenciais de acesso.";
      } else if (fbErr.code === "auth/too-many-requests") {
        errMsg = "Muitas tentativas sem sucesso. Aguarde alguns instantes e tente novamente.";
      } else if (fbErr.code === "auth/invalid-email") {
        errMsg = "Formato de e-mail inválido.";
      } else {
        console.error("[AUTH] Erro ao autenticar com e-mail:", fbErr);
      }
      return { success: false, error: errMsg };
    }
  };

  // Login with Google (Firebase Auth Google Popup)
  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      console.log("[AUTH] Abrindo popup de login com Google...");
      const cred = await signInWithPopup(auth, googleProvider);
      const googleUser = cred.user;

      console.log("[AUTH] Firebase Auth State: authenticated");
      console.log("[AUTH] Usuário logado:", googleUser.email, "UID:", googleUser.uid);

      const email = (googleUser.email || "").toLowerCase().trim();
      const name = googleUser.displayName || email.split("@")[0] || "Aluno Google";
      const avatarUrl = googleUser.photoURL || undefined;

      // Check existing profile in Firestore before initializing user session
      const existingDoc = await getUserProfileFromFirestore(googleUser.uid).catch(() => null);
      let onboardingState: UserOnboardingState;

      if (existingDoc?.onboarding) {
        onboardingState = existingDoc.onboarding;
      } else if (existingDoc) {
        const isLegacy =
          existingDoc.onboardingCompleted === true ||
          (await checkUserLegacyStatus(googleUser.uid));

        onboardingState = {
          completed: isLegacy,
          currentStep: existingDoc.onboardingStep ?? (isLegacy ? 8 : 0),
          version: 1,
          startedAt: existingDoc.createdAt || new Date().toISOString(),
          completedAt: isLegacy ? (existingDoc.onboardingCompletedAt || existingDoc.createdAt || new Date().toISOString()) : null,
        };
      } else {
        // First access Google user!
        onboardingState = {
          completed: false,
          currentStep: 0,
          version: 1,
          startedAt: new Date().toISOString(),
          completedAt: null,
        };
      }

      const profile: UserProfile = {
        id: googleUser.uid,
        name,
        email,
        avatarUrl,
        loginMethod: "google",
        role: existingDoc?.role || "aluno_vip",
        createdAt: existingDoc?.createdAt || new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        onboarding: onboardingState,
        onboardingCompleted: onboardingState.completed,
        onboardingStep: onboardingState.currentStep,
      };

      // Set user and authenticated state IMMEDIATELY
      setUser(profile);
      setAuthStatus("authenticated");
      setIsLoading(false);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));

      console.log("[AUTH] Perfil carregado:", profile.email, "Role:", profile.role);

      // Background Firestore sync
      syncFirestoreProfile(googleUser.uid, profile, !existingDoc);

      return { success: true };
    } catch (fbErr: any) {
      setIsLoading(false);
      const isUnauthorizedDomain =
        fbErr?.code === "auth/unauthorized-domain" ||
        (typeof fbErr?.message === "string" && fbErr.message.includes("unauthorized-domain"));

      if (isUnauthorizedDomain) {
        const currentHost = typeof window !== "undefined" ? window.location.hostname : "";
        console.warn(
          `[AUTH] O domínio "${currentHost}" não está na lista de domínios autorizados do Firebase Console (Authentication > Settings > Authorized domains).`
        );
        return {
          success: false,
          code: "auth/unauthorized-domain",
          domain: currentHost,
          error: `O domínio "${currentHost}" não está na lista de domínios autorizados do Firebase Console. Adicione "${currentHost}" (ou "run.app") em Firebase > Authentication > Settings > Authorized domains.`,
        };
      }

      console.warn("[AUTH] Erro na autenticação com Google:", fbErr?.code || fbErr?.message || fbErr);
      let msg = "Erro na autenticação com o Google.";
      if (fbErr?.code === "auth/popup-closed-by-user") {
        msg = "Janela de autenticação fechada antes da conclusão.";
      } else if (fbErr?.code === "auth/cancelled-popup-request") {
        msg = "Solicitação cancelada. Tente novamente.";
      } else if (fbErr?.code === "auth/popup-blocked") {
        msg = "O popup de login foi bloqueado pelo seu navegador. Permita popups para este site.";
      } else if (fbErr?.message) {
        msg = fbErr.message;
      }
      return { success: false, error: msg, code: fbErr?.code };
    }
  };

  // Sign up (Cadastro) with Firebase Auth & Firestore
  const signupWithEmail = async (
    name: string,
    email: string,
    pass: string
  ) => {
    setIsLoading(true);
    try {
      const cleanEmail = email.toLowerCase().trim();
      const cleanName = name.trim();
      const cleanPass = pass.trim();

      if (!cleanName || !cleanEmail || !cleanPass) {
        setIsLoading(false);
        return { success: false, error: "Preencha todos os campos obrigatórios." };
      }

      if (cleanPass.length < 6) {
        setIsLoading(false);
        return { success: false, error: "A senha deve ter pelo menos 6 caracteres." };
      }

      console.log("[AUTH] Registrando novo usuário no Firebase Auth...");
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
      await updateFirebaseProfile(cred.user, { displayName: cleanName }).catch(() => {});

      console.log("[AUTH] Firebase Auth State: authenticated");
      console.log("[AUTH] Usuário logado:", cred.user.email, "UID:", cred.user.uid);

      const newOnboarding: UserOnboardingState = {
        completed: false,
        currentStep: 0,
        version: 1,
        startedAt: new Date().toISOString(),
        completedAt: null,
      };

      const newProfile: UserProfile = {
        id: cred.user.uid,
        name: cleanName,
        email: cleanEmail,
        loginMethod: "email",
        role: "aluno_vip",
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        onboarding: newOnboarding,
        onboardingCompleted: false,
        onboardingStep: 0,
      };

      // Set user and authenticated state IMMEDIATELY
      setUser(newProfile);
      setAuthStatus("authenticated");
      setIsLoading(false);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newProfile));

      console.log("[AUTH] Perfil carregado:", newProfile.email, "Role:", newProfile.role);

      // Background Firestore sync with explicit isNewUser = true
      syncFirestoreProfile(cred.user.uid, newProfile, true);

      return {
        success: true,
        message: "Cadastro realizado com sucesso!",
      };
    } catch (authErr: any) {
      setIsLoading(false);
      let msg = "Erro ao realizar cadastro.";
      if (authErr.code === "auth/operation-not-allowed") {
        console.warn("[AUTH] Cadastro por e-mail/senha desativado no Firebase Console (auth/operation-not-allowed).");
        msg = "O cadastro por e-mail e senha está desativado no Firebase. Utilize o botão 'Entrar com Conta Google' ou ative o provedor 'E-mail/senha' no Firebase Console (Authentication > Sign-in method).";
      } else if (authErr.code === "auth/email-already-in-use") {
        msg = "Este e-mail já está cadastrado. Faça login ou recupere sua senha.";
      } else if (authErr.code === "auth/weak-password") {
        msg = "A senha deve ter pelo menos 6 caracteres.";
      } else if (authErr.code === "auth/invalid-email") {
        msg = "Endereço de e-mail inválido.";
      } else if (authErr.message) {
        msg = authErr.message;
      } else {
        console.error("[AUTH] Erro ao cadastrar:", authErr);
      }
      return { success: false, error: msg };
    }
  };

  // Password Recovery via Firebase Auth
  const requestPasswordReset = async (email: string) => {
    setIsLoading(true);
    try {
      const cleanEmail = email.toLowerCase().trim();
      if (!cleanEmail) {
        return { success: false, error: "Informe o e-mail cadastrado." };
      }

      try {
        await sendPasswordResetEmail(auth, cleanEmail);
        return { success: true, emailDispatched: true };
      } catch (fbErr: any) {
        let msg = "Não foi possível enviar o e-mail de recuperação.";
        if (fbErr.code === "auth/operation-not-allowed") {
          msg = "O envio de e-mails para este provedor está desativado no Firebase Console. Ative o provedor 'E-mail/senha' no Console.";
        } else if (fbErr.code === "auth/invalid-email") {
          msg = "Formato de e-mail inválido.";
        } else if (fbErr.code === "auth/user-not-found") {
          msg = "Nenhum usuário cadastrado com este e-mail.";
        } else if (fbErr.code === "auth/too-many-requests") {
          msg = "Muitas tentativas consecutivas. Aguarde alguns instantes e tente novamente.";
        }
        return { success: false, error: msg };
      }
    } catch (e: any) {
      return { success: false, error: e.message || "Erro ao solicitar recuperação de senha." };
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = requestPasswordReset;

  // Complete Password Reset with 6-digit Code
  const resetPasswordWithCode = async (email: string, code: string, newPass: string) => {
    setIsLoading(true);
    try {
      const cleanEmail = email.toLowerCase().trim();
      const cleanCode = code.trim();
      const cleanPass = newPass.trim();

      if (!cleanEmail || !cleanCode || !cleanPass) {
        return { success: false, error: "Preencha todos os campos." };
      }

      if (cleanPass.length < 6) {
        return { success: false, error: "A nova senha deve ter pelo menos 6 caracteres." };
      }

      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          code: cleanCode,
          newPassword: cleanPass,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || "Código de recuperação inválido ou expirado.",
        };
      }

      return { success: true };
    } catch (e: any) {
      return {
        success: false,
        error: e.message || "Erro ao atualizar senha no servidor.",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("SignOut warning:", e);
    }
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return { success: false, error: "Usuário não autenticado." };
    const { role: _ignoredRole, ...safeData } = data;
    const updated = { ...user, ...safeData };
    setUser(updated);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));

    // Save to Firestore
    try {
      await saveUserProfileToFirestore(updated);
    } catch (fsErr) {
      console.warn("[AUTH] Aviso ao salvar perfil no Firestore:", fsErr);
    }

    return { success: true };
  };

  // Onboarding Flow Helpers - Direct Firestore persistence for static Firebase Hosting SPA
  const updateOnboardingStep = async (step: number, data?: any): Promise<void> => {
    if (!user) return;
    const currentOnboarding: UserOnboardingState = user.onboarding || {
      completed: false,
      currentStep: 0,
      version: 1,
      startedAt: new Date().toISOString(),
      completedAt: null,
    };
    const rawDraft = data !== undefined ? data : (currentOnboarding.draft || user.onboardingData || null);
    const resolvedDraft = rawDraft !== null && rawDraft !== undefined ? sanitizeFirestorePayload(rawDraft) : null;
    const updatedOnboarding: UserOnboardingState = {
      ...currentOnboarding,
      completed: false,
      currentStep: step,
      completedAt: null,
      draft: resolvedDraft,
    };
    const updatedUser: UserProfile = {
      ...user,
      onboarding: updatedOnboarding,
      onboardingCompleted: false,
      onboardingStep: step,
      onboardingData: resolvedDraft,
    };
    setUser(updatedUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
    await saveUserOnboardingState(user.id, updatedOnboarding, resolvedDraft);
  };

  const completeUserOnboarding = async (): Promise<void> => {
    if (!user) return;
    const now = new Date().toISOString();
    const currentOnboarding: UserOnboardingState = user.onboarding || {
      completed: false,
      currentStep: 0,
      version: 1,
      startedAt: now,
      completedAt: null,
    };
    const updatedOnboarding: UserOnboardingState = {
      ...currentOnboarding,
      completed: true,
      completedAt: now,
    };
    const updatedUser: UserProfile = {
      ...user,
      onboarding: updatedOnboarding,
      onboardingCompleted: true,
      onboardingCompletedAt: now,
    };
    setUser(updatedUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
    await saveUserOnboardingState(user.id, updatedOnboarding);
  };

  const checkOnboardingState = async (): Promise<{
    onboardingCompleted: boolean;
    onboardingStep: number;
    onboardingData?: any;
    hasPlans?: boolean;
  }> => {
    if (!user) {
      return { onboardingCompleted: false, onboardingStep: 0 };
    }
    const remote = await getUserProfileFromFirestore(user.id).catch(() => null);
    if (remote?.onboarding) {
      return {
        onboardingCompleted: remote.onboarding.completed,
        onboardingStep: remote.onboarding.currentStep,
        onboardingData: remote.onboardingData,
      };
    }
    return {
      onboardingCompleted: Boolean(user.onboarding?.completed ?? user.onboardingCompleted),
      onboardingStep: user.onboarding?.currentStep ?? user.onboardingStep ?? 0,
      onboardingData: user.onboardingData,
    };
  };

  const saveOnboardingProgress = async (step: number, onboardingData: any): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "Usuário não autenticado." };
    try {
      await updateOnboardingStep(step, onboardingData);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Erro ao salvar progresso do onboarding." };
    }
  };

  const completeOnboarding = async (onboardingData: OnboardingData): Promise<{
    success: boolean;
    plan?: any;
    edital?: any;
    user?: UserProfile;
    error?: string;
  }> => {
    if (!user) return { success: false, error: "Usuário não autenticado." };
    setIsLoading(true);
    try {
      await completeUserOnboarding();
      return {
        success: true,
        user,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const resetOnboarding = async (): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "Usuário não autenticado." };
    try {
      const resetState: UserOnboardingState = {
        completed: false,
        currentStep: 0,
        version: 1,
        startedAt: new Date().toISOString(),
        completedAt: null,
      };
      const updatedUser: UserProfile = {
        ...user,
        onboarding: resetState,
        onboardingCompleted: false,
        onboardingStep: 0,
        onboardingData: null,
      };
      setUser(updatedUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
      await saveUserOnboardingState(user.id, resetState, null);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Erro ao reiniciar onboarding." };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        authStatus,
        user,
        isAuthenticated: !!user && authStatus !== "unauthenticated",
        isAdmin,
        isLoading,
        loginWithEmail,
        loginWithGoogle,
        signupWithEmail,
        resetPassword,
        requestPasswordReset,
        resetPasswordWithCode,
        logout,
        updateProfile,
        hasSeenOnboarding,
        setHasSeenOnboarding,
        checkOnboardingState,
        saveOnboardingProgress,
        completeOnboarding,
        resetOnboarding,
        updateOnboardingStep,
        completeUserOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};
