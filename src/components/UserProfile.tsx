import { useAuth } from '../contexts/AuthContext';
import { logoutUser } from '../firebase';

export default function UserProfile() {
  const { currentUser, userLoading } = useAuth();

  if (userLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
        <p className="dark:text-gray-200">Vous n&apos;êtes pas connecté</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full">
      <div className="flex flex-col items-center mb-6">
        <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4 text-3xl font-semibold text-blue-600 dark:text-blue-300">
          {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : currentUser.email?.charAt(0).toUpperCase()}
        </div>
        <h2 className="text-2xl font-bold mb-1 dark:text-white">
          {currentUser.displayName || "Utilisateur"}
        </h2>
        <p className="text-gray-500 dark:text-gray-400">{currentUser.email}</p>
      </div>
      
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
        <h3 className="text-lg font-medium mb-3 dark:text-white">Informations du compte</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Pseudo</span>
            <span className="dark:text-white font-medium">{currentUser.displayName || "Non défini"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Email</span>
            <span className="dark:text-white font-medium">{currentUser.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Email vérifié</span>
            <span className="dark:text-white font-medium">{currentUser.emailVerified ? "Oui" : "Non"}</span>
          </div>
        </div>
      </div>
      
      <button
        onClick={() => logoutUser()}
        className="w-full p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        Déconnexion
      </button>
    </div>
  );
} 