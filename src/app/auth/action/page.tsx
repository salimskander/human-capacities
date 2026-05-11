"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  verifyPasswordResetCode,
  confirmPasswordReset,
  applyActionCode,
  getAuth,
} from "firebase/auth";
import { app } from "@/firebase";

type Mode = "resetPassword" | "verifyEmail" | "unknown";
type Status = "loading" | "ready" | "success" | "error";

function ActionHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const mode = (searchParams.get("mode") ?? "unknown") as Mode;
  const oobCode = searchParams.get("oobCode") ?? "";

  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!oobCode) {
      setStatus("error");
      setErrorMsg("Lien invalide ou expiré.");
      return;
    }

    const auth = getAuth(app);

    if (mode === "resetPassword") {
      verifyPasswordResetCode(auth, oobCode)
        .then((resolvedEmail) => {
          setEmail(resolvedEmail);
          setStatus("ready");
        })
        .catch(() => {
          setStatus("error");
          setErrorMsg("Ce lien de réinitialisation est invalide ou a expiré.");
        });
    } else if (mode === "verifyEmail") {
      applyActionCode(auth, oobCode)
        .then(() => setStatus("success"))
        .catch(() => {
          setStatus("error");
          setErrorMsg("Ce lien de vérification est invalide ou a déjà été utilisé.");
        });
    } else {
      setStatus("error");
      setErrorMsg("Action inconnue.");
    }
  }, [mode, oobCode]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setErrorMsg("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (password !== confirm) {
      setErrorMsg("Les mots de passe ne correspondent pas.");
      return;
    }
    setSubmitting(true);
    setErrorMsg("");
    try {
      const auth = getAuth(app);
      await confirmPasswordReset(auth, oobCode, password);
      setStatus("success");
    } catch {
      setErrorMsg("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 space-y-6">
        <Link href="/" className="block text-center text-xl font-bold text-gray-900 dark:text-white">
          Human Capacities
        </Link>

        {status === "loading" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Vérification en cours…</p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Lien invalide</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{errorMsg}</p>
            </div>
            <Link
              href="/login"
              className="w-full py-2.5 text-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors"
            >
              Retour à la connexion
            </Link>
          </div>
        )}

        {status === "ready" && mode === "resetPassword" && (
          <form onSubmit={handleReset} className="space-y-5">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Nouveau mot de passe</h2>
              {email && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Pour <span className="font-medium text-gray-700 dark:text-gray-300">{email}</span>
                </p>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 caractères"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Répétez le mot de passe"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {errorMsg && (
              <p className="text-sm text-red-500 text-center">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-sm transition-colors"
            >
              {submitting ? "Enregistrement…" : "Enregistrer le mot de passe"}
            </button>
          </form>
        )}

        {status === "success" && mode === "resetPassword" && (
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Mot de passe mis à jour</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Votre mot de passe a été changé avec succès.
              </p>
            </div>
            <Link
              href="/login"
              className="w-full py-2.5 text-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors"
            >
              Se connecter
            </Link>
          </div>
        )}

        {status === "success" && mode === "verifyEmail" && (
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Email vérifié</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Votre adresse email a été vérifiée avec succès.
              </p>
            </div>
            <Link
              href="/"
              className="w-full py-2.5 text-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors"
            >
              Retour à l&apos;accueil
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthActionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ActionHandler />
    </Suspense>
  );
}
