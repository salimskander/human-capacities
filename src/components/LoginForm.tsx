"use client";

import { useState } from 'react';
import { signInWithEmail, signInWithGoogle } from '../firebase';
import Link from 'next/link';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      await signInWithEmail(email, password);
      // Redirection gérée par le composant parent
    } catch (err) {
      const error = err as { code?: string; message?: string };
      console.error("Erreur de connexion:", error.code, error.message);
      
      if (error.code === 'auth/invalid-credential') {
        setError("Email ou mot de passe incorrect. Veuillez réessayer.");
      } else if (error.code === 'auth/user-not-found') {
        setError("Aucun compte n'existe avec cet email. Veuillez vous inscrire.");
      } else if (error.code === 'auth/wrong-password') {
        setError("Mot de passe incorrect. Veuillez réessayer.");
      } else if (error.code === 'auth/too-many-requests') {
        setError("Trop de tentatives incorrectes. Veuillez réessayer plus tard.");
      } else if (error.code === 'auth/user-disabled') {
        setError("Ce compte a été désactivé. Veuillez contacter le support.");
      } else {
        setError(error.message || "Une erreur est survenue lors de la connexion");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    
    try {
      await signInWithGoogle();
      // Redirection gérée par le composant parent
    } catch (err) {
      const error = err as { code?: string; message?: string };
      console.error("Erreur de connexion Google:", error.code, error.message);
      
      if (error.code === 'auth/popup-closed-by-user') {
        setError("La fenêtre de connexion a été fermée. Veuillez réessayer.");
      } else if (error.code === 'auth/popup-blocked') {
        setError("La fenêtre pop-up a été bloquée par votre navigateur. Veuillez autoriser les pop-ups pour ce site.");
      } else {
        setError(error.message || "Une erreur est survenue lors de la connexion avec Google");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-center dark:text-white">Connexion</h2>
      
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 mt-1 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-3 mt-1 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full p-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">ou</span>
        </div>
      </div>
      
      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full p-3 flex items-center justify-center bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
      >
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"
          />
        </svg>
        Se connecter avec Google
      </button>
      
      <div className="text-sm text-center">
        <p className="text-gray-500 dark:text-gray-400">
          Nouvel utilisateur ? <Link href="/signup" className="text-blue-600 hover:underline dark:text-blue-400">Créer un compte</Link>
        </p>
      </div>
    </div>
  );
} 