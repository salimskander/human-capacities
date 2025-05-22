'use client'
import { useEffect, useRef } from 'react'

export default function AdenseBasic() {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.adsbygoogle && adRef.current) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (error) {
        console.error("Erreur d'initialisation de l'annonce:", error);
      }
    }
  }, []);

  return (
    <div ref={adRef}>
      <ins 
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-8659475682678440"
        data-ad-slot="9781210531"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
} 