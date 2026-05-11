import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mémoire de Séquence',
  description: 'Reproduisez des séquences de plus en plus longues dans le bon ordre. Un test classique pour évaluer votre mémoire de travail.',
};

export default function SequenceMemoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
