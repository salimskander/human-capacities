import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mémoire des Symboles',
  description: 'Retrouvez toutes les paires de symboles cachés. Testez votre mémoire spatiale et battez votre record de niveaux.',
};

export default function SymbolMemoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
