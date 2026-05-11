import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vitesse de Frappe',
  description: 'Testez votre vitesse de frappe en mots par minute (WPM). 60 secondes pour taper le maximum de mots avec précision.',
};

export default function TypingSpeedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
