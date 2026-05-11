import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inscription',
  description: 'Créez un compte gratuit sur Human Capacities pour sauvegarder vos scores, suivre votre progression et vous mesurer aux joueurs du monde entier.',
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
