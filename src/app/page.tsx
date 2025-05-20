"use client";

import TestCard from "@/components/TestCard";
import { useRef } from "react";
import AdBanner from '@/components/AdBanner';

const capacityTests = [
  {
    title: "Test de Réflexes",
    description: "Mesurez votre temps de réaction à des stimuli visuels",
    image: "/zap.svg",
    link: "/tests/reflex",
    rules: "Attendez que l'écran devienne vert, puis cliquez le plus rapidement possible. Attention à ne pas cliquer trop tôt !"
  },
  {
    title: "Mémoire des Chiffres",
    description: "Testez votre capacité à mémoriser des séquences de chiffres",
    image: "/number.svg",
    link: "/tests/numberMemory",
    rules: "Mémorisez les chiffres qui apparaissent à l'écran. À chaque niveau réussi, vous devrez mémoriser un chiffre supplémentaire."
  },
  {
    title: "Mémoire Visuelle",
    description: "Évaluez votre mémoire visuelle",
    image: "/visual.svg",
    link: "/tests/visualMemory",
    rules: "Des tuiles vont s'illuminer brièvement à l'écran. Reproduisez la séquence pour passer au niveau suivant."
  },
  {
    title: "Mémoire Verbale",
    description: "Testez votre capacité à reconnaître des mots déjà vus",
    image: "/word.svg",
    link: "/tests/verbalMemory",
    rules: "Des mots vont apparaître un par un. Si vous avez déjà vu le mot, cliquez sur 'VU'. Si c'est la première fois, cliquez sur 'NOUVEAU'."
  },
  {
    title: "Test du Chimpanzé",
    description: "Défiez les chimpanzés dans ce test de mémoire de travail",
    image: "/chimp.svg",
    link: "/tests/chimpTest",
    rules: "Les chimpanzés surpassent systématiquement les humains dans ce test. Mémorisez la position des chiffres puis cliquez dessus dans l'ordre croissant."
  },
  {
    title: "Mémoire des Symboles",
    description: "Retrouvez les paires de symboles cachés",
    image: "/cards.svg",
    link: "/tests/symbolMemory",
    rules: "Mémorisez la position des paires de symboles. Retrouvez toutes les paires pour passer au niveau suivant."
  },
  {
    title: "Mémoire de Séquence",
    description: "Reproduisez la séquence dans le bon ordre",
    image: "/sequence.svg",
    link: "/tests/sequenceMemory",
    rules: "Mémorisez la séquence qui s'affiche et reproduisez-la dans le même ordre. À chaque niveau, la séquence s'allonge d'un clic."
  },
  {
    title: "Vitesse de frappe",
    description: "Testez votre vitesse de frappe au clavier",
    image: "/keyboard.svg",
    link: "/tests/typingSpeed",
    rules: "Tapez les mots qui apparaissent à l'écran aussi vite et précisément que possible. Vous avez 60 secondes pour taper le maximum de mots."
  }
];

export default function Home() {
  const testsRef = useRef<HTMLDivElement>(null);

  const scrollToTests = () => {
    testsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* Section d'accueil */}
      <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="z-10 flex flex-col items-center justify-between h-full w-full py-16">
          {/* Titre en haut */}
          <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-200 dark:to-gray-100 animate-gradient text-center w-full px-4">
            Human Capacities
          </h1>
          
          {/* Carrousel au milieu */}
          <div className="my-12 w-full flex items-center justify-center perspective">
            <div className="carousel-wheel">
              {capacityTests.concat(capacityTests).map((test, i) => (
                <div key={i} className="carousel-item-wheel" style={{ 
                  transform: `rotateY(${i * (360 / (capacityTests.length * 2))}deg) translateZ(min(350px, 45vw))` 
                }}>
                  <img 
                    src={test.image} 
                    alt={test.title} 
                    className="w-12 h-12 md:w-24 md:h-24 opacity-80 drop-shadow-md" 
                  />
                </div>
              ))}
            </div>
          </div>
          
          {/* Texte et bouton en bas */}
          <div className="text-center px-4">
            <p className="text-lg md:text-2xl mb-8 md:mb-12 text-gray-700 dark:text-gray-200">
              Évaluez vos capacités avec une série de tests cognitifs
            </p>
            <button 
              onClick={scrollToTests}
              className="px-5 sm:px-8 py-3 sm:py-4 bg-gray-800 dark:bg-gray-700 text-white rounded-full text-base sm:text-lg font-medium transform hover:translate-y-[-2px] transition-all duration-300 shadow-md"
            >
              Commencer
            </button>
          </div>
        </div>
      </section>

      {/* Bannière publicitaire entre les sections */}
      <div className="w-full flex justify-center py-4 bg-white dark:bg-gray-900">
        <AdBanner 
          slot="1234567890" // Remplacez par votre ID de slot
          format="horizontal"
          className="mx-auto"
        />
      </div>

      {/* Section des tests */}
      <div ref={testsRef} className="min-h-screen p-4 sm:p-8 bg-gray-50 dark:bg-gray-900" id="tests-section">
        <main className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6 sm:mb-12 text-gray-800 dark:text-white">
            Explorez notre gamme de tests cognitifs
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {capacityTests.map((test, index) => (
              <TestCard 
                key={index}
                title={test.title}
                description={test.description}
                image={test.image}
                link={test.link}
                rules={test.rules}
              />
            ))}
          </div>
        </main>
      </div>

      <style jsx global>{`
        .perspective {
          perspective: 1500px;
        }
        
        .carousel-wheel {
          position: relative;
          width: 150px;
          height: 150px;
          transform-style: preserve-3d;
          animation: rotate 30s linear infinite;
        }
        
        .carousel-item-wheel {
          position: absolute;
          width: 150px;
          height: 150px;
          display: flex;
          align-items: center;
          justify-content: center;
          transform-style: preserve-3d;
          backface-visibility: hidden;
        }
        
        @media (max-width: 768px) {
          .perspective {
            perspective: 1000px;
          }
          
          .carousel-wheel {
            transform: scale(0.7);
            width: 120px;
            height: 120px;
          }
          
          .carousel-item-wheel {
            transform-origin: center;
            width: 120px;
            height: 120px;
          }
        }
        
        @keyframes rotate {
          0% {
            transform: rotateY(0deg);
          }
          100% {
            transform: rotateY(360deg);
          }
        }
        
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 8s ease infinite;
        }
      `}</style>
    </>
  );
}
