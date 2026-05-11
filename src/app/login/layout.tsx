import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connexion',
  description: 'Connectez-vous à Human Capacities pour suivre vos scores, voir votre progression et apparaître dans le classement mondial.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
