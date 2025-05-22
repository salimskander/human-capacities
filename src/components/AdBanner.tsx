'use client'
import { useEffect, useRef } from 'react'

interface AdBannerProps {
  slot: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  style?: React.CSSProperties;
  className?: string;
  layoutKey?: string | null;
  isFluid?: boolean;
}

export default function AdBanner({ 
  slot, 
  format = 'auto', 
  style, 
  className = '',
  layoutKey = null,
  isFluid = false
}: AdBannerProps) {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      // Vérifiez si window et adsbygoogle existent (client-side seulement)
      if (typeof window !== 'undefined' && adRef.current) {
        // Attendez que AdSense soit chargé
        const interval = setInterval(() => {
          if (window.adsbygoogle) {
            clearInterval(interval);
            
            // Insérez l'annonce
            (window.adsbygoogle = window.adsbygoogle || []).push({});
          }
        }, 300);
        
        // Nettoyage
        return () => {
          clearInterval(interval);
        };
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'annonce:', error);
    }
  }, []);

  let formatClasses = '';
  
  if (!isFluid) {
    switch(format) {
      case 'rectangle':
        formatClasses = 'min-h-[250px] min-w-[300px]';
        break;
      case 'horizontal':
        formatClasses = 'min-h-[90px] min-w-[728px] max-w-full';
        break;
      case 'vertical':
        formatClasses = 'min-h-[600px] min-w-[160px]';
        break;
      default:
        formatClasses = 'min-h-[100px]';
    }
  }

  return (
    <div 
      ref={adRef}
      className={`overflow-hidden ${formatClasses} ${className}`}
      style={style}
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-8659475682678440"
        data-ad-slot={slot}
        data-ad-format={isFluid ? "fluid" : format === 'auto' ? 'auto' : ''}
        data-full-width-responsive="true"
        {...(layoutKey && { 'data-ad-layout-key': layoutKey })}
      />
    </div>
  );
}

// Ajoutez cette déclaration pour TypeScript
declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
} 