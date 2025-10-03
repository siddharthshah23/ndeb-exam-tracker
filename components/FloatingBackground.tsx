'use client';

import { useEffect, useState } from 'react';

interface FloatingBackgroundProps {
  density?: 'low' | 'medium' | 'high';
  progressPercentage?: number;
}

export default function FloatingBackground({ density = 'medium', progressPercentage = 0 }: FloatingBackgroundProps) {
  const [elements, setElements] = useState<Array<{ id: number; type: 'butterfly' | 'flower'; emoji: string; left: number; delay: number; duration: number }>>([]);

  useEffect(() => {
    const densityMap = { low: 5, medium: 8, high: 12 };
    const count = densityMap[density];
    
    // More elements appear as progress increases
    const actualCount = Math.min(count, Math.ceil((progressPercentage / 100) * count) + 2);

    const butterflies = ['🦋', '🦋', '🦋'];
    const flowers = ['🌸', '🌺', '🌼', '🌷', '🌻', '🪷'];
    
    const newElements = Array.from({ length: actualCount }, (_, i) => {
      const isButterfly = Math.random() > 0.4;
      return {
        id: i,
        type: isButterfly ? 'butterfly' as const : 'flower' as const,
        emoji: isButterfly ? butterflies[Math.floor(Math.random() * butterflies.length)] : flowers[Math.floor(Math.random() * flowers.length)],
        left: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 8 + Math.random() * 8,
      };
    });
    
    setElements(newElements);
  }, [density, progressPercentage]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30 dark:opacity-20">
      {elements.map((element) => (
        <div
          key={element.id}
          className={`absolute text-2xl ${element.type === 'butterfly' ? 'animate-flutter' : 'animate-float'}`}
          style={{
            left: `${element.left}%`,
            animationDelay: `${element.delay}s`,
            animationDuration: `${element.duration}s`,
          }}
        >
          {element.emoji}
        </div>
      ))}
    </div>
  );
}

