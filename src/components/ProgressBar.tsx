"use client"

import { useEffect, useState } from "react";

interface ProgressBarProps {
  duration: number;
  isActive?: boolean;
  className?: string;
  onComplete?: () => void;
}

export default function ProgressBar({ 
  duration, 
  isActive = true, 
  className = "", 
  onComplete 
}: ProgressBarProps) {
  const [isRunning, setIsRunning] = useState(false);
  
  useEffect(() => {
    if (isActive && !isRunning) {
      setIsRunning(true);
      
      const timer = setTimeout(() => {
        setIsRunning(false);
        if (onComplete) onComplete();
      }, duration);
      
      return () => clearTimeout(timer);
    } else if (!isActive && isRunning) {
      setIsRunning(false);
    }
  }, [isActive, isRunning, duration, onComplete]);

  return (
    <div className={`absolute bottom-0 left-0 right-0 h-2 bg-gray-200 ${className}`}>
      <div 
        className="h-full bg-blue-500 origin-right"
        style={{
          animation: isRunning ? `countdown ${duration}ms linear forwards` : 'none',
        }}
      />
      <style jsx>{`
        @keyframes countdown {
          0% {
            width: 100%;
          }
          100% {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
} 