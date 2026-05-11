import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mémoire Visuelle',
  description: 'Évaluez votre mémoire visuelle. Mémorisez les tuiles illuminées et reproduisez la séquence pour passer au niveau suivant.',
};

export default function VisualMemoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
