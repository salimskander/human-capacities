import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mémoire des Chiffres',
  description: 'Testez votre mémoire des chiffres. Mémorisez des séquences de plus en plus longues et battez votre record.',
};

export default function NumberMemoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
