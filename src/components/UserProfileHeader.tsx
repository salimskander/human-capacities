import { User } from 'firebase/auth';
import { logoutUser } from '../firebase';

interface UserProfileHeaderProps {
  user: User;
}

export default function UserProfileHeader({ user }: UserProfileHeaderProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-3xl font-semibold text-white">
          {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
        </div>
        
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-1 dark:text-white text-center md:text-left">
            {user.displayName || "Utilisateur"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-4 text-center md:text-left">{user.email}</p>
          
          <div className="flex flex-wrap gap-3 justify-center md:justify-start">
            <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
              {user.emailVerified ? "Email vérifié ✓" : "Email non vérifié"}
            </div>
            
            <div className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm">
              Membre depuis {new Date(user.metadata.creationTime || Date.now()).toLocaleDateString()}
            </div>
          </div>
        </div>
        
        <button
          onClick={() => logoutUser()}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Déconnexion
        </button>
      </div>
    </div>
  );
} 