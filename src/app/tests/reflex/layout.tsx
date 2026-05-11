import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Test de Réflexes',
  description: 'Mesurez votre temps de réaction avec le test de réflexes. Attendez le signal vert et cliquez aussi vite que possible.',
};

export default function ReflexLayout({ children }: { children: React.ReactNode }) {
  return children;
}
