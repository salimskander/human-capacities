import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Classement mondial',
  description: 'Découvrez les meilleurs joueurs du monde sur Human Capacities. Comparez vos scores en réflexes, mémoire et vitesse de frappe avec la communauté.',
  openGraph: {
    title: 'Classement mondial | Human Capacities',
    description: 'Découvrez les meilleurs joueurs du monde et comparez vos performances cognitives.',
  },
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
