import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Test du Chimpanzé',
  description: 'Les chimpanzés surpassent les humains dans ce test de mémoire de travail. Mémorisez la position des chiffres et cliquez dans l\'ordre croissant.',
};

export default function ChimpTestLayout({ children }: { children: React.ReactNode }) {
  return children;
}
