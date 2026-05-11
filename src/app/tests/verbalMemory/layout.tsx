import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mémoire Verbale',
  description: 'Testez votre mémoire verbale. Reconnaissez les mots déjà vus et évitez les nouveaux. Jusqu\'où irez-vous ?',
};

export default function VerbalMemoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
