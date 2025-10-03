'use client';

import { useEffect, useState } from 'react';

interface ConfettiProps {
  trigger: boolean;
  onComplete?: () => void;
}

export default function Confetti({ trigger, onComplete }: ConfettiProps) {
  const [pieces, setPieces] = useState<Array<{ id: number; left: number; delay: number; duration: number; color: string }>>([]);

  useEffect(() => {
    if (trigger) {
      // Create 50 confetti pieces
      const newPieces = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.3,
        duration: 2 + Math.random() * 1,
        color: ['#EC4899', '#8B5CF6', '#10B981', '#F59E0B', '#3B82F6', '#F43F5E'][Math.floor(Math.random() * 6)]
      }));
      setPieces(newPieces);

      // Clear confetti after animation
      const timer = setTimeout(() => {
        setPieces([]);
        onComplete?.();
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [trigger, onComplete]);

  if (pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-3 h-3 animate-confetti-fall"
          style={{
            left: `${piece.left}%`,
            top: '-20px',
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
    </div>
  );
}

