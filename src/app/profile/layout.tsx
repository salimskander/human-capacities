import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mon profil',
  description: 'Consultez vos performances, votre rang mondial et gérez votre profil sur Human Capacities.',
  robots: { index: false, follow: false },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
