import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Human Capacities',
    default: 'Tests cognitifs | Human Capacities',
  },
  description: 'Testez vos capacités cognitives : réflexes, mémoire visuelle, mémoire verbale, vitesse de frappe et bien plus encore.',
};

export default function TestsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
