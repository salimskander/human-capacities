'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { sendEmailVerification, updateProfile } from 'firebase/auth';
import { auth, resetPassword, updateDisplayName } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'too_short';

export default function UserProfileHeader() {
  const { currentUser } = useAuth();

  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);

  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [verifyMsg, setVerifyMsg] = useState<string | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);

  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const [usernameFeedback, setUsernameFeedback] = useState<string | null>(null);
  const [usernameSaving, setUsernameSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkAvailability = useCallback((value: string, currentDisplayName: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = value.trim();
    if (trimmed === currentDisplayName.trim()) { setUsernameStatus('idle'); return; }
    if (trimmed.length === 0) { setUsernameStatus('idle'); return; }
    if (trimmed.length < 5) { setUsernameStatus('too_short'); return; }
    setUsernameStatus('checking');
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/user/profile?check=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        setUsernameStatus(data.available ? 'available' : 'taken');
      } catch {
        setUsernameStatus('idle');
      }
    }, 500);
  }, []);

  if (!currentUser) return null;

  const initial = (currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase();

  const handleSavePhoto = async () => {
    const url = photoUrlInput.trim();
    if (!url) return;
    setPhotoLoading(true);
    setPhotoError(null);
    try {
      if (!auth?.currentUser) throw new Error();
      await updateProfile(auth.currentUser, { photoURL: url });
      setPhotoModalOpen(false);
      setPhotoUrlInput('');
    } catch {
      setPhotoError('URL invalide ou inaccessible.');
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleRemovePhoto = async () => {
    setPhotoLoading(true);
    setPhotoError(null);
    try {
      if (!auth?.currentUser) throw new Error();
      await updateProfile(auth.currentUser, { photoURL: '' });
      setPhotoModalOpen(false);
    } catch {
      setPhotoError('Impossible de supprimer la photo.');
    } finally {
      setPhotoLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!currentUser.email) return;
    setPasswordLoading(true);
    setPasswordMsg(null);
    try {
      await resetPassword(currentUser.email);
      setPasswordMsg('Email envoyé ! Vérifiez votre boîte mail.');
    } catch {
      setPasswordMsg("Impossible d'envoyer l'email.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    setVerifyLoading(true);
    setVerifyMsg(null);
    try {
      if (!auth?.currentUser) throw new Error();
      await sendEmailVerification(auth.currentUser);
      setVerifyMsg('Email envoyé ! Vérifiez votre boîte mail.');
    } catch {
      setVerifyMsg("Impossible d'envoyer l'email de vérification.");
    } finally {
      setVerifyLoading(false);
    }
  };

  const openUsernameEdit = () => {
    setUsernameInput(currentUser.displayName || '');
    setUsernameStatus('idle');
    setUsernameFeedback(null);
    setEditingUsername(true);
  };

  const cancelUsernameEdit = () => {
    setEditingUsername(false);
    setUsernameStatus('idle');
    setUsernameFeedback(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  };

  const handleSaveUsername = async () => {
    const value = usernameInput.trim();
    if (value.length < 5) {
      setUsernameFeedback('Minimum 5 caractères.');
      return;
    }
    if (usernameStatus === 'taken') {
      setUsernameFeedback('Ce pseudo est déjà utilisé.');
      return;
    }
    setUsernameSaving(true);
    setUsernameFeedback(null);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebaseUid: currentUser.uid, username: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUsernameFeedback(data.error === 'USERNAME_TAKEN' ? 'Ce pseudo est déjà utilisé.' : (data.error || 'Erreur.'));
        if (data.error === 'USERNAME_TAKEN') setUsernameStatus('taken');
        return;
      }
      await updateDisplayName(value);
      setEditingUsername(false);
      setUsernameFeedback(null);
    } catch {
      setUsernameFeedback('Impossible de sauvegarder.');
    } finally {
      setUsernameSaving(false);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-3xl font-semibold text-white">
              {currentUser.photoURL ? (
                <Image src={currentUser.photoURL} alt="Photo de profil" width={96} height={96} className="w-full h-full object-cover" unoptimized />
              ) : initial}
            </div>
            <button
              onClick={() => { setPhotoModalOpen(true); setPhotoUrlInput(currentUser.photoURL || ''); setPhotoError(null); }}
              className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
              title="Changer la photo"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>

          {/* Infos + actions */}
          <div className="flex-1 w-full">

            {/* Pseudo avec édition inline */}
            {editingUsername ? (
              <div className="mb-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 max-w-xs">
                    <input
                      autoFocus
                      type="text"
                      value={usernameInput}
                      onChange={(e) => {
                        setUsernameInput(e.target.value);
                        setUsernameFeedback(null);
                        checkAvailability(e.target.value, currentUser.displayName || '');
                      }}
                      maxLength={32}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSaveUsername(); if (e.key === 'Escape') cancelUsernameEdit(); }}
                      className={`w-full px-3 py-1.5 text-xl font-bold border-2 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none pr-8 ${
                        usernameStatus === 'taken' || usernameStatus === 'too_short'
                          ? 'border-red-400'
                          : usernameStatus === 'available'
                          ? 'border-green-400'
                          : 'border-blue-400'
                      }`}
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sm">
                      {usernameStatus === 'checking' && <span className="text-gray-400">…</span>}
                      {usernameStatus === 'available' && <span className="text-green-500">✓</span>}
                      {(usernameStatus === 'taken' || usernameStatus === 'too_short') && <span className="text-red-500">✗</span>}
                    </span>
                  </div>
                  <button
                    onClick={handleSaveUsername}
                    disabled={usernameSaving || usernameStatus === 'taken' || usernameStatus === 'too_short' || usernameStatus === 'checking'}
                    className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                  >
                    {usernameSaving ? '…' : 'OK'}
                  </button>
                  <button onClick={cancelUsernameEdit} className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    Annuler
                  </button>
                </div>
                {usernameStatus === 'too_short' && <p className="text-xs text-red-500 mt-1">Minimum 5 caractères.</p>}
                {usernameStatus === 'taken' && <p className="text-xs text-red-500 mt-1">Ce pseudo est déjà utilisé.</p>}
                {usernameStatus === 'available' && <p className="text-xs text-green-500 mt-1">Pseudo disponible.</p>}
                {usernameFeedback && <p className="text-xs text-red-500 mt-1">{usernameFeedback}</p>}
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-2xl font-bold dark:text-white text-center md:text-left">
                  {currentUser.displayName || 'Utilisateur'}
                </h1>
                <button
                  onClick={openUsernameEdit}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  title="Modifier le pseudo"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
            )}

            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 text-center md:text-left">{currentUser.email}</p>

            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {currentUser.emailVerified ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Email vérifié
                </span>
              ) : (
                <div className="flex flex-col items-start gap-1">
                  <button
                    onClick={handleVerifyEmail}
                    disabled={verifyLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/60 rounded-full text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {verifyLoading ? 'Envoi…' : 'Vérifier mon email'}
                  </button>
                  {verifyMsg && <p className="text-xs text-green-600 dark:text-green-400">{verifyMsg}</p>}
                </div>
              )}

              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                Membre depuis {new Date(currentUser.metadata.creationTime || Date.now()).toLocaleDateString('fr-FR')}
              </span>

              <div className="flex flex-col items-start gap-1">
                <button
                  onClick={handlePasswordReset}
                  disabled={passwordLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full text-xs font-medium transition-colors disabled:opacity-50"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  {passwordLoading ? 'Envoi…' : 'Changer le mot de passe'}
                </button>
                {passwordMsg && <p className="text-xs text-green-600 dark:text-green-400">{passwordMsg}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal photo */}
      {photoModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Photo de profil</h3>
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-2xl font-semibold text-white">
                {photoUrlInput ? (
                  <Image src={photoUrlInput} alt="Aperçu" width={80} height={80} className="w-full h-full object-cover" unoptimized />
                ) : initial}
              </div>
            </div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL de l&apos;image</label>
            <input
              type="url"
              value={photoUrlInput}
              onChange={(e) => setPhotoUrlInput(e.target.value)}
              placeholder="https://exemple.com/photo.jpg"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            />
            {photoError && <p className="text-xs text-red-500 mb-2">{photoError}</p>}
            <div className="flex gap-2 mt-4">
              {currentUser.photoURL && (
                <button onClick={handleRemovePhoto} disabled={photoLoading} className="flex-1 px-3 py-2 text-sm border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50">
                  Supprimer
                </button>
              )}
              <button onClick={() => { setPhotoModalOpen(false); setPhotoError(null); }} className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                Annuler
              </button>
              <button onClick={handleSavePhoto} disabled={!photoUrlInput.trim() || photoLoading} className="flex-1 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50">
                {photoLoading ? 'Sauvegarde…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
