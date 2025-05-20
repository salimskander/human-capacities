"use client";

// Import des fonctions nécessaires depuis les SDK Firebase
import { initializeApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User,
  Auth,
  updateProfile
} from "firebase/auth";

// Configuration de votre application Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCzgaO3LefyylT0GehwBas6rKUPDDinj_Q",
  authDomain: "human-capacities.firebaseapp.com",
  projectId: "human-capacities",
  storageBucket: "human-capacities.firebasestorage.app",
  messagingSenderId: "158311462966",
  appId: "1:158311462966:web:968a678ffce4498a5f8097",
  measurementId: "G-N2QSX9EG3M"
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);

// Initialisation des services
// Vérification que nous sommes dans un environnement navigateur
let analytics: Analytics | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
  auth = getAuth(app);
  // Fournisseur d'authentification Google
  googleProvider = new GoogleAuthProvider();
}

// Fonctions d'authentification
export const createUserAccount = async (email: string, password: string, pseudo: string) => {
  if (!auth) return null;
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Mise à jour du profil utilisateur pour inclure le pseudo
    if (userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName: pseudo
      });
    }
    
    return userCredential;
  } catch (error: any) {
    console.error("Erreur lors de la création du compte :", error);
    throw error;
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  if (!auth) return null;
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error("Erreur lors de la connexion :", error);
    throw error;
  }
};

export const signInWithGoogle = async () => {
  if (!auth || !googleProvider) return null;
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error("Erreur lors de la connexion avec Google :", error);
    throw error;
  }
};

export const logoutUser = async () => {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Erreur lors de la déconnexion :", error);
    throw error;
  }
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
};

// Export des instances Firebase
export { app, auth, analytics };